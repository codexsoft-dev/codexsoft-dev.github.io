# 7. Kostur projekta i Go ugovor

Implementacija tek sledi ovaj ugovor. Imena paketa, tipova i metoda su **specifikacija**: menjaš ih samo ako imaš razlog u `docs` odlukama.

Modul: `github.com/<ti>/fleetrelay` (prilagodi putanju). Go 1.24+.

## 7.1 Stablo

```text
fleetrelay/
├── README.md
├── docs/                          # ova specifikacija
├── deploy/
│   ├── compose.a.yml
│   ├── compose.b.yml
│   ├── env.a.example
│   ├── env.b.example
│   ├── mongo-init.js
│   └── kafka-init.sh
├── migrations/postgres/
├── proto/fleetrelay/driver/v1/driver.proto
├── cmd/
│   ├── go-producer/main.go        # Computer-A
│   ├── go-consumer/main.go        # Computer-B
│   ├── api/main.go                # Computer-B HTTP+gRPC
│   └── seed/main.go               # Computer-B katalog
├── internal/
│   ├── catalog/                   # deterministički UUID, deljeno A/B
│   ├── event/                     # envelope + tipovi payload-a
│   ├── gen/                       # samo producer: scheduler, dummy
│   ├── outbox/                    # Mongo outbox + publisher
│   ├── ingest/                    # Kafka produce/consume
│   ├── driver/
│   │   ├── status/                # čista state machine
│   │   ├── postgres.go
│   │   ├── service.go
│   │   ├── grpc.go
│   │   └── http.go
│   ├── vehicle/
│   ├── partner/
│   ├── saga/
│   ├── presence/
│   ├── dedup/
│   ├── heartbeat/
│   ├── report/
│   └── platform/
│       ├── config/
│       ├── pool/
│       ├── batcher/
│       ├── cache/
│       └── obs/
├── .github/workflows/ci.yml
└── go.mod
```

Pravila zavisnosti:

- `cmd/go-producer` **ne** importa `saga`, `driver/postgres`, `presence`.
- `cmd/go-consumer` **ne** importa `gen`, `outbox` (Mongo).
- `internal/driver/status` **ne** importa I/O pakete.
- `internal/platform/*` ne importa domen.

Nema `internal/repository` generičkog. Nema `pkg/`.

## 7.2 `internal/event` — envelope

```go
package event

type Type string

const (
    TypeHeartbeat     Type = "driver.heartbeat"
    TypeVerification  Type = "verification.submitted"
    TypeClassify      Type = "vehicle.classify.requested"
    TypeSagaVerified  Type = "driver.verified"
    TypeSagaRejected  Type = "driver.rejected"
)

type Envelope struct {
    EventID    string          `json:"event_id"`
    EventType  Type            `json:"event_type"`
    OccurredAt time.Time       `json:"occurred_at"`
    PartnerID  string          `json:"partner_id"`
    DriverID   string          `json:"driver_id"`
    VehicleID  string          `json:"vehicle_id,omitempty"`
    Payload    json.RawMessage `json:"payload"`
}

type HeartbeatPayload struct {
    Lat      float64 `json:"lat"`
    Lng      float64 `json:"lng"`
    SpeedKmh float64 `json:"speed_kmh"`
}

type VerificationPayload struct {
    LicenseNo        string `json:"license_no"`
    LicenseExpiresAt string `json:"license_expires_at"` // RFC3339 date
}

type ClassifyPayload struct {
    Seats int `json:"seats"`
    Year  int `json:"year"`
}

func Parse[T any](e Envelope) (T, error)
func (e Envelope) Topic() string          // mapiranje tip → topic
func (e Envelope) PartitionKey() string   // driver_id ili vehicle_id
func NewID(seq uint64) string             // stabilan ID iz seq + cycle
```

`Topic()`:

| Type | Topic |
|---|---|
| heartbeat | `fleet.heartbeat.v1` |
| verification | `fleet.verification.v1` |
| classify | `fleet.vehicle.classify.v1` |
| saga ishodi | `fleet.saga.v1` |

## 7.3 `internal/catalog`

```go
package catalog

const Namespace = "fleetrelay.v1" // UUID namespace string → uuid.MustParse

type Size struct {
    Partners, Drivers, Vehicles int
}

func PartnerID(i int) uuid.UUID
func DriverID(i int) uuid.UUID
func VehicleID(i int) uuid.UUID

func PartnerIndex(id uuid.UUID) (int, bool)
func DriverIndex(id uuid.UUID) (int, bool)

type Entity struct {
    Partner uuid.UUID
    Driver  uuid.UUID
    Vehicle uuid.UUID
}

func At(i int, sz Size) Entity // i modulo Drivers; partner = i % Partners
```

Seed i generator **moraju** zvati iste funkcije.

## 7.4 `internal/platform/pool` — Worker Pool pattern

Koristi se na A (generatori) i B (procesori). Ovo je custom sync primitiv za oglas.

```go
package pool

type Job[T any] func(ctx context.Context, item T) error

type Pool[T any] struct { /* neeksportovana polja */ }

func New[T any](workers, queue int, job Job[T]) *Pool[T]

func (p *Pool[T]) Submit(ctx context.Context, item T) error
    // vraća ErrFull ako je queue pun (backpressure), ctx.Err() ako otkazano,
    // ErrClosed posle Shutdown.

func (p *Pool[T]) Shutdown(ctx context.Context) error
    // prestaje Submit, čeka in-flight ili ctx timeout.

func (p *Pool[T]) Stats() Stats // submitted, completed, dropped, inflight
```

Interno: `jobs chan T`, `sem` nije potreban ako je `len(workers)` gorutina u `for job := range jobs`. `WaitGroup` za shutdown. **Ne** pisati sopstveni mutex umesto `chan`. Testovi: 100 jobova concurrency 4; shutdown usred rada; Submit posle Shutdown.

## 7.5 `internal/platform/batcher` — Fan-In

```go
package batcher

type Flusher[T any] func(ctx context.Context, batch []T) error

type Batcher[T any] struct{}

func New[T any](max int, every time.Duration, flush Flusher[T]) *Batcher[T]
func (b *Batcher[T]) Add(ctx context.Context, item T) error
func (b *Batcher[T]) Flush(ctx context.Context) error
func (b *Batcher[T]) Run(ctx context.Context) error // ticker + shutdown flush
```

Jedna gorutina vlasnik slice-a. Generator/consumer samo `Add`.

## 7.6 `internal/platform/cache` — generics keš (opciono na GET driver)

```go
package cache

type Loader[K comparable, V any] func(ctx context.Context, key K) (V, error)

type Cache[K comparable, V any] struct{}

func New[K comparable, V any](ttl time.Duration, loader Loader[K, V]) *Cache[K, V]
func (c *Cache[K, V]) GetOrLoad(ctx context.Context, key K) (V, error)
func (c *Cache[K, V]) Invalidate(key K)
```

Ne koristiti kao generički SQL repository.

## 7.7 `internal/platform/config`

```go
type ProducerConfig struct {
    MongoURI string
    KafkaBrokers []string
    BurstRate int
    BurstDuration time.Duration
    IdleBetween time.Duration
    BurstsPerCycle int
    CyclePause time.Duration
    MixHeartbeat, MixVerification, MixClassify float64
    GeneratorWorkers int
    OutboxFlushMax int
    OutboxFlushEvery time.Duration
    PublisherBatch int
    PublisherEvery time.Duration
    Catalog catalog.Size
    MetricsAddr string
}

type ConsumerConfig struct {
    PostgresDSN string
    RedisAddr string
    KafkaBrokers []string
    GroupPresence, GroupIngest, GroupSaga string
    WorkerConcurrency, WorkerQueue int
    HeartbeatFlushMax int
    HeartbeatFlushEvery time.Duration
    DedupTTL, PresenceStale time.Duration
    Catalog catalog.Size
    MetricsAddr string
}

func LoadProducer() (ProducerConfig, error)  // env FLEETRELAY_*
func LoadConsumer() (ConsumerConfig, error)
func LoadAPI() (APIConfig, error)
```

## 7.8 Producer — `internal/gen`

```go
package gen

type Scheduler struct {
    cfg config.ProducerConfig
    state Store // Mongo generator_state
}

func NewScheduler(cfg config.ProducerConfig, state Store) *Scheduler
func (s *Scheduler) Run(ctx context.Context, out chan<- event.Envelope) error
func (s *Scheduler) Phase() Phase

type Phase string // burst_1, idle_1, ...

type Store interface {
    Load(ctx context.Context) (Snapshot, error)
    Save(ctx context.Context, snap Snapshot) error
}

type Snapshot struct {
    Cycle int
    Phase Phase
    Seq   uint64
    PhaseStartedAt time.Time
}

func Dummy(seq uint64, sz catalog.Size, mix Mix, now time.Time) event.Envelope
```

`Dummy`: bira tip po `seq` i mix težinama (ne `rand` na svaki event ako želiš reproduktivnost — koristi `seq % 1000`). Heartbeat lat/lng: mali ofset od Beograda + `seq` da payload nije identičan (kompresija).

`cmd/go-producer/main.go`:

```text
main
  load config, slog, metrics HTTP
  mongo client, ensure indexes
  kafka writer
  scheduler.Run → chan Envelope (veličina ~generatorWorkers*2)
  pool of optional transform (identity) OR direktno batcher.Add
  outbox.Writer.Run
  outbox.Publisher.Run
  signal.Notify → cancel → Shutdown
```

## 7.9 `internal/outbox` (Mongo, A)

```go
package outbox

type Document struct {
    ID           string    `bson:"_id"`
    EventType    string    `bson:"event_type"`
    Topic        string    `bson:"topic"`
    PartitionKey string    `bson:"partition_key"`
    Payload      event.Envelope `bson:"payload"`
    OccurredAt   time.Time `bson:"occurred_at"`
    Published    bool      `bson:"published"`
    PublishedAt  *time.Time `bson:"published_at"`
    Attempts     int       `bson:"attempts"`
    LastError    string    `bson:"last_error,omitempty"`
    CreatedAt    time.Time `bson:"created_at"`
    ExpireAt     *time.Time `bson:"expire_at"`
}

func FromEnvelope(e event.Envelope) Document

type Writer struct{}
func NewWriter(coll *mongo.Collection, b *batcher.Batcher[Document]) *Writer
func (w *Writer) Add(ctx context.Context, e event.Envelope) error

func FlushMongo(coll *mongo.Collection) batcher.Flusher[Document]
    // bulk insert unordered; ignore duplicate key

type Publisher struct{}
func NewPublisher(coll *mongo.Collection, prod ingest.Producer, cfg PubCfg) *Publisher
func (p *Publisher) Run(ctx context.Context) error
    // find unpublished → Produce → mark published / inc attempts / DLQ
```

## 7.10 `internal/ingest` — Kafka

```go
package ingest

type Producer interface {
    Produce(ctx context.Context, topic, key string, value []byte) error
    ProduceBatch(ctx context.Context, recs []Record) error
    Close() error
}

type Record struct {
    Topic string
    Key   string
    Value []byte
}

type Consumer interface {
    Run(ctx context.Context, handler Handler) error
}

type Handler func(ctx context.Context, rec Record) error

func NewFranzProducer(brokers []string, acks AcksMap) (Producer, error)
func NewFranzConsumer(brokers []string, group string, topics []string) (Consumer, error)
```

Handler na B **ne** sme da radi spor SQL sinhrono za heartbeat.

## 7.11 Consumer — presence, dedup, heartbeat

```go
package dedup

type Store interface {
    Seen(ctx context.Context, eventID string) (already bool, err error)
}

func NewRedis(rdb *redis.Client, ttl time.Duration) Store
// SET NX EX; already=true ako !SET

package presence

type Last struct {
    PartnerID string
    Lat, Lng, Speed float64
    TS time.Time
    EventID string
}

type Store interface {
    Touch(ctx context.Context, driverID string, last Last) error
    Get(ctx context.Context, driverID string) (Last, bool, error)
    OnlineCount(ctx context.Context, stale time.Duration) (int64, error)
    SweepStale(ctx context.Context, stale time.Duration) error
}

func NewRedis(rdb *redis.Client) Store

package heartbeat

type MinuteKey struct {
    Minute    time.Time // truncated
    PartnerID uuid.UUID
}

type Acc struct {
    Pings   int64
    Drivers map[uuid.UUID]struct{} // lokalni set u batch-u, ne globalni
}

type Buffer struct{} // koristi batcher ili sopstveni map+ticker

func NewBuffer(flushEvery time.Duration, max int, sink Sink) *Buffer
func (b *Buffer) Add(ctx context.Context, partner uuid.UUID, driver uuid.UUID, at time.Time) error

type Sink interface {
    UpsertMinutes(ctx context.Context, rows []MinuteRow) error
}
```

`cmd/go-consumer` podiže **tri** `Consumer.Run` (tri grupe) ili jedan process sa tri gorutine.

Heartbeat handler (presence group):

```text
Seen? return
Touch Redis
```

Heartbeat handler (ingest group):

```text
Seen sa drugim prefixom ključa (event:dedup:ingest:{id}) ILI isti dedup ako prihvataš da ingest sme da se desi samo ako presence već nije — BOLJE odvojeni ključevi:
  event:dedup:presence:{id}
  event:dedup:ingest:{id}
Buffer.Add
```

Odvojeni dedup per group jer Fan-Out znači da **ista** poruka legitimo ide u dve grupe.

## 7.12 `internal/driver/status` — čista logika

```go
package status

type Status string

const (
    Pending  Status = "pending"
    InReview Status = "in_review"
    Verified Status = "verified"
    Rejected Status = "rejected"
)

type Action string

const (
    Submit     Action = "submit"
    Approve    Action = "approve"
    Reject     Action = "reject"
    Resubmit   Action = "resubmit"
    Compliance Action = "compliance_fail"
)

var ErrIllegal = errors.New("illegal transition")

func Apply(from Status, act Action) (Status, error)
```

Table-driven test: svaki par `(from, act)` koji je dozvoljen i koji nije.

## 7.13 `internal/driver` servis + Postgres

```go
package driver

type Record struct {
    ID uuid.UUID
    PartnerID uuid.UUID
    FullName string
    LicenseNo string
    LicenseExpiresAt time.Time
    Status status.Status
    RejectionReason string
    VerifiedAt *time.Time
}

type Store interface {
    Get(ctx context.Context, id uuid.UUID) (Record, error)
    Insert(ctx context.Context, r Record) error
    Transition(ctx context.Context, id uuid.UUID, from, to status.Status, meta TransitionMeta) error
}

type TransitionMeta struct {
    SagaID   *uuid.UUID
    Reason   string
    Actor    string
    EventID  string
}

type Service struct {
    store Store
}

func (s *Service) Submit(ctx context.Context, id uuid.UUID, eventID string) error
func (s *Service) Decide(ctx context.Context, id uuid.UUID, approve bool, reason, eventID string) error
func (s *Service) FailCompliance(ctx context.Context, id uuid.UUID, reason, eventID string) error
```

`Transition` = UPDATE … WHERE status=from + INSERT `driver_status_events` u jednoj TX. 0 rows → `ErrIllegal` ili `ErrConflict`.

**Nema** `Repository[T any]`.

## 7.14 `internal/vehicle`

```go
package vehicle

type Class string
const (
    Unclassified Class = "unclassified"
    Economy      Class = "economy"
    Comfort      Class = "comfort"
    XL           Class = "xl"
)

func Classify(seats, year int) Class

type Record struct { /* kolone tabele vehicles */ }

type Store interface {
    Get(ctx context.Context, id uuid.UUID) (Record, error)
    SetClass(ctx context.Context, id uuid.UUID, c Class) error
    ClearClass(ctx context.Context, id uuid.UUID) error // kompenzacija
    AssignDriver(ctx context.Context, vehicleID, driverID uuid.UUID) error
}
```

`AssignDriver` proverava `driver.status == verified` i isti `partner_id`.

## 7.15 `internal/saga`

```go
package saga

type Type string
const TypeOnboarding Type = "driver_onboarding"

type State string
const (
    Running       State = "running"
    Completed     State = "completed"
    Compensating  State = "compensating"
    Compensated   State = "compensated"
    Failed        State = "failed"
)

type StepName string
const (
    StepPersist     StepName = "persist_driver"
    StepClassify    StepName = "classify_vehicle"
    StepCompliance  StepName = "run_compliance"
    StepVerified    StepName = "mark_verified"
    StepUnclassify  StepName = "compensate_unclassify"
    StepReject      StepName = "compensate_reject_driver"
)

type Orchestrator struct {
    sagas   SagaStore
    drivers driver.Service // ili gRPC klijent ka DriverService
    vehicles vehicle.Store
    partners partner.Store
    locks    Lock // Redis SET NX
}

func (o *Orchestrator) HandleVerification(ctx context.Context, e event.Envelope) error
func (o *Orchestrator) HandleClassify(ctx context.Context, e event.Envelope) error // ako classify stigne sam

type SagaStore interface {
    InsertIfNew(ctx context.Context, s Saga) (created bool, err error) // UNIQUE trigger_event_id
    Update(ctx context.Context, s Saga) error
    SaveStep(ctx context.Context, st Step) error
    GetByTrigger(ctx context.Context, eventID string) (Saga, error)
}
```

`HandleVerification` tok:

1. `InsertIfNew` — ako `created=false`, return nil (idempotencija).
2. Lock `saga:lock:{driver_id}`.
3. Koraci 1–4; na compliance fail → compensating koraci.
4. Unlock.

Compliance pravila (Go):

- `partners.status == active`
- `license_expires_at >= today`
- vozač postoji u katalogu/seed-u

## 7.16 gRPC (`proto/fleetrelay/driver/v1/driver.proto`)

```protobuf
syntax = "proto3";
package fleetrelay.driver.v1;
option go_package = "github.com/<ti>/fleetrelay/internal/driver/grpcv1";

service DriverService {
  rpc GetDriver(GetDriverRequest) returns (Driver);
  rpc SubmitVerification(SubmitVerificationRequest) returns (Driver);
  rpc DecideVerification(DecideVerificationRequest) returns (Driver);
  rpc FailCompliance(FailComplianceRequest) returns (Driver);
}

message Driver {
  string id = 1;
  string partner_id = 2;
  string status = 3;
  string license_no = 4;
  string license_expires_at = 5;
}

message GetDriverRequest { string id = 1; }
message SubmitVerificationRequest { string id = 1; string event_id = 2; }
message DecideVerificationRequest {
  string id = 1;
  bool approve = 2;
  string reason = 3;
  string event_id = 4;
}
message FailComplianceRequest {
  string id = 1;
  string reason = 2;
  string event_id = 3;
}
```

`cmd/api` implementira server na `:9090`. `Orchestrator` u CORE-u sme da zove **in-process** `driver.Service` da ne zavisite od mreže prvog dana; pre DoD CORE prebaciti orchestrator na gRPC klijent `127.0.0.1:9090` (isti host, drugi proces). To je mikroservisni šav.

## 7.17 `cmd/api` HTTP

| Metod | Put | Handler |
|---|---|---|
| GET | `/healthz` | proces živ |
| GET | `/readyz` | ping PG + Redis (+ opciono Kafka metadata) |
| GET | `/metrics` | Prometheus |
| GET | `/v1/partners/{id}` | `partner.Store.Get` |
| GET | `/v1/drivers/{id}` | PG + Redis last |
| GET | `/v1/vehicles/{id}` | |
| GET | `/v1/presence` | `{ "online": n }` |
| GET | `/v1/sagas/{id}` | |
| GET | `/v1/reports/summary` | poslednji `report_snapshots` ili SQL fallback |

JSON greška: `{ "error": { "code": "illegal_transition", "message": "…" } }`.

Middleware: `slog` sa `request_id`, recovery, `X-Role` stub.

## 7.18 `cmd/go-consumer/main.go` žica

```text
pgx pool, redis, kafka consumers
presence.Store, dedup (2 prefixa), heartbeat.Buffer
driver.Store, vehicle.Store, saga.Orchestrator
pool[envelope] za saga (ne za heartbeat — heartbeat je lagak)
Run: presence consumer, ingest consumer, saga consumer
SweepStale ticker 5s
signal Shutdown: flush buffer, zatvori consume
```

Heartbeat **ne** ide u worker pool sa SAGA-om (SAGA je spora). Odvojeni putevi = da 2% verification ne uspori 98% telemetry.

## 7.19 `cmd/seed`

Insert N partnera/drivers/vehicles. Deterministička imena `Partner {i}`, licence `LIC-{i}`, 10% expired. Idempotent `ON CONFLICT DO NOTHING`.

## 7.20 Observability imena

| Metrika | Gde | Tip |
|---|---|---|
| `fleetrelay_generated_total{type}` | A | counter |
| `fleetrelay_outbox_unpublished` | A | gauge |
| `fleetrelay_produced_total{topic}` | A | counter |
| `fleetrelay_produce_seconds` | A | histogram |
| `fleetrelay_consumed_total{group,topic}` | B | counter |
| `fleetrelay_dedup_hits_total{group}` | B | counter |
| `fleetrelay_online_drivers` | B | gauge |
| `fleetrelay_heartbeat_flush_rows` | B | histogram |
| `fleetrelay_saga_total{result}` | B | counter |
| `http_requests_total` | api | counter |

Log polja: `event_id`, `driver_id`, `op`, `component`.

pprof: `net/http/pprof` na metrics portu (`/debug/pprof/`).

## 7.21 Testovi (obavezni)

| Paket | Šta |
|---|---|
| `status` | svi prelazi |
| `vehicle` | Classify granice (seats=6, year=2019/2020) |
| `pool` | shutdown, ErrFull, complete |
| `batcher` | flush po max i po tickeru |
| `event` | Topic/PartitionKey |
| `catalog` | ID stabilan između poziva |
| `saga` | fake stores: happy + expired license kompenzacija + dupli trigger |
| `cmd` integration tag | compose PG/Redis/Mongo/Kafka — EXTENDED |

Bez testcontainers kao DoD na Windowsu.
