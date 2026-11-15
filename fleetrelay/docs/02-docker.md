# 2. Docker — postavljanje na oba računara

## 2.1 Šta Docker radi, a šta ne

| Računar | Kontejneri | Go procesi |
|---|---|---|
| Computer-A | Kafka, kafka-init (jednokratno), MongoDB | `go-producer` na **hostu** |
| Computer-B | PostgreSQL, Redis | `go-consumer` i `cmd/api` na **hostu** |

U CORE-u Go **nije** u image-u. Razlog: brži ciklus posle 4 godine pauze (`go run`), lakši pprof, manje borbe sa Docker Desktop mrežom. Dockerfile-ovi za binarne dolaze tek kad lokalni tok radi (Dan 9).

Kafka broker živi **samo u compose.a**. Compose.b nema Kafka servis.

## 2.2 Preduslovi (Windows 10/11, oba računara)

1. Omogući **WSL2** (Docker Desktop ga zahteva).
2. Instaliraj [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/).
3. Settings → General: koristi **WSL2 engine**.
4. Settings → Resources:
   - **Computer-A:** najmanje 4 CPU, **6–8 GB RAM** (Kafka heap 1g + Mongo + burst).
   - **Computer-B:** 2–4 CPU, **4 GB RAM** dovoljno za Postgres+Redis.
5. Settings → Resources → File sharing: folder u kom je `fleetrelay` mora biti deljen.
6. Provera u PowerShell:

```powershell
docker version
docker compose version
wsl --status
```

Očekuj `Server` deo u `docker version`. Ako ga nema, Docker Engine nije podignut.

Opciono na hostu (nije kontejner): Go 1.24+, `golangci-lint`, `mongosh` / `psql` / `redis-cli` za debug. Sve to može i `docker exec`.

## 2.3 Fajlovi

| Fajl | Gde se koristi |
|---|---|
| `deploy/compose.a.yml` | samo A, ili lokalni dev za ingest |
| `deploy/compose.b.yml` | samo B, ili lokalni dev za domen |
| `deploy/env.a.example` → `deploy/.env.a` | A |
| `deploy/env.b.example` → `deploy/.env.b` | B |
| `deploy/mongo-init.js` | prvi start Mongo volumena |
| `deploy/kafka-init.sh` | kreira topic-e; **LF** line endings (ne CRLF) |
| `migrations/postgres/000001_init.up.sql` | montira se u Postgres initdir |

Ako `kafka-init` odmah umre sa `$'\r': command not found`, konvertuj `kafka-init.sh` na LF (VS Code: status bar „CRLF“ → „LF“).

## 2.4 Jedna mašina (dnevni razvoj)

U `deploy/`:

```powershell
Copy-Item env.a.example .env.a
Copy-Item env.b.example .env.b
# KAFKA_EXTERNAL_HOST=localhost u .env.a
# FLEETRELAY_KAFKA_BROKERS=127.0.0.1:9092 u .env.b

docker compose --env-file .env.a -f compose.a.yml up -d
docker compose --env-file .env.b -f compose.b.yml up -d

docker compose --env-file .env.a -f compose.a.yml ps
docker compose --env-file .env.b -f compose.b.yml ps
```

Čekaj `healthy` na `fleetrelay-kafka`, `fleetrelay-mongo`, `fleetrelay-postgres`, `fleetrelay-redis`. `fleetrelay-kafka-init` sme da bude `Exited (0)`.

Portovi na localhost:

| Port | Servis |
|---|---|
| 9092 | Kafka EXTERNAL |
| 27017 | MongoDB |
| 5432 | PostgreSQL |
| 6379 | Redis |

Sudar portova (lokalni Postgres/Mongo): promeni `*_PORT` u env fajlu.

Zaustavljanje bez brisanja podataka:

```powershell
docker compose --env-file .env.a -f compose.a.yml stop
docker compose --env-file .env.b -f compose.b.yml stop
```

Reset volumena (uništava outbox, Kafka log, Postgres, Redis):

```powershell
docker compose --env-file .env.a -f compose.a.yml down -v
docker compose --env-file .env.b -f compose.b.yml down -v
```

Posle `down -v`, `mongo-init.js` i SQL init se ponovo izvršavaju.

## 2.5 Dva računara na istom WiFi-ju

### Na Computer-A

1. `ipconfig` → IPv4 WiFi adaptera, npr. `192.168.0.10`.
2. U `.env.a`: `KAFKA_EXTERNAL_HOST=192.168.0.10` (**ne** `localhost`, **ne** Docker IP `172.x`).
3. Windows Defender Firewall: inbound TCP **9092** (Kafka). Mongo **27017 ne otvaraj** ka LAN-u.
4. `docker compose --env-file .env.a -f compose.a.yml up -d`
5. Provera sa A: `Test-NetConnection 127.0.0.1 -Port 9092`

**Obavezno** `down` pa `up` posle izmene `KAFKA_EXTERNAL_HOST`. Advertised listener se pali samo pri startu brokera. Stari volumen sme da ostane; env listenera je u kontejneru.

### Na Computer-B

1. Ping `192.168.0.10`.
2. `Test-NetConnection 192.168.0.10 -Port 9092` mora `TcpTestSucceeded : True`.
3. U `.env.b`: `FLEETRELAY_KAFKA_BROKERS=192.168.0.10:9092`.
4. Compose.b (samo Postgres+Redis) — **nema** Kafka kontejnera.
5. `go-consumer` čita `FLEETRELAY_KAFKA_BROKERS`.

Ako `Test-NetConnection` padne: privatni WiFi profil, AP isolation (guest mreža), pogrešan IP, broker advertised i dalje `localhost` (B se konektuje, broker odgovara „idi na localhost“ → B pokušava samog sebe). To je klasični Kafka Docker bug; vidi poglavlje 3.

### Šta ne raditi

- Ne podiži drugi Kafka broker na B „da bude kopija“.
- Ne koristi `network_mode: host` na Docker Desktop Windows — ne radi kao na Linuxu.
- Ne bind-uj Kafka na `127.0.0.1` unutar kontejnera; sluša `0.0.0.0`, a **advertised** nosi LAN IP.

## 2.6 Healthcheck i uobičajene greške

| Simptom | Uzrok | Akcija |
|---|---|---|
| `kafka-init` restart loop | Broker još nije spreman / CRLF u `.sh` | `docker logs fleetrelay-kafka`; LF na skripti |
| Mongo init nije napravio indekse | Volumen već postoji | `down -v` ili indekse iz `mongosh` |
| Postgres prazan posle izmene SQL-a | Initdir radi samo na praznom volumenу | `down -v` ili ručni `psql -f` |
| `port is already allocated` | Lokalni servis na 5432/6379/27017/9092 | promeni port u env ili ugasi lokalni servis |
| Docker sporo na A tokom burst-a | Mali RAM Desktopu | povecaj RAM; smanji `KAFKA_HEAP_OPTS` samo ako OOM-uje Desktop, ne Kafka |

## 2.7 Kasnije: image za Go (Dan 9)

Multi-stage Dockerfile po binary-ju (`cmd/go-producer`, `cmd/go-consumer`, `cmd/api`). Compose tada dobija servise `producer` / `consumer` / `api` na istim mrežama. To je **dodatak**, ne uslov za prvu nedelju. Producer kontejner na A mora Kafka bootstrap `kafka:29092` (INTERNAL), ne `localhost:9092`. Consumer kontejner na B i dalje vidi A preko `EXTERNAL` LAN IP — kontejner na B nema `kafka` DNS ime sa mašine A.

## 2.8 Minimalni smoke Docker-a (bez Go koda)

**A:**

```powershell
docker exec fleetrelay-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:29092 --list
docker exec fleetrelay-mongo mongosh -u fleetrelay -p fleetrelay --authenticationDatabase admin --eval "db.getSiblingDB('fleetrelay').getCollectionNames()"
```

Očekuj topic-e `fleet.*.v1` i kolekcije `outbox`, `generator_state`.

**B:**

```powershell
docker exec fleetrelay-postgres pg_isready -U fleetrelay
docker exec fleetrelay-postgres psql -U fleetrelay -d fleetrelay -c "\dt"
docker exec fleetrelay-redis redis-cli ping
```

Očekuj tabele iz migracije i `PONG`.
