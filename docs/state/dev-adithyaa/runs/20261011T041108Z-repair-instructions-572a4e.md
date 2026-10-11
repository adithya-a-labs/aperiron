# Production repair instructions

- Developer/work lane: dev-adithyaa
- Timestamp: 2026-10-11T04:11:08Z
- Task: Supply database repair SQL and execution location
- Outcome: completed guidance
- Branch: main
- Baseline commit: e180add53d0ac01c6a8127d464ed1f923bd0c956

Read the existing tested repair-jsonb.sql and provided its single DO statement for
the production Neon SQL Editor after deployment of e180add. Provided a separate
read-only type check. Repair preserves zero remaining allowance; actual provider
quota reconciliation is separate. No application code or cloud data changed.
Source inspection passed; tests not rerun because SQL was unchanged. Cloud repair
and deployment not verified. Only own records updated, local and uncommitted;
no commit or push performed. Next: user executes repair and verifies object type.
