# FleetRelay — specifikacija MVP-a

**FleetRelay** je ime proizvoda: ingest na Computer-A *relaying* evente preko Kafka ka domenu na Computer-B.

Kafka topic-i ostaju `fleet.heartbeat.v1` i slični — to je **domen** (flota), ne ime servisa. Env prefiks je `FLEETRELAY_`. Docker/compose/baze koriste `fleetrelay`.

Ovo **nije** deo Codex Soft sajta. Folder je zaseban projekat: demo za povratak u Go i pripremu za Senior Go (Andersen, fleet / ride-hailing). Pre bilo kakvog commit-a sajta, izvuci `fleetrelay/` u sopstveni git repo.

Čitaj dokumentaciju **redom**:

| # | Dokument | Sadržaj |
|---|---|---|
| 1 | [docs/01-pregled.md](docs/01-pregled.md) | Cilj, budžet, topologija A/B, load profil, šta jeste/nije |
| 2 | [docs/02-docker.md](docs/02-docker.md) | Docker Desktop na oba računara, compose, volumena, healthcheck |
| 3 | [docs/03-kafka.md](docs/03-kafka.md) | Broker **samo na A**, klijent na B, listeneri, topic-i, troubleshooting |
| 4 | [docs/04-postgresql.md](docs/04-postgresql.md) | Tabele, kolone, FK, indeksi, SQL, ER dijagram |
| 5 | [docs/05-mongodb.md](docs/05-mongodb.md) | Kolekcije, polja, indeksi, TTL, primer dokumenata |
| 6 | [docs/06-redis.md](docs/06-redis.md) | Key schema, TTL, veza sa Postgres-om, komande |
| 7 | [docs/07-kostur-i-go.md](docs/07-kostur-i-go.md) | Stablo repo-a, paketi, strukture, funkcije, metode |
| 8 | [docs/08-tokovi-patterni-api.md](docs/08-tokovi-patterni-api.md) | Patterni, sekvence, REST, gRPC, envelope |
| 9 | [docs/09-ops-test-plan.md](docs/09-ops-test-plan.md) | Env, observability, testovi, CI, plan dana, DoD |

Runnable artefakti (deo specifikacije, ne „još jedan tutorial“):

- `deploy/compose.a.yml` — Kafka + MongoDB + init (Computer-A)
- `deploy/compose.b.yml` — PostgreSQL + Redis (Computer-B)
- `deploy/env.a.example`, `deploy/env.b.example`
- `deploy/mongo-init.js` — indeksi outbox-a
- `migrations/postgres/000001_init.up.sql` / `000001_init.down.sql`

Go izvorni kod se **ne** implementira ovim paketom; ovde je kostur i ugovor. Implementacija ide po planu u poglavlju 9.
