-- FleetRelay PostgreSQL v1 — Computer-B, izvor istine za domen.
-- Idempotentno-ish: CREATE ... IF NOT EXISTS gde ima smisla.
-- UUID-ovi kataloga (partners/drivers/vehicles) dolaze iz aplikacije (deterministički seed),
-- ne iz DEFAULT, da A i B dele iste ID-jeve.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. partners — fleet operator
-- ---------------------------------------------------------------------------
CREATE TABLE partners (
    id            UUID PRIMARY KEY,
    name          TEXT NOT NULL,
    country_code  CHAR(2) NOT NULL,
    status        TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT partners_status_chk
        CHECK (status IN ('active', 'suspended')),
    CONSTRAINT partners_country_chk
        CHECK (country_code ~ '^[A-Z]{2}$')
);

CREATE INDEX partners_country_status_idx
    ON partners (country_code, status);

-- ---------------------------------------------------------------------------
-- 2. drivers — vozač vezan za tačno jednog partnera
-- ---------------------------------------------------------------------------
CREATE TABLE drivers (
    id                 UUID PRIMARY KEY,
    partner_id         UUID NOT NULL,
    full_name          TEXT NOT NULL,
    license_no         TEXT NOT NULL,
    license_expires_at DATE NOT NULL,
    status             TEXT NOT NULL,
    rejection_reason   TEXT,
    verified_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT drivers_partner_fk
        FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE RESTRICT,
    CONSTRAINT drivers_status_chk
        CHECK (status IN ('pending', 'in_review', 'verified', 'rejected')),
    CONSTRAINT drivers_license_uniq
        UNIQUE (partner_id, license_no),
    CONSTRAINT drivers_verified_consistency_chk
        CHECK (
            (status = 'verified' AND verified_at IS NOT NULL)
            OR (status <> 'verified' AND verified_at IS NULL)
        )
);

CREATE INDEX drivers_partner_status_idx ON drivers (partner_id, status);
CREATE INDEX drivers_in_review_idx ON drivers (updated_at)
    WHERE status = 'in_review';
CREATE INDEX drivers_license_expiry_idx ON drivers (license_expires_at)
    WHERE status = 'verified';

-- ---------------------------------------------------------------------------
-- 3. vehicles — vozilo partnera, opciono dodeljeno vozaču
-- ---------------------------------------------------------------------------
CREATE TABLE vehicles (
    id             UUID PRIMARY KEY,
    partner_id     UUID NOT NULL,
    driver_id      UUID,
    plate          TEXT NOT NULL,
    seats          SMALLINT NOT NULL,
    year           SMALLINT NOT NULL,
    class          TEXT NOT NULL,
    classified_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT vehicles_partner_fk
        FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE RESTRICT,
    CONSTRAINT vehicles_driver_fk
        FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE SET NULL,
    CONSTRAINT vehicles_class_chk
        CHECK (class IN ('unclassified', 'economy', 'comfort', 'xl')),
    CONSTRAINT vehicles_seats_chk
        CHECK (seats BETWEEN 1 AND 8),
    CONSTRAINT vehicles_year_chk
        CHECK (year BETWEEN 1990 AND 2100),
    CONSTRAINT vehicles_plate_uniq
        UNIQUE (partner_id, plate)
);

CREATE INDEX vehicles_partner_class_idx ON vehicles (partner_id, class);
CREATE INDEX vehicles_driver_idx ON vehicles (driver_id)
    WHERE driver_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. sagas — orkestracija driver onboarding-a
-- ---------------------------------------------------------------------------
CREATE TABLE sagas (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saga_type        TEXT NOT NULL,
    driver_id        UUID NOT NULL,
    vehicle_id       UUID,
    trigger_event_id TEXT NOT NULL,
    state            TEXT NOT NULL,
    current_step     TEXT,
    last_error       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ,
    CONSTRAINT sagas_driver_fk
        FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE RESTRICT,
    CONSTRAINT sagas_vehicle_fk
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE SET NULL,
    CONSTRAINT sagas_type_chk
        CHECK (saga_type IN ('driver_onboarding')),
    CONSTRAINT sagas_state_chk
        CHECK (state IN ('running', 'completed', 'compensating', 'compensated', 'failed')),
    CONSTRAINT sagas_trigger_uniq
        UNIQUE (trigger_event_id)
);

CREATE INDEX sagas_driver_idx ON sagas (driver_id, created_at DESC);
CREATE INDEX sagas_running_idx ON sagas (updated_at)
    WHERE state IN ('running', 'compensating');

-- ---------------------------------------------------------------------------
-- 5. saga_steps — jedan korak SAGA-e, idempotentan po (saga_id, step_name)
-- ---------------------------------------------------------------------------
CREATE TABLE saga_steps (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saga_id           UUID NOT NULL,
    step_name         TEXT NOT NULL,
    step_order        SMALLINT NOT NULL,
    status            TEXT NOT NULL,
    attempt           INT NOT NULL DEFAULT 0,
    request_payload   JSONB,
    response_payload  JSONB,
    error             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT saga_steps_saga_fk
        FOREIGN KEY (saga_id) REFERENCES sagas (id) ON DELETE CASCADE,
    CONSTRAINT saga_steps_status_chk
        CHECK (status IN ('pending', 'succeeded', 'failed', 'compensated')),
    CONSTRAINT saga_steps_name_chk
        CHECK (step_name IN (
            'persist_driver',
            'classify_vehicle',
            'run_compliance',
            'mark_verified',
            'compensate_unclassify',
            'compensate_reject_driver'
        )),
    CONSTRAINT saga_steps_uniq
        UNIQUE (saga_id, step_name),
    CONSTRAINT saga_steps_order_uniq
        UNIQUE (saga_id, step_order)
);

CREATE INDEX saga_steps_open_idx ON saga_steps (saga_id)
    WHERE status IN ('pending', 'failed');

-- ---------------------------------------------------------------------------
-- 6. driver_status_events — audit log prelaza (iGaming / compliance mišić)
-- ---------------------------------------------------------------------------
CREATE TABLE driver_status_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id    UUID NOT NULL,
    saga_id      UUID,
    from_status  TEXT NOT NULL,
    to_status    TEXT NOT NULL,
    reason       TEXT,
    actor        TEXT NOT NULL,
    event_id     TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT dse_driver_fk
        FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE CASCADE,
    CONSTRAINT dse_saga_fk
        FOREIGN KEY (saga_id) REFERENCES sagas (id) ON DELETE SET NULL,
    CONSTRAINT dse_actor_chk
        CHECK (actor IN ('admin', 'saga', 'system', 'seed')),
    CONSTRAINT dse_event_uniq
        UNIQUE (event_id)
);

CREATE INDEX dse_driver_time_idx ON driver_status_events (driver_id, created_at DESC);

-- event_id sme NULL za seed/admin; UNIQUE u PG dozvoljava više NULL-ova.

-- ---------------------------------------------------------------------------
-- 7. processed_events — SQL rezervna idempotencija (pored Redis NX)
-- ---------------------------------------------------------------------------
CREATE TABLE processed_events (
    event_id       TEXT PRIMARY KEY,
    event_type     TEXT NOT NULL,
    consumer_group TEXT NOT NULL,
    processed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX processed_events_type_time_idx
    ON processed_events (event_type, processed_at DESC);

-- ---------------------------------------------------------------------------
-- 8. heartbeat_minutes — fan-in rollup, NE sirovi GPS
-- ---------------------------------------------------------------------------
CREATE TABLE heartbeat_minutes (
    minute          TIMESTAMPTZ NOT NULL,
    partner_id      UUID NOT NULL,
    ping_count      BIGINT NOT NULL DEFAULT 0,
    unique_drivers  INT NOT NULL DEFAULT 0,
    CONSTRAINT hb_min_pk PRIMARY KEY (minute, partner_id),
    CONSTRAINT hb_min_partner_fk
        FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE,
    CONSTRAINT hb_min_counts_chk
        CHECK (ping_count >= 0 AND unique_drivers >= 0)
);

CREATE INDEX hb_min_time_idx ON heartbeat_minutes (minute DESC);

-- ---------------------------------------------------------------------------
-- 9. report_snapshots — fan-in poslovni izveštaj
-- ---------------------------------------------------------------------------
CREATE TABLE report_snapshots (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_at        TIMESTAMPTZ NOT NULL,
    drivers_by_status  JSONB NOT NULL,
    vehicles_by_class  JSONB NOT NULL,
    online_drivers     INT NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT report_online_chk CHECK (online_drivers >= 0)
);

CREATE INDEX report_snapshots_time_idx ON report_snapshots (snapshot_at DESC);

-- ---------------------------------------------------------------------------
-- 10. outbox_events — OPCIONO (EXTENDED): SQL outbox na B za saga ishode
-- ---------------------------------------------------------------------------
CREATE TABLE outbox_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id      TEXT NOT NULL,
    topic         TEXT NOT NULL,
    partition_key TEXT NOT NULL,
    payload       JSONB NOT NULL,
    published     BOOLEAN NOT NULL DEFAULT FALSE,
    attempts      INT NOT NULL DEFAULT 0,
    last_error    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at  TIMESTAMPTZ,
    CONSTRAINT outbox_event_id_uniq UNIQUE (event_id)
);

CREATE INDEX outbox_unpublished_idx ON outbox_events (created_at)
    WHERE published = FALSE;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_set_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER drivers_set_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER vehicles_set_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER sagas_set_updated_at
    BEFORE UPDATE ON sagas
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER saga_steps_set_updated_at
    BEFORE UPDATE ON saga_steps
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
