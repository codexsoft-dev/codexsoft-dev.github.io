DROP TRIGGER IF EXISTS saga_steps_set_updated_at ON saga_steps;
DROP TRIGGER IF EXISTS sagas_set_updated_at ON sagas;
DROP TRIGGER IF EXISTS vehicles_set_updated_at ON vehicles;
DROP TRIGGER IF EXISTS drivers_set_updated_at ON drivers;
DROP TRIGGER IF EXISTS partners_set_updated_at ON partners;
DROP FUNCTION IF EXISTS set_updated_at();

DROP TABLE IF EXISTS outbox_events;
DROP TABLE IF EXISTS report_snapshots;
DROP TABLE IF EXISTS heartbeat_minutes;
DROP TABLE IF EXISTS processed_events;
DROP TABLE IF EXISTS driver_status_events;
DROP TABLE IF EXISTS saga_steps;
DROP TABLE IF EXISTS sagas;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS partners;
