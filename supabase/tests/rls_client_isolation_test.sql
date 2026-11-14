-- Run inside Supabase SQL Editor or psql as postgres.
-- Proves strict multi-tenant RLS isolation between Client A and Client B,
-- role/client_id escalation blocking, Draft invoice hiding, storage isolation,
-- and server-only payment verification. Everything is rolled back cleanly at the end.

BEGIN;

-- 0. Verify RLS is enabled on every public table
DO $$
DECLARE
  v_missing text;
BEGIN
  SELECT string_agg(tablename, ', ')
  INTO v_missing
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'profiles','clients','projects','milestones','updates',
      'files','messages','message_reads','invoices','payment_submissions','notifications'
    )
    AND rowsecurity = false;

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: RLS is NOT enabled on: %', v_missing;
  END IF;
END $$;

-- 1. Seed isolated fixture rows for Client A and Client B
INSERT INTO auth.users (id, email)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'client-a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'client-b@test.local')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, company_name, contact_name, phone, email, notes)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Client A Ltd', 'Alice A', '', 'client-a@test.local', ''),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Client B Ltd', 'Bob B', '', 'client-b@test.local', '');

INSERT INTO public.profiles (id, full_name, email, role, client_id)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Alice A', 'client-a@test.local', 'client', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'Bob B', 'client-b@test.local', 'client', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role, client_id = EXCLUDED.client_id;

INSERT INTO public.projects (id, client_id, title, description, package, status, progress, revisions_allowed, revisions_used)
VALUES
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Project A', '', 'basic', 'Development', 40, 3, 0),
  ('44444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Project B', '', 'basic', 'Design', 20, 3, 0);

INSERT INTO public.files (id, project_id, uploaded_by, name, storage_path, size_bytes, mime_type)
VALUES
  ('55555555-5555-4555-8555-555555555555', '44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 'secret-b.pdf', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/44444444-4444-4444-8444-444444444444/secret-b.pdf', 1024, 'application/pdf');

INSERT INTO public.messages (id, project_id, sender_id, body, file_id)
VALUES
  ('66666666-6666-4666-8666-666666666666', '44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 'Private message for Client B', NULL);

INSERT INTO public.invoices (id, client_id, project_id, invoice_number, items, total_bdt, issue_date, due_date, notes, status)
VALUES
  ('77777777-7777-4777-8777-777777777777', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'SD-2026-9001', '[{"description":"Phase 1","quantity":1,"unitPrice":50000,"total":50000}]'::jsonb, 50000, CURRENT_DATE, CURRENT_DATE + 7, '', 'Sent'),
  ('88888888-8888-4888-8888-888888888888', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'SD-2026-9002', '[{"description":"Draft","quantity":1,"unitPrice":25000,"total":25000}]'::jsonb, 25000, CURRENT_DATE, CURRENT_DATE + 7, '', 'Draft'),
  ('99999999-9999-4999-8999-999999999999', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '44444444-4444-4444-8444-444444444444', 'SD-2026-9003', '[{"description":"B Work","quantity":1,"unitPrice":75000,"total":75000}]'::jsonb, 75000, CURRENT_DATE, CURRENT_DATE + 7, '', 'Sent');

INSERT INTO public.payment_submissions (id, invoice_id, submitted_by, method, sender_number, transaction_id, amount_bdt, status)
VALUES
  ('abababab-abab-4bab-8bab-abababababab', '77777777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111', 'bKash', '01700000001', 'TRX-TEST-A1', 50000, 'Pending');

-- 2. Impersonate Client A (`authenticated`)
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object(
  'sub', '11111111-1111-4111-8111-111111111111',
  'role', 'authenticated',
  'email', 'client-a@test.local'
)::text, true);

DO $$
DECLARE
  v_cnt integer;
BEGIN
  -- (A) Isolation: Client A sees ONLY Client A's project, never Client B's project/files/messages/invoices
  SELECT count(*) INTO v_cnt FROM public.projects WHERE id = '44444444-4444-4444-8444-444444444444';
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'FAIL: Client A read Client B project'; END IF;

  SELECT count(*) INTO v_cnt FROM public.files WHERE id = '55555555-5555-4555-8555-555555555555';
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'FAIL: Client A read Client B file'; END IF;

  SELECT count(*) INTO v_cnt FROM public.messages WHERE id = '66666666-6666-4666-8666-666666666666';
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'FAIL: Client A read Client B message'; END IF;

  SELECT count(*) INTO v_cnt FROM public.invoices WHERE id IN ('88888888-8888-4888-8888-888888888888', '99999999-9999-4999-8999-999999999999');
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'FAIL: Client A read Draft or Client B invoice'; END IF;

  -- (B) Privilege Escalation: Client A cannot escalate role to admin or switch client_id
  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = '11111111-1111-4111-8111-111111111111';
    RAISE EXCEPTION 'FAIL: Client A escalated role to admin';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    UPDATE public.profiles SET client_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' WHERE id = '11111111-1111-4111-8111-111111111111';
    RAISE EXCEPTION 'FAIL: Client A switched client_id to Client B';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- (C) Cross-tenant Write Block: Client A cannot insert message/file into Client B's project
  BEGIN
    INSERT INTO public.messages (project_id, sender_id, body)
    VALUES ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Hijack');
    RAISE EXCEPTION 'FAIL: Client A posted message to Client B project';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- (D) Payment Verification Bypass Block: Client A cannot mark invoice Paid or call verify RPC
  UPDATE public.invoices SET status = 'Paid' WHERE id = '77777777-7777-4777-8777-777777777777';
  IF FOUND THEN RAISE EXCEPTION 'FAIL: Client A modified invoice status directly'; END IF;

  UPDATE public.payment_submissions SET status = 'Verified' WHERE id = 'abababab-abab-4bab-8bab-abababababab';
  IF FOUND THEN RAISE EXCEPTION 'FAIL: Client A self-verified payment_submission'; END IF;

  BEGIN
    PERFORM public.verify_payment_submission('abababab-abab-4bab-8bab-abababababab');
    RAISE EXCEPTION 'FAIL: Client A executed verify_payment_submission RPC';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- (E) Storage Isolation: Client A cannot insert storage object under Client B's prefix
  BEGIN
    INSERT INTO storage.objects (bucket_id, name, owner)
    VALUES ('project-files', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/44444444-4444-4444-8444-444444444444/evil.pdf', '11111111-1111-4111-8111-111111111111');
    RAISE EXCEPTION 'FAIL: Client A uploaded object into Client B storage prefix';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  RAISE NOTICE 'PASS: All client isolation, privilege escalation, storage, and payment guards enforced.';
END $$;

ROLLBACK;
