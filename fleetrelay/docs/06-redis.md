# 6. Redis (Computer-B)

Redis je **hot path** za presence, dedup i lock. Nije izvor istine za status vozača (Postgres). Nema tabela; „šema“ je konvencija ključeva. Join ka SQL-u je uvek `driver_id` / `event_id` / `partner_id` kao deo ključa.

Persistencija u compose.b: AOF + `save 60 10000`. Posle rekonstrukcije B-a, presence sme da bude prazan dok ne stignu novi heartbeat-i; Postgres ostaje.

## 6.1 Dijagram ključeva i relacija ka Postgres-u

```mermaid
erDiagram
    drivers ||--o| redis_driver_last : "id → HASH"
    drivers ||--o{ redis_online : "id member ZSET"
    drivers ||--o| redis_saga_lock : "id → STRING NX"
    processed_events ||--o| redis_dedup : "event_id → STRING NX"

    redis_driver_last {
        string key "driver:last:{driver_id}"
        string partner_id
        string status_hint
        string lat
        string lng
        string ts
    }

    redis_online {
        string key "drivers:online"
        string member "driver_id"
        double score "unix_ms"
    }

    redis_dedup {
        string key "event:dedup:{event_id}"
        string value "1"
        ttl "24h"
    }

    redis_saga_lock {
        string key "saga:lock:{driver_id}"
        string value "saga_id"
        ttl "30s"
    }
```

## 6.2 Rečnik ključeva

### HASH `driver:last:{driver_id}`

| Field | Tip (string) | Izvor |
|---|---|---|
| `partner_id` | UUID | envelope |
| `lat` | float | heartbeat payload |
| `lng` | float | heartbeat payload |
| `speed_kmh` | float | heartbeat payload |
| `ts` | RFC3339 / unix_ms | `occurred_at` |
| `event_id` | string | poslednji primljeni |

TTL: **90s** (obnovi na svaki heartbeat). Ako vozač utihne, hash nestane; ZSET se čisti stale scan-om.

Ažuriranje: `HSET` + `EXPIRE` u pipeline, ne po field round-trip.

Čitanje za API: `HGETALL driver:last:{id}` pa merge sa `SELECT` iz `drivers` (status, ime).

### ZSET `drivers:online`

| | |
|---|---|
| Key | `drivers:online` |
| Member | `driver_id` |
| Score | `occurred_at` u unix milliseconds |
| Operacija na heartbeat | `ZADD drivers:online <ms> <driver_id>` |
| Online prozor | `FLEETRELAY_PRESENCE_STALE` default 30s |

Broj online: `ZCOUNT drivers:online (now_ms-30000) +inf`.

Čišćenje: periodično `ZREMRANGEBYSCORE drivers:online -inf now_ms-30000` (isti worker, 1 gorutina, ne na svakom eventu).

Ovo je **ista ideja** kao verification queue u starijoj spec-u (ZSET), sada za presence pod loadom. Intervju: ZSET po score-u, ne LIST.

### STRING `event:dedup:{event_id}`

| | |
|---|---|
| Value | `1` ili `event_type` |
| SET | `SET key 1 NX EX 86400` (`FLEETRELAY_DEDUP_TTL`) |
| Semantika | NX=false → duplikat, **ne obrađuj**, commituj Kafka offset |

Prvo Redis NX, pa rad. SQL `processed_events` je drugi sloj za SAGA/verification (jeftino, malo eventa). Za 20k/s heartbeat **nemoj** da pišeš `processed_events` po poruci — Redis NX je dovoljan; ingest group sme da koristi samo NX + buffer.

### STRING `saga:lock:{driver_id}`

| | |
|---|---|
| Value | `saga_id` |
| SET | `SET key saga_id NX EX 30` |
| Del | na završetku SAGA-e |

Sprečava dve grupe/retry da vode onboarding istog vozača. Nije obavezno za CORE happy path; obavezno pre kompenzacije u paraleli.

### Opciono (EXTENDED)

| Key | Tip | Namena |
|---|---|---|
| `hb:min:{partner_id}:{yyyyMMddHHmm}` | SET | članovi = driver_id u toj minuti → `SCARD` za `unique_drivers` |
| `metrics:queue_depth` | STRING | lokalni cache gauge |
| `verify:queue` | ZSET | ako vratiš asinhroni review queue; nije potrebno dok SAGA radi inline |

SET po minuti mora imati TTL ~2h da ne raste zauvek.

## 6.3 Pipeline na heartbeat (Fan-Out u procesu)

Jedan heartbeat, jedan pipeline, jedan round-trip:

```lua
-- ilustracija; u Go: TxPipeline
HSET driver:last:{id} partner_id … lat … lng … ts … event_id …
EXPIRE driver:last:{id} 90
ZADD drivers:online {ms} {id}
SET event:dedup:{event_id} 1 NX EX 86400
```

Redosled u kodu: **prvo SET NX**. Ako nije NX, preskoči HSET/ZADD (već obrađeno).

## 6.4 Veza sa PostgreSQL (nije FK, ali je ugovor)

| Redis | Postgres | Pravilo |
|---|---|---|
| `driver:last` / ZSET member | `drivers.id` | seed kataloga pre loada; nepoznat ID: log + metrika `unknown_driver`, ne insert u `drivers` sa hot patha |
| `event:dedup` | `processed_events.event_id` | SAGA piše oba; heartbeat samo Redis |
| online count | `report_snapshots.online_drivers` | snapshot job čita `ZCOUNT`, ne `COUNT(*)` iz SQL-a |

## 6.5 Šta Redis namerno nije

- Nije queue za 20k/s persist u Postgres (to je in-memory batcher u Go, pa SQL).
- Nije cache celog `drivers` reda u CORE-u (može `Cache[K,V]` kasnije za GET /v1/drivers).
- Nema Redis Cluster u MVP-u; jedan instance.

## 6.6 Ručna provera

```powershell
docker exec -it fleetrelay-redis redis-cli
```

```text
PING
HGETALL driver:last:<uuid>
ZCARD drivers:online
ZREVRANGE drivers:online 0 5 WITHSCORES
GET event:dedup:<event_id>
TTL event:dedup:<event_id>
```
