-- Run after deploying the text-binding fix. Single statement for Neon's SQL Editor.
-- Preserves quota, expiry and ownership; malformed data rolls back the entire repair.
DO $$
DECLARE
  item record;
  decoded jsonb;
BEGIN
  PERFORM name FROM aperiron_locks
    WHERE name IN ('assistant','travel') ORDER BY name FOR UPDATE;
  FOR item IN
    SELECT scope,kind,id,data FROM aperiron_records
    WHERE jsonb_typeof(data)='string'
      AND kind IN ('sessions','resources','jobs','idempotency','budgets','inputs','meta','quota','entries')
    FOR UPDATE
  LOOP
    decoded := (item.data #>> '{}')::jsonb;
    IF (item.kind='meta' AND jsonb_typeof(decoded)<>'number')
       OR (item.kind<>'meta' AND jsonb_typeof(decoded)<>'object') THEN
      RAISE EXCEPTION 'Unexpected stored JSON shape; manual recovery required';
    END IF;
    UPDATE aperiron_records SET data=decoded
      WHERE scope=item.scope AND kind=item.kind AND id=item.id;
  END LOOP;
END
$$;
