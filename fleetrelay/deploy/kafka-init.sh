#!/usr/bin/env bash
set -euo pipefail

BROKER="${KAFKA_INIT_BROKER:-kafka:29092}"

echo "waiting for kafka at ${BROKER}"
for i in $(seq 1 40); do
  if /opt/kafka/bin/kafka-topics.sh --bootstrap-server "${BROKER}" --list >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

create() {
  local topic="$1"
  local partitions="$2"
  /opt/kafka/bin/kafka-topics.sh --bootstrap-server "${BROKER}" --create \
    --if-not-exists \
    --topic "${topic}" \
    --partitions "${partitions}" \
    --replication-factor 1 \
    --config compression.type=lz4 \
    --config min.insync.replicas=1
}

create "fleet.heartbeat.v1" 12
create "fleet.verification.v1" 3
create "fleet.vehicle.classify.v1" 3
create "fleet.saga.v1" 3

/opt/kafka/bin/kafka-topics.sh --bootstrap-server "${BROKER}" --list
echo "kafka topics ready"
