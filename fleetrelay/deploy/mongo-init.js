// Pokreće se samo pri prvom podizanju volumena (docker-entrypoint-initdb.d).
// Baza: fleetrelay. Kolekcije se mogu kreirati i iz Go koda; indeksi moraju postojati.

db = db.getSiblingDB("fleetrelay");

db.createCollection("outbox");
db.createCollection("generator_state");
db.createCollection("publish_dead_letter");

db.outbox.createIndex({ published: 1, created_at: 1 }, { name: "outbox_unpublished_fifo" });
db.outbox.createIndex({ event_type: 1, created_at: -1 }, { name: "outbox_type_time" });
db.outbox.createIndex(
  { expire_at: 1 },
  { name: "outbox_ttl", expireAfterSeconds: 0 }
);

db.publish_dead_letter.createIndex({ failed_at: -1 }, { name: "dlq_recent" });
