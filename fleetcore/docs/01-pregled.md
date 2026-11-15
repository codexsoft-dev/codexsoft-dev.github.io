# 1. Pregled sistema

## 1.1 Svrha

**FleetRelay** je MVP backend za **fleet / driver / vehicle** domen (Andersen oglas: high-load ride-hailing platforma). Ime je namerno: A ne zove B sinhrono — *relay* je Kafka granica između ingest-a i domena. Nije produkcioni matching/GPS stack. Jeste trenažer i portfolio komad koji pokazuje:

- povratak u Go posle pauze (muscle memory);
- high-load ingest (Kafka + outbox);
- SQL, Redis, gRPC, observability, testove;
- patterne: Outbox, Worker Pool, Fan-In, Fan-Out, Idempotency, SAGA.

Budžet: **5 × 4h / nedelja**, 2–3 nedelje (40–60h). Nivo: medior, 1.5 god. Go + 4 godine pauze. Formalni prag oglasa (5+ god. senior) se ovim **ne briše**; briše se zastajkivanje na tehničkom.

## 1.2 Topologija

```
Computer-A (ingest)                         Computer-B (domen)
┌─────────────────────────────┐             ┌────────────────────────────────┐
│ cmd/go-producer             │             │ cmd/go-consumer                │
│ MongoDB  :27017             │   WiFi/LAN  │ Redis      :6379               │
│ Kafka    :9092  ────────────┼────────────►│ PostgreSQL :5432               │
│ metrike  :9091              │   Kafka     │ cmd/api HTTP :8080  gRPC :9090 │
└─────────────────────────────┘   klijent   │ metrike :9092 / :9093          │
                                            └────────────────────────────────┘
```

| Računar | Šta radi | Šta NE radi |
|---|---|---|
| **A** | Generiše dummy evente, Mongo outbox, Kafka **broker** | Ne drži istinu o vozaču, nema Postgres/Redis |
| **B** | Kafka **klijent**, obrada, Redis, Postgres, REST/gRPC | Ne hostuje Kafka broker, ne piše u Mongo |

Kafka se **ne instalira kao broker na oba računara**. Na B postoji samo klijent (Go biblioteka). To je namerno: jedan broker, dva procesa, jasna granica.

Razvoj na **jednoj** mašini: oba compose fajla, `KAFKA_EXTERNAL_HOST=localhost`, `FLEETRELAY_KAFKA_BROKERS=127.0.0.1:9092`.

## 1.3 Load profil

Env na A (vidi `deploy/env.a.example`):

| Promenljiva | Podrazumevano | Značenje |
|---|---|---|
| `FLEETRELAY_BURST_RATE` | `20000` | eventa u sekundi tokom burst-a |
| `FLEETRELAY_BURST_DURATION` | `7m` | trajanje svakog burst-a |
| `FLEETRELAY_IDLE_BETWEEN_BURSTS` | `26m30s` | tišina između burst-ova |
| `FLEETRELAY_BURSTS_PER_CYCLE` | `3` | broj burst-ova |
| `FLEETRELAY_CYCLE_PAUSE` | `1h` | pauza posle trećeg burst-a |

Ciklus: `7m @ 20k/s → 26.5m 0 → 7m @ 20k/s → 26.5m 0 → 7m @ 20k/s → 1h 0`.

Jedan ciklus ≈ **25,2 miliona** poruka. 20k/s je **cilj merenja**, ne DoD prvog compose-a. CORE prolazi na stotinama–par hiljada/s. Arhitektura (batch, pool, backpressure) mora da *dozvoljava* 20k/s.

Mix: **98%** `driver.heartbeat`, **1.5%** `verification.submitted`, **0.5%** `vehicle.classify.requested`. High-load je telemetrija, ne KYC CRUD.

## 1.4 Katalog ID-jeva (deljeni između A i B)

Producer ne sme da šalje heartbeat za vozača kog B ne poznaje. Oba binarna koriste isti generator:

```
partner_id  = UUID v5(namespace, "partner/{i}")
driver_id   = UUID v5(namespace, "driver/{i}")
vehicle_id  = UUID v5(namespace, "vehicle/{i}")
```

`FLEETRELAY_CATALOG_*` mora biti **identičan** na A i B. B ima `cmd/seed` koji upisuje katalog u Postgres pre loada. A samo bira `i ∈ [0, N)`.

## 1.5 Šta je u obimu, šta nije

**U obimu:** dummy ingest, outbox, Kafka, Redis presence, SQL domen + rollup, SAGA onboarding, gRPC, REST, Docker, CI, merenje, pprof.

**Van obima:** Terraform, Figma, pravi AWS, Schema Registry, Kafka Streams, frontend, pravi KYC/S3, Kubernetes (stretch), generički `Repository[T]`, `unsafe` u `internal/`.

## 1.6 Tehnološki stek

| Sloj | Izbor |
|---|---|
| Jezik | Go 1.24+ |
| Kafka klijent | `github.com/twmb/franz-go` (20k/s); `segmentio/kafka-go` dozvoljen u prvoj nedelji |
| Mongo | `go.mongodb.org/mongo-driver` |
| Postgres | `github.com/jackc/pgx/v5` |
| Migracije | `github.com/golang-migrate/migrate/v4` (compose.b takođe montira init SQL) |
| Redis | `github.com/redis/go-redis/v9` |
| HTTP | `net/http` ServeMux (Go 1.22+ patterns) |
| gRPC | `google.golang.org/grpc` + `buf` |
| Log | `log/slog` JSON |
| Metrike | Prometheus `client_golang` |
| Tracing | OpenTelemetry → Jaeger (EXTENDED) |
| Lint | golangci-lint |
