# 4. PostgreSQL (Computer-B)

Izvor istine za **domen**: partner, vozač, vozilo, SAGA, audit, rollup. Nije izvor za last-known GPS (to je Redis). Nije outbox ingest-a (to je Mongo na A).

Fajl šeme: [`migrations/postgres/000001_init.up.sql`](../migrations/postgres/000001_init.up.sql). Compose.b ga montira u `docker-entrypoint-initdb.d` (samo na praznom volumenу). Kasnije iste naredbe vozi `golang-migrate`.

Konekcija: `FLEETRELAY_POSTGRES_DSN`. Korisnik/baza `fleetrelay`. U demou `synchronous_commit=off` u compose.b — brži burst rollup, **ne** koristiti za produkcioni novčanik/KYC.

## 4.1 Konvencije

- UUID kao PK, tekstualni status sa `CHECK` (lakše od PG ENUM pri migracijama).
- FK imena: `<child>_<parent>_fk`.
- Vreme: `TIMESTAMPTZ`.
- Katalog (partners/drivers/vehicles): ID **iz aplikacije** (UUID v5), da se poklapa sa producerom.
- `updated_at` puni trigger `set_updated_at()`.

## 4.2 ER dijagram

```mermaid
erDiagram
    partners ||--o{ drivers : "zapošljava"
    partners ||--o{ vehicles : "poseduje"
    partners ||--o{ heartbeat_minutes : "rollup"
    drivers ||--o{ vehicles : "dodeljen"
    drivers ||--o{ sagas : "onboarding"
    drivers ||--o{ driver_status_events : "audit"
    vehicles ||--o{ sagas : "classify korak"
    sagas ||--|{ saga_steps : "ima korake"
    sagas ||--o{ driver_status_events : "opciono"

    partners {
        uuid id PK
        text name
        char country_code
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    drivers {
        uuid id PK
        uuid partner_id FK
        text full_name
        text license_no
        date license_expires_at
        text status
        text rejection_reason
        timestamptz verified_at
        timestamptz created_at
        timestamptz updated_at
    }

    vehicles {
        uuid id PK
        uuid partner_id FK
        uuid driver_id FK
        text plate
        smallint seats
        smallint year
        text class
        timestamptz classified_at
        timestamptz created_at
        timestamptz updated_at
    }

    sagas {
        uuid id PK
        text saga_type
        uuid driver_id FK
        uuid vehicle_id FK
        text trigger_event_id UK
        text state
        text current_step
        text last_error
        timestamptz created_at
        timestamptz updated_at
        timestamptz completed_at
    }

    saga_steps {
        uuid id PK
        uuid saga_id FK
        text step_name
        smallint step_order
        text status
        int attempt
        jsonb request_payload
        jsonb response_payload
        text error
        timestamptz created_at
        timestamptz updated_at
    }

    driver_status_events {
        uuid id PK
        uuid driver_id FK
        uuid saga_id FK
        text from_status
        text to_status
        text reason
        text actor
        text event_id UK
        timestamptz created_at
    }

    processed_events {
        text event_id PK
        text event_type
        text consumer_group
        timestamptz processed_at
    }

    heartbeat_minutes {
        timestamptz minute PK
        uuid partner_id PK_FK
        bigint ping_count
        int unique_drivers
    }

    report_snapshots {
        uuid id PK
        timestamptz snapshot_at
        jsonb drivers_by_status
        jsonb vehicles_by_class
        int online_drivers
        timestamptz created_at
    }

    outbox_events {
        uuid id PK
        text event_id UK
        text topic
        text partition_key
        jsonb payload
        boolean published
        int attempts
        text last_error
        timestamptz created_at
        timestamptz published_at
    }
```

`processed_events` i `outbox_events` nisu FK ka drivers: event može stići pre seed-a / za nepoznat ID (heartbeat se i dalje broji u Redis; SQL rollup zahteva postojećeg partnera).

## 4.3 Rečnik tabela

### `partners`

| Kolona | Tip | Ograničenja | Značenje |
|---|---|---|---|
| `id` | UUID | PK | deterministički iz kataloga |
| `name` | TEXT | NOT NULL | npr. `Partner 42` |
| `country_code` | CHAR(2) | `^[A-Z]{2}$` | ISO 3166-1 alpha-2 |
| `status` | TEXT | `active` \| `suspended` | suspended partner → compliance SAGA pada |
| `created_at` / `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

Relacije: 1 partner → N vozača, N vozila, N heartbeat minuta.

### `drivers`

| Kolona | Tip | Ograničenja | Značenje |
|---|---|---|---|
| `id` | UUID | PK | katalog |
| `partner_id` | UUID | FK `partners.id` RESTRICT | |
| `full_name` | TEXT | NOT NULL | |
| `license_no` | TEXT | UNIQUE `(partner_id, license_no)` | |
| `license_expires_at` | DATE | NOT NULL | compliance |
| `status` | TEXT | pending / in_review / verified / rejected | state machine |
| `rejection_reason` | TEXT | NULL | |
| `verified_at` | TIMESTAMPTZ | NOT NULL iff `verified` | CHECK consistency |
| `created_at` / `updated_at` | TIMESTAMPTZ | | |

State machine (čisti Go paket, ne CHECK svih prelaza u SQL):

```
pending --submit--> in_review --approve--> verified
                 \--reject--> rejected --resubmit--> pending
verified --compliance fail--> in_review
```

### `vehicles`

| Kolona | Tip | Ograničenja | Značenje |
|---|---|---|---|
| `id` | UUID | PK | katalog |
| `partner_id` | UUID | FK partners RESTRICT | mora biti isti kao `drivers.partner_id` ako je `driver_id` setovan (invarijanta u Go) |
| `driver_id` | UUID | FK drivers SET NULL, nullable | dodela |
| `plate` | TEXT | UNIQUE `(partner_id, plate)` | |
| `seats` | SMALLINT | 1–8 | classification |
| `year` | SMALLINT | 1990–2100 | classification |
| `class` | TEXT | unclassified / economy / comfort / xl | |
| `classified_at` | TIMESTAMPTZ | NULL dok unclassified | |
| `created_at` / `updated_at` | TIMESTAMPTZ | | |

Pravila klase (Go, čista funkcija):

| Uslov | `class` |
|---|---|
| `seats >= 6` | `xl` |
| `year >= 2020 AND seats <= 4` | `comfort` |
| inače | `economy` |

### `sagas` / `saga_steps`

Jedna SAGA = jedan `trigger_event_id` (Kafka `event_id`) → UNIQUE. Koraci:

| `step_order` | `step_name` | Happy | Kompenzacija |
|---|---|---|---|
| 1 | `persist_driver` | status `in_review` | — |
| 2 | `classify_vehicle` | class ≠ unclassified | `compensate_unclassify` |
| 3 | `run_compliance` | licenca važi, partner active | `compensate_reject_driver` |
| 4 | `mark_verified` | status verified | — |

`sagas.state`: `running` → `completed` ili `compensating` → `compensated` / `failed`.

### Ostale tabele

| Tabela | Granularnost | Zašto postoji |
|---|---|---|
| `driver_status_events` | 1 red po prelazu | audit / compliance; UNIQUE `event_id` |
| `processed_events` | 1 red po (`event_id`) | SQL backup Redis dedup-a; PK = event_id |
| `heartbeat_minutes` | 1 red po (floor(ts,'minute'), partner) | fan-in; UPSERT `ping_count` |
| `report_snapshots` | periodični JSON | reporting endpoint |
| `outbox_events` | 1 red po saga eventu | EXTENDED SQL outbox na B |

## 4.4 SQL za kreiranje i povezivanje

Izvornik je migracija. Kratak pregled FK (isto što radi up.sql):

```sql
ALTER TABLE drivers
  ADD CONSTRAINT drivers_partner_fk
  FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE RESTRICT;

ALTER TABLE vehicles
  ADD CONSTRAINT vehicles_partner_fk
  FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE RESTRICT;

ALTER TABLE vehicles
  ADD CONSTRAINT vehicles_driver_fk
  FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE SET NULL;

ALTER TABLE sagas
  ADD CONSTRAINT sagas_driver_fk
  FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE RESTRICT;

ALTER TABLE sagas
  ADD CONSTRAINT sagas_vehicle_fk
  FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE SET NULL;

ALTER TABLE saga_steps
  ADD CONSTRAINT saga_steps_saga_fk
  FOREIGN KEY (saga_id) REFERENCES sagas (id) ON DELETE CASCADE;

ALTER TABLE driver_status_events
  ADD CONSTRAINT dse_driver_fk
  FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE CASCADE;

ALTER TABLE driver_status_events
  ADD CONSTRAINT dse_saga_fk
  FOREIGN KEY (saga_id) REFERENCES sagas (id) ON DELETE SET NULL;

ALTER TABLE heartbeat_minutes
  ADD CONSTRAINT hb_min_partner_fk
  FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE;
```

Red drop-a je u `000001_init.down.sql` (deca pre roditelja).

## 4.5 Indeksi — zašto postoje

| Indeks | Upit koji štiti |
|---|---|
| `partners_country_status_idx` | reporting po zemlji |
| `drivers_partner_status_idx` | lista vozača partnera |
| `drivers_in_review_idx` | queue review (partial) |
| `drivers_license_expiry_idx` | compliance scan verified vozača |
| `vehicles_partner_class_idx` | reporting klasa |
| `sagas_trigger_uniq` | idempotentan start SAGA-e |
| `sagas_running_idx` | watchdog zaglavljenih saga |
| `hb_min_time_idx` | poslednji N minuta |
| `outbox_unpublished_idx` | publisher poll (partial) |

## 4.6 Tipični upiti aplikacije

UPSERT rollup (fan-in flusher):

```sql
INSERT INTO heartbeat_minutes (minute, partner_id, ping_count, unique_drivers)
VALUES ($1, $2, $3, $4)
ON CONFLICT (minute, partner_id) DO UPDATE SET
  ping_count = heartbeat_minutes.ping_count + EXCLUDED.ping_count,
  unique_drivers = GREATEST(heartbeat_minutes.unique_drivers, EXCLUDED.unique_drivers);
```

U CORE-u `unique_drivers` sme da bude max-approx iz Redis SCARD pomoćnog seta po minuti; ne mora HyperLogLog.

Prelaz statusa + audit u **jednoj transakciji** (SAGA korak):

```sql
BEGIN;
UPDATE drivers
   SET status = $2, rejection_reason = $3, verified_at = $4
 WHERE id = $1 AND status = $5;  -- optimistic: očekivani from_status
-- rowcount = 0 → illegal transition, ROLLBACK
INSERT INTO driver_status_events (driver_id, saga_id, from_status, to_status, reason, actor, event_id)
VALUES ($1, $6, $5, $2, $7, 'saga', $8);
COMMIT;
```

Reporting (CORE fallback ako nema snapshot-a):

```sql
SELECT d.status, COUNT(*)
FROM drivers d
JOIN partners p ON p.id = d.partner_id
WHERE p.status = 'active'
GROUP BY d.status;
```

Ovo nije 20k/s put. 20k/s put ne dira `drivers`.

## 4.7 Seed

`cmd/seed` insertuje `FLEETRELAY_CATALOG_*` partnera/vozača/vozila. Vozači startuju kao `pending`, licence: 90% datum +1 godina, 10% juče (za kompenzaciju). Vozila: raspodela seats/year da sve tri klase postoje. `ON CONFLICT DO NOTHING`.

## 4.8 Scaling beleške (za intervju, ne v1 kod)

- `heartbeat_minutes` particioniši po `RANGE (minute)` mesečno kad preraste.
- Reporting sa **read replica**.
- Shard po `country_code` / `partner_id` tek kad jedan primary ne drži write.
- Sirovi heartbeat u Postgres = anti-pattern ovog MVP-a.

## 4.9 Ručna provera

```powershell
docker exec -it fleetrelay-postgres psql -U fleetrelay -d fleetrelay
```

```sql
\dt
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint WHERE contype = 'f' ORDER BY 2;
```
