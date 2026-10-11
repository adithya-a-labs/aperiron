CREATE TABLE IF NOT EXISTS aperiron_locks (name text PRIMARY KEY);
INSERT INTO aperiron_locks(name) VALUES ('assistant'), ('travel'), ('leases') ON CONFLICT DO NOTHING;

-- One row per resource, not one shared JSON file. Scope is an opaque session ID.
CREATE TABLE IF NOT EXISTS aperiron_records (
  scope text NOT NULL,
  kind text NOT NULL,
  id text NOT NULL,
  data jsonb NOT NULL,
  expires_at timestamptz,
  PRIMARY KEY (scope, kind, id)
);
CREATE INDEX IF NOT EXISTS aperiron_records_expiry ON aperiron_records(expires_at);
CREATE INDEX IF NOT EXISTS aperiron_records_kind ON aperiron_records(kind, scope);

CREATE TABLE IF NOT EXISTS aperiron_leases (
  name text PRIMARY KEY,
  token text NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS aperiron_dispatch (
  job_id text PRIMARY KEY,
  owner text NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','dispatching','sent')),
  workflow_id text,
  lease_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS aperiron_dispatch_pending ON aperiron_dispatch(state, lease_until);
