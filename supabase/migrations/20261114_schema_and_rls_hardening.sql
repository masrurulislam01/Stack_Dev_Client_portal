-- Stack Dev Client Portal — Production Schema, RLS, Privilege Guards & Storage Hardening
-- Idempotent PostgreSQL / Supabase migration covering all 11 tables, 5 RPCs, triggers, and private storage bucket policies.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Core Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT '',
  contact_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  package text NOT NULL DEFAULT 'basic' CHECK (package IN ('basic', 'premium', 'custom')),
  status text NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'Design', 'Development', 'Review', 'Delivered')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date date,
  due_date date,
  revisions_allowed integer NOT NULL DEFAULT 0 CHECK (revisions_allowed >= 0),
  revisions_used integer NOT NULL DEFAULT 0 CHECK (revisions_used >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  due_date date,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Review', 'Approved', 'Changes Requested')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  feedback text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400),
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  file_id uuid REFERENCES public.files(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_reads (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_bdt numeric NOT NULL CHECK (total_bdt >= 0),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue')),
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('bKash', 'Nagad', 'Bank')),
  sender_number text NOT NULL,
  transaction_id text NOT NULL,
  amount_bdt numeric NOT NULL CHECK (amount_bdt > 0),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Rejected')),
  rejection_reason text,
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_submissions_invoice_trx_uidx
  ON public.payment_submissions (invoice_id, lower(btrim(transaction_id)));

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'update' CHECK (type IN ('update', 'message', 'milestone', 'invoice')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '/',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Security Helper Functions (SECURITY DEFINER with locked search_path)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.my_client_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT client_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_year text := to_char(CURRENT_DATE, 'YYYY');
  v_prefix text := 'SD-' || v_year || '-';
  v_next integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can generate invoice numbers.'
      USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_prefix));

  SELECT COALESCE(
    MAX(
      CASE
        WHEN invoice_number ~ ('^SD-' || v_year || '-[0-9]+$')
          THEN substring(invoice_number FROM '[0-9]+$')::integer
        ELSE 0
      END
    ),
    0
  ) + 1
  INTO v_next
  FROM public.invoices
  WHERE invoice_number LIKE v_prefix || '%';

  RETURN v_prefix || lpad(v_next::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR btrim(NEW.invoice_number) = '' THEN
    NEW.invoice_number := public.next_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoices_assign_number ON public.invoices;
CREATE TRIGGER trg_invoices_assign_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_invoice_number();

-- ---------------------------------------------------------------------------
-- 3. Auth User Profile Provisioning & Privilege-Escalation Guards
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, client_id)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''), split_part(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE(NEW.email, ''),
    'client',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.guard_profile_privilege_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Only administrators can modify account role, email, or client assignment.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_privilege_guard ON public.profiles;
CREATE TRIGGER trg_profiles_privilege_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privilege_columns();

-- Milestone client review guard: clients can only approve or request changes on In Review milestones
CREATE OR REPLACE FUNCTION public.guard_milestone_client_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.project_id IS DISTINCT FROM OLD.project_id
       OR NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.due_date IS DISTINCT FROM OLD.due_date
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Clients cannot edit milestone metadata.'
        USING ERRCODE = '42501';
    END IF;

    IF OLD.status <> 'In Review' THEN
      RAISE EXCEPTION 'Only milestones currently In Review can be reviewed by the client.'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.status NOT IN ('Approved', 'Changes Requested') THEN
      RAISE EXCEPTION 'Invalid client milestone review decision.'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.status = 'Changes Requested' AND btrim(COALESCE(NEW.feedback, '')) = '' THEN
      RAISE EXCEPTION 'Feedback is required when requesting milestone changes.'
        USING ERRCODE = '22023';
    END IF;

    IF NEW.status = 'Approved' THEN
      NEW.feedback := '';
    ELSE
      UPDATE public.projects
      SET revisions_used = revisions_used + 1
      WHERE id = OLD.project_id;
    END IF;

    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_milestones_client_review_guard ON public.milestones;
CREATE TRIGGER trg_milestones_client_review_guard
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_milestone_client_review();

-- Payment submission insert guard: forces Pending state & unverified fields for non-admins
CREATE OR REPLACE FUNCTION public.guard_payment_submission_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice record;
BEGIN
  SELECT id, client_id, status, total_bdt
  INTO v_invoice
  FROM public.invoices
  WHERE id = NEW.invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced invoice does not exist.' USING ERRCODE = '23503';
  END IF;

  IF NOT public.is_admin() THEN
    IF v_invoice.client_id IS DISTINCT FROM public.my_client_id() THEN
      RAISE EXCEPTION 'You cannot submit payment proof for another client invoice.'
        USING ERRCODE = '42501';
    END IF;

    IF v_invoice.status NOT IN ('Sent', 'Overdue') THEN
      RAISE EXCEPTION 'Payments can only be submitted for unpaid Sent or Overdue invoices.'
        USING ERRCODE = '42501';
    END IF;

    NEW.submitted_by := auth.uid();
    NEW.status := 'Pending';
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
    NEW.rejection_reason := NULL;
  END IF;

  NEW.sender_number := btrim(NEW.sender_number);
  NEW.transaction_id := btrim(NEW.transaction_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_submissions_insert_guard ON public.payment_submissions;
CREATE TRIGGER trg_payment_submissions_insert_guard
  BEFORE INSERT ON public.payment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_payment_submission_insert();

-- Notifications update guard: non-admins can only toggle is_read
CREATE OR REPLACE FUNCTION public.guard_notification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.type IS DISTINCT FROM OLD.type
       OR NEW.title IS DISTINCT FROM OLD.title
       OR NEW.body IS DISTINCT FROM OLD.body
       OR NEW.link IS DISTINCT FROM OLD.link
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Only notification read state can be modified.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_update_guard ON public.notifications;
CREATE TRIGGER trg_notifications_update_guard
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_notification_update();

-- Files update guard: non-admins can only rename their own uploaded file (never storage_path/size/project)
CREATE OR REPLACE FUNCTION public.guard_file_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.project_id IS DISTINCT FROM OLD.project_id
       OR NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by
       OR NEW.storage_path IS DISTINCT FROM OLD.storage_path
       OR NEW.size_bytes IS DISTINCT FROM OLD.size_bytes
       OR NEW.mime_type IS DISTINCT FROM OLD.mime_type
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Only file display name can be changed.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_files_update_guard ON public.files;
CREATE TRIGGER trg_files_update_guard
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_file_update();

-- ---------------------------------------------------------------------------
-- 4. Server-Side Payment Verification & Rejection RPCs (Admin-Only Atomic)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_payment_submission(p_submission_id uuid)
RETURNS public.payment_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub public.payment_submissions%ROWTYPE;
  v_inv public.invoices%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can verify payments.'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_sub
  FROM public.payment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment submission not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_sub.status <> 'Pending' THEN
    RAISE EXCEPTION 'Only Pending payment submissions can be verified.' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_inv
  FROM public.invoices
  WHERE id = v_sub.invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated invoice not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_inv.status = 'Draft' THEN
    RAISE EXCEPTION 'Cannot verify payment for a Draft invoice.' USING ERRCODE = '22023';
  END IF;

  IF v_inv.status = 'Paid' THEN
    RAISE EXCEPTION 'This invoice has already been marked Paid.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.payment_submissions
  SET status = 'Verified',
      rejection_reason = NULL,
      verified_by = auth.uid(),
      verified_at = v_now
  WHERE id = v_sub.id
  RETURNING * INTO v_sub;

  UPDATE public.invoices
  SET status = 'Paid',
      paid_at = v_now,
      payment_method = v_sub.method,
      payment_reference = v_sub.transaction_id
  WHERE id = v_inv.id;

  RETURN v_sub;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_payment_submission(p_submission_id uuid, p_reason text)
RETURNS public.payment_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub public.payment_submissions%ROWTYPE;
  v_clean_reason text := btrim(COALESCE(p_reason, ''));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can reject payments.'
      USING ERRCODE = '42501';
  END IF;

  IF length(v_clean_reason) < 3 THEN
    RAISE EXCEPTION 'A clear rejection reason (at least 3 characters) is required.'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_sub
  FROM public.payment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment submission not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_sub.status <> 'Pending' THEN
    RAISE EXCEPTION 'Only Pending payment submissions can be rejected.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.payment_submissions
  SET status = 'Rejected',
      rejection_reason = left(v_clean_reason, 500),
      verified_by = auth.uid(),
      verified_at = now()
  WHERE id = v_sub.id
  RETURNING * INTO v_sub;

  RETURN v_sub;
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.my_client_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.next_invoice_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_payment_submission(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_payment_submission(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_client_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_payment_submission(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payment_submission(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Enable Row-Level Security on ALL 11 Tables + Least-Privilege Policies
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;
ALTER TABLE public.milestones FORCE ROW LEVEL SECURITY;
ALTER TABLE public.updates FORCE ROW LEVEL SECURITY;
ALTER TABLE public.files FORCE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- Column-level safeguard on profiles so non-admins cannot even attempt column updates to role/client_id
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

-- PROFILES
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin() OR id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
CREATE POLICY profiles_insert_policy ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR id = auth.uid())
  WITH CHECK (public.is_admin() OR id = auth.uid());

DROP POLICY IF EXISTS profiles_delete_policy ON public.profiles;
CREATE POLICY profiles_delete_policy ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- CLIENTS
DROP POLICY IF EXISTS clients_select_policy ON public.clients;
CREATE POLICY clients_select_policy ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_admin() OR id = public.my_client_id());

DROP POLICY IF EXISTS clients_insert_policy ON public.clients;
CREATE POLICY clients_insert_policy ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS clients_update_policy ON public.clients;
CREATE POLICY clients_update_policy ON public.clients
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS clients_delete_policy ON public.clients;
CREATE POLICY clients_delete_policy ON public.clients
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- PROJECTS
DROP POLICY IF EXISTS projects_select_policy ON public.projects;
CREATE POLICY projects_select_policy ON public.projects
  FOR SELECT TO authenticated
  USING (public.is_admin() OR client_id = public.my_client_id());

DROP POLICY IF EXISTS projects_insert_policy ON public.projects;
CREATE POLICY projects_insert_policy ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS projects_update_policy ON public.projects;
CREATE POLICY projects_update_policy ON public.projects
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS projects_delete_policy ON public.projects;
CREATE POLICY projects_delete_policy ON public.projects
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- MILESTONES
DROP POLICY IF EXISTS milestones_select_policy ON public.milestones;
CREATE POLICY milestones_select_policy ON public.milestones
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.client_id = public.my_client_id()
    )
  );

DROP POLICY IF EXISTS milestones_insert_policy ON public.milestones;
CREATE POLICY milestones_insert_policy ON public.milestones
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS milestones_update_policy ON public.milestones;
CREATE POLICY milestones_update_policy ON public.milestones
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (
      status = 'In Review'
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id AND p.client_id = public.my_client_id()
      )
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      status IN ('Approved', 'Changes Requested')
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id AND p.client_id = public.my_client_id()
      )
    )
  );

DROP POLICY IF EXISTS milestones_delete_policy ON public.milestones;
CREATE POLICY milestones_delete_policy ON public.milestones
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- UPDATES
DROP POLICY IF EXISTS updates_select_policy ON public.updates;
CREATE POLICY updates_select_policy ON public.updates
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.client_id = public.my_client_id()
    )
  );

DROP POLICY IF EXISTS updates_insert_policy ON public.updates;
CREATE POLICY updates_insert_policy ON public.updates
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS updates_update_policy ON public.updates;
CREATE POLICY updates_update_policy ON public.updates
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS updates_delete_policy ON public.updates;
CREATE POLICY updates_delete_policy ON public.updates
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- FILES
DROP POLICY IF EXISTS files_select_policy ON public.files;
CREATE POLICY files_select_policy ON public.files
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.client_id = public.my_client_id()
    )
  );

DROP POLICY IF EXISTS files_insert_policy ON public.files;
CREATE POLICY files_insert_policy ON public.files
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      uploaded_by = auth.uid()
      AND size_bytes > 0
      AND size_bytes <= 26214400
      AND storage_path !~ '\.\.'
      AND storage_path ~ ('^' || public.my_client_id()::text || '/' || project_id::text || '/[0-9a-fA-F-]+-[A-Za-z0-9._-]+$')
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id AND p.client_id = public.my_client_id()
      )
    )
  );

DROP POLICY IF EXISTS files_update_policy ON public.files;
CREATE POLICY files_update_policy ON public.files
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (
      uploaded_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id AND p.client_id = public.my_client_id()
      )
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      uploaded_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id AND p.client_id = public.my_client_id()
      )
    )
  );

DROP POLICY IF EXISTS files_delete_policy ON public.files;
CREATE POLICY files_delete_policy ON public.files
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR (
      uploaded_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id AND p.client_id = public.my_client_id()
      )
    )
  );

-- MESSAGES
DROP POLICY IF EXISTS messages_select_policy ON public.messages;
CREATE POLICY messages_select_policy ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.client_id = public.my_client_id()
    )
  );

DROP POLICY IF EXISTS messages_insert_policy ON public.messages;
CREATE POLICY messages_insert_policy ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      sender_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id AND p.client_id = public.my_client_id()
      )
      AND (
        file_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.files f
          WHERE f.id = file_id AND f.project_id = project_id
        )
      )
    )
  );

DROP POLICY IF EXISTS messages_update_policy ON public.messages;
CREATE POLICY messages_update_policy ON public.messages
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS messages_delete_policy ON public.messages;
CREATE POLICY messages_delete_policy ON public.messages
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- MESSAGE_READS
DROP POLICY IF EXISTS message_reads_select_policy ON public.message_reads;
CREATE POLICY message_reads_select_policy ON public.message_reads
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.projects p ON p.id = m.project_id
      WHERE m.id = message_id AND p.client_id = public.my_client_id()
    )
  );

DROP POLICY IF EXISTS message_reads_insert_policy ON public.message_reads;
CREATE POLICY message_reads_insert_policy ON public.message_reads
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.projects p ON p.id = m.project_id
        WHERE m.id = message_id AND p.client_id = public.my_client_id()
      )
    )
  );

DROP POLICY IF EXISTS message_reads_update_policy ON public.message_reads;
CREATE POLICY message_reads_update_policy ON public.message_reads
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS message_reads_delete_policy ON public.message_reads;
CREATE POLICY message_reads_delete_policy ON public.message_reads
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- INVOICES (Draft invoices strictly hidden from clients)
DROP POLICY IF EXISTS invoices_select_policy ON public.invoices;
CREATE POLICY invoices_select_policy ON public.invoices
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (client_id = public.my_client_id() AND status <> 'Draft')
  );

DROP POLICY IF EXISTS invoices_insert_policy ON public.invoices;
CREATE POLICY invoices_insert_policy ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS invoices_update_policy ON public.invoices;
CREATE POLICY invoices_update_policy ON public.invoices
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS invoices_delete_policy ON public.invoices;
CREATE POLICY invoices_delete_policy ON public.invoices
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- PAYMENT_SUBMISSIONS (Clients can only create Pending rows for own Sent/Overdue invoices; never update/delete)
DROP POLICY IF EXISTS payment_submissions_select_policy ON public.payment_submissions;
CREATE POLICY payment_submissions_select_policy ON public.payment_submissions
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      submitted_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.id = invoice_id
          AND i.client_id = public.my_client_id()
          AND i.status <> 'Draft'
      )
    )
  );

DROP POLICY IF EXISTS payment_submissions_insert_policy ON public.payment_submissions;
CREATE POLICY payment_submissions_insert_policy ON public.payment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      submitted_by = auth.uid()
      AND status = 'Pending'
      AND verified_by IS NULL
      AND verified_at IS NULL
      AND rejection_reason IS NULL
      AND amount_bdt > 0
      AND EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.id = invoice_id
          AND i.client_id = public.my_client_id()
          AND i.status IN ('Sent', 'Overdue')
      )
    )
  );

DROP POLICY IF EXISTS payment_submissions_update_policy ON public.payment_submissions;
CREATE POLICY payment_submissions_update_policy ON public.payment_submissions
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS payment_submissions_delete_policy ON public.payment_submissions;
CREATE POLICY payment_submissions_delete_policy ON public.payment_submissions
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
CREATE POLICY notifications_select_policy ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS notifications_insert_policy ON public.notifications;
CREATE POLICY notifications_insert_policy ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS notifications_update_policy ON public.notifications;
CREATE POLICY notifications_update_policy ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS notifications_delete_policy ON public.notifications;
CREATE POLICY notifications_delete_policy ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Storage Bucket & Storage RLS Policies (`project-files` private bucket)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  26214400,
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS project_files_storage_select ON storage.objects;
CREATE POLICY project_files_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (
      public.is_admin()
      OR (
        name !~ '\.\.'
        AND array_length(storage.foldername(name), 1) >= 2
        AND (storage.foldername(name))[1] = public.my_client_id()::text
        AND EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id::text = (storage.foldername(name))[2]
            AND p.client_id = public.my_client_id()
        )
      )
    )
  );

DROP POLICY IF EXISTS project_files_storage_insert ON storage.objects;
CREATE POLICY project_files_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND (
      public.is_admin()
      OR (
        name !~ '\.\.'
        AND array_length(storage.foldername(name), 1) >= 2
        AND (storage.foldername(name))[1] = public.my_client_id()::text
        AND EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id::text = (storage.foldername(name))[2]
            AND p.client_id = public.my_client_id()
        )
      )
    )
  );

DROP POLICY IF EXISTS project_files_storage_update ON storage.objects;
CREATE POLICY project_files_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-files' AND public.is_admin())
  WITH CHECK (bucket_id = 'project-files' AND public.is_admin());

DROP POLICY IF EXISTS project_files_storage_delete ON storage.objects;
CREATE POLICY project_files_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (
      public.is_admin()
      OR (
        name !~ '\.\.'
        AND array_length(storage.foldername(name), 1) >= 2
        AND (storage.foldername(name))[1] = public.my_client_id()::text
        AND (
          owner = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.files f
            WHERE f.storage_path = name AND f.uploaded_by = auth.uid()
          )
        )
      )
    )
  );

COMMIT;
