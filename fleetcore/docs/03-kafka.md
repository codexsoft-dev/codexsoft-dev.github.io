# 3. Apache Kafka — broker na A, klijent na B

## 3.1 Uloga

Kafka je **asinhrona granica** između ingest-a i domena. Producer nikad ne zove HTTP/gRPC na B za heartbeat (20k/s to ne bi preživelo). Verification SAGA na B sluša topic, ne polling Mongo-a.

| Komponenta | Gde | Broj procesa |
|---|---|---|
| Broker (KRaft, 1 node) | Computer-A, Docker | 1 |
| Topic init | Computer-A, `kafka-init` kontejner | jednokratno |
| Publisher (outbox → Kafka) | Computer-A, `go-producer` | deo producenta |
| Consumer groups | Computer-B, `go-consumer` | 3 grupe |

Nema ZooKeeper-a. `CLUSTER_ID` u compose.a je fiksan da volumen preživi restart.

## 3.2 Listeneri (najvažniji deo)

Tri listenera u `compose.a.yml`:

| Ime | Bind u kontejneru | Advertised | Ko se kači |
|---|---|---|---|
| `PLAINTEXT` | `0.0.0.0:29092` | `kafka:29092` | `kafka-init`, budući producer **kontejner** na A |
| `EXTERNAL` | `0.0.0.0:9092` | `$KAFKA_EXTERNAL_HOST:9092` | `go-producer` na **hostu A**, `go-consumer` na B ili hostu |
| `CONTROLLER` | `0.0.0.0:9093` | (nije advertised klijentima) | KRaft |

Host A i računar B **uvek** koriste port **9092** (EXTERNAL). Nikad 29092 sa Windowsa — to ime `kafka` postoji samo na Docker mreži `fleetrelay-a`.

```
go-producer (host A)  -->  127.0.0.1:9092          -->  EXTERNAL listener
go-consumer (host B)  -->  192.168.0.10:9092       -->  isti EXTERNAL listener
kafka-init            -->  kafka:29092             -->  PLAINTEXT listener
```

`KAFKA_INTER_BROKER_LISTENER_NAME=PLAINTEXT` (interni).

## 3.3 Topic-i

Kreira `deploy/kafka-init.sh`. `AUTO_CREATE` je **isključen**.

| Topic | Partitions | Key | Ko piše | Ko čita (group) |
|---|---|---|---|---|
| `fleet.heartbeat.v1` | 12 | `driver_id` | publisher na A | `fleetrelay-presence`, `fleetrelay-ingest` |
| `fleet.verification.v1` | 3 | `driver_id` | publisher na A | `fleetrelay-saga` |
| `fleet.vehicle.classify.v1` | 3 | `vehicle_id` | publisher na A | `fleetrelay-saga` |
| `fleet.saga.v1` | 3 | `driver_id` | outbox na B (EXTENDED) ili consumer direktno | reporting / debug |

Dve consumer grupe na heartbeat = **Fan-Out na infrastrukturnom nivou**: presence i SQL ingest ne dele offsete.

Retention 24h (`KAFKA_LOG_RETENTION_HOURS`). Posle trećeg 8.4M burst-a disk na A mora da izdrži; 24h + lz4 je namerno.

Replication factor **1** (jedan broker). U `docs` za intervju: u produkciji RF=3, `min.insync.replicas=2`, `acks=all` za verification.

## 3.4 Producer sema (A)

| Event type | Topic | `acks` |
|---|---|---|
| `driver.heartbeat` | `fleet.heartbeat.v1` | `1` (brzina; gubitak jednog batch-a u demou OK) |
| `verification.submitted` | `fleet.verification.v1` | `all` |
| `vehicle.classify.requested` | `fleet.vehicle.classify.v1` | `all` |

Ostalo: `compression=lz4`, `linger` 10–50ms, batch 2000 iz outbox publishera. Idempotencija **nije** Kafka idempotent producer (PID) u CORE-u; idempotencija je `event_id` u Mongo + Redis/PG na B. Kafka idempotent producer je EXTENDED plus.

Poruka: value = JSON envelope (poglavlje 8), key = partition key string.

## 3.5 Consumer sema (B)

| Group ID | Topic-i | Semantika |
|---|---|---|
| `fleetrelay-presence` | `fleet.heartbeat.v1` | Redis HASH + ZSET, commit posle Redis pipeline |
| `fleetrelay-ingest` | `fleet.heartbeat.v1` | Fan-in buffer → `heartbeat_minutes`, commit posle flush-a **ili** posle enqueue u buffer ako dokumentuješ eventualnu konzistenciju |
| `fleetrelay-saga` | `fleet.verification.v1`, `fleet.vehicle.classify.v1` | SAGA, commit posle završenog koraka / dedup |

Preporuka za CORE ingest: commit offset tek kad je batch **enqueued** u flusher (ne kad je PG commitovao), uz merenje `flush_lag`. Presence je near-realtime; SQL je eventual.

Manual commit, `fetch.min.bytes` / `max.wait` podesivi kad juriš 20k/s.

## 3.6 Postavljanje na Computer-A (broker)

1. Docker iz poglavlja 2.
2. `.env.a` sa tačnim `KAFKA_EXTERNAL_HOST`.
3. `docker compose --env-file .env.a -f compose.a.yml up -d`.
4. `docker logs fleetrelay-kafka-init` — lista topic-a.
5. Lista:

```powershell
docker exec fleetrelay-kafka /opt/kafka/bin/kafka-topics.sh `
  --bootstrap-server localhost:29092 --describe
```

6. Ručni test produce/consume na A:

```powershell
docker exec -it fleetrelay-kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:29092 --topic fleet.heartbeat.v1
docker exec -it fleetrelay-kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:29092 --topic fleet.heartbeat.v1 --from-beginning
```

Za test sa **hosta** A (isto što vidi Go): bootstrap `127.0.0.1:9092`. Ako console sa hosta ne postoji, koristi privremeni kontejner:

```powershell
docker run --rm -it --network fleetrelay-a apache/kafka:3.9.1 `
  /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:29092 --list
```

## 3.7 Postavljanje na Computer-B (samo klijent)

Na B **nema** `compose.a`, **nema** instalacije Kafka servisa.

1. Mreža: `Test-NetConnection <A-IP> -Port 9092`.
2. Env: `FLEETRELAY_KAFKA_BROKERS=<A-IP>:9092`.
3. Opcioni debug kontejner **na B** (klijent, ne broker):

```powershell
docker run --rm -it apache/kafka:3.9.1 `
  /opt/kafka/bin/kafka-topics.sh --bootstrap-server 192.168.0.10:9092 --list
```

Ako ovo sa B vrati topic-e, Go consumer će moći isto. Ako visí ili vrati `localhost` u metadata: advertised listener na A je pogrešan.

4. Consumer group stanje (sa A, lakše):

```powershell
docker exec fleetrelay-kafka /opt/kafka/bin/kafka-consumer-groups.sh `
  --bootstrap-server localhost:29092 --describe --all-groups
```

Lag po particiji je **glavna metrika** high-load vežbe.

## 3.8 Troubleshooting advertised.listeners

Simptom: klijent sa B uspe `TCP connect` na 9092, pa fail metadata / connection to `localhost:9092` ili `127.0.0.1:9092`.

Uzrok: `KAFKA_EXTERNAL_HOST=localhost` dok broker radi na A.

Ispravka: stavi LAN IP, `docker compose ... up -d` (recreate kafka kontejnera). Proveri:

```powershell
docker exec fleetrelay-kafka printenv KAFKA_ADVERTISED_LISTENERS
```

Mora sadržati `EXTERNAL://192.168.x.x:9092`, ne `EXTERNAL://localhost:9092`.

Drugi simptom: radi na jednoj mašini, ne radi sa dva PC-a. Proveri AP isolation na ruteru (uređaji ne smeju da pričaju međusobno na guest WiFi).

## 3.9 Šta meriti

- `records_out_per_sec` (producer)
- `outbox` unpublished count (Mongo)
- `records_lag` po group/partition
- veličina diska volumena `kafka_data`

Ako unpublished raste, publisher/Kafka/disk je sporiji od generatora — **to je usko grlo outbox-a**, ne „Kafka ne valja“. Smanji `FLEETRELAY_BURST_RATE` ili povećaj flush batch.
