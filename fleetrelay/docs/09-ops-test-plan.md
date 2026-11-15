# 9. Operacije, testovi, plan rada, DoD

## 9.1 Env — kompletan spisak

Prefiks `FLEETRELAY_`. Vidi i `deploy/env.a.example`, `env.b.example`.

**A (producer):** `MONGO_URI`, `KAFKA_BROKERS`, `BURST_RATE`, `BURST_DURATION`, `IDLE_BETWEEN_BURSTS`, `BURSTS_PER_CYCLE`, `CYCLE_PAUSE`, `CATALOG_*`, `MIX_*`, `GENERATOR_WORKERS`, `OUTBOX_FLUSH_MAX`, `OUTBOX_FLUSH_EVERY`, `PUBLISHER_BATCH`, `PUBLISHER_EVERY`, `PRODUCER_METRICS_ADDR`.

**B (consumer/api/seed):** `POSTGRES_DSN`, `REDIS_ADDR`, `KAFKA_BROKERS`, `KAFKA_GROUP_*`, `WORKER_CONCURRENCY`, `WORKER_QUEUE`, `HEARTBEAT_FLUSH_*`, `DEDUP_TTL`, `PRESENCE_STALE`, `API_HTTP_ADDR`, `API_GRPC_ADDR`, `CONSUMER_METRICS_ADDR`, `API_METRICS_ADDR`, `CATALOG_*`.

Katalog **isti** na A i B.

## 9.2 Redosled podizanja

### Jedna mašina

1. Docker Desktop.
2. `compose.a` + `compose.b` up, healthz kontejnera.
3. `go run ./cmd/seed`
4. `go run ./cmd/api`
5. `go run ./cmd/go-consumer`
6. `go run ./cmd/go-producer` sa **niskim** `BURST_RATE=100` prvi put.
7. `GET /v1/presence`, `mongosh` unpublished, `kafka-consumer-groups --describe`.

### Dva računara

1. A: compose.a, `KAFKA_EXTERNAL_HOST=<A-IP>`, firewall 9092.
2. B: compose.b, seed, api, consumer sa `KAFKA_BROKERS=<A-IP>:9092`.
3. Sa B: `kafka-topics --bootstrap-server <A-IP>:9092 --list`.
4. A: producer.

## 9.3 CI

`.github/workflows/ci.yml`:

```yaml
# na push/PR: golangci-lint, go test ./...
# bez Docker servisa u CORE CI
```

Integration job sa compose je EXTENDED (`go test -tags=integration`).

## 9.4 Plan dana (20h/nedelja)

Nedelja 1 je rust: toolchain, sećanje, Docker.

| Dan | Isporuka | Seći ako kasniš |
|---|---|---|
| 1 | modul, slog, `catalog`, `event`, scheduler koji **printuje** RPS bez I/O | lint savršenstvo |
| 2 | compose.a, Mongo, outbox Writer + indeksi, 10k insert test | TTL |
| 3 | Kafka, publisher, console consumer vidi heartbeat | acks=all na heartbeat |
| 4 | compose.b, migracija, `cmd/seed`, `cmd/api` GET partner/driver | gRPC |
| 5 | consumer presence: Redis HASH+ZSET, GET /v1/presence | ingest SQL |
| 6 | pool + heartbeat Buffer + UPSERT minutes | unique_drivers preciznost |
| 7 | `status` paket + driver.Store.Transition + gRPC skeleton | buf rabbit hole: protoc ručno |
| 8 | SAGA happy path kroz verification topic | kompenzacija |
| 9 | kompenzacija expired license; dupli event_id test; CI | testcontainers |
| 10 | README + decisions + smoke skripta; **DoD CORE** | novi pattern |
| 11 | load profil env; merenje 0.5k → 2k → 20k; pprof A | Grafana |
| 12 | Prometheus lag/outbox/online; slog polja | Jaeger |
| 13 | dva PC-a, `docs` networking checklist, 60s burst | 7 min × 3 |
| 14 | pprof B, Jaeger A→B, kate reflection/unsafe van hot path | unsafe u internal |
| 15 | interview-prep, aws-plan, scaling-notes sa **brojkama** | K8s |

## 9.5 Definition of Done

**CORE**

- [ ] compose.a i compose.b healthy na jednoj mašini
- [ ] seed kataloga
- [ ] producer: dummy → Mongo unpublished → Kafka topic
- [ ] consumer presence: Redis last + online
- [ ] consumer ingest: redovi u `heartbeat_minutes`
- [ ] SAGA verified + jedna kompenzacija
- [ ] isti `event_id` ne pravi dve SAGA
- [ ] worker pool test (shutdown)
- [ ] REST GET driver/presence
- [ ] gRPC DriverService odgovara
- [ ] CI lint + unit test
- [ ] nema `Repository[T]`, nema `unsafe` u `internal/`

**EXTENDED**

- [ ] load profil kodiran
- [ ] tabela: target RPS vs stvarni, outbox depth, lag, gde puca
- [ ] B čita A preko WiFi bar 60s
- [ ] `/metrics` na A i B
- [ ] interview-prep.md

**Nije DoD:** tačnih 20 000/s, K8s, Grafana, Terraform, Schema Registry.

## 9.6 Red sečenja

1. K8s / Grafana / Terraform  
2. Jaeger  
3. SQL outbox na B  
4. Fizička dva PC-a (ostaje compose A/B na jednoj mašini)  
5. Tačnih 20k/s (ostaje merenje)  
6. SAGA kompenzacija (zadrži happy path)  
7. Nikad: Mongo outbox, Kafka, Redis tri strukture, pool, idempotencija, SQL batch, state machine  

## 9.7 Intervju — šta nosiš

Repo + `docker compose` + `docs/01`–`09`. Priča:

> Granica sistema je mreža: ingest (Mongo outbox → Kafka) i domen (Redis + Postgres + SAGA). High-load je heartbeat, ne verification. 20k/s je profil koji merim. Patterni nisu nalepnice — outbox čuva produce, fan-out deli presence od SQL-a, fan-in čuva Postgres, SAGA ne vozi telemetry.

iGaming analogija: tick/odds stream ≈ heartbeat; settlement ≈ SAGA; wallet write-then-event ≈ outbox; in-play cache ≈ Redis.

## 9.8 AWS (samo papir, `docs` kad dođe Dan 15)

| Ovde | Tamo |
|---|---|
| Kafka na A | MSK |
| Mongo outbox | DocumentDB ili Atlas |
| Postgres | RDS |
| Redis | ElastiCache |
| go-producer / consumer / api | ECS Fargate, odvojeni servisi |
| WiFi | SG + PrivateLink, ne public 9092 |

## 9.9 Licenca i tajne

Compose lozinke su demo (`fleetrelay/fleetrelay`). Ne guraj `.env.a` / `.env.b` u git. `env.*.example` sme.
