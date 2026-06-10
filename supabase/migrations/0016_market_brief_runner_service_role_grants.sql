-- Hotfix: allow server-side Market Brief runner APIs to use the service role.
-- This migration must be applied after 0015_market_brief_generation_jobs.sql.

grant select, insert, update, delete on public.market_brief_generation_jobs to service_role;
grant select, insert, update, delete on public.market_briefs to service_role;
