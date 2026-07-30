-- AI skin-scan persistence — security groundwork.
--
-- The landing-page AI scan (FreeSkinScanModal) is gaining a write path: a
-- logged-in patient's REAL (non-simulated) scan is stored as one row in
-- skin_images (the photo, in the private `skin-scans` bucket) plus one row in
-- ai_skin_analyses (condition / confidence / recommendation). Both tables
-- existed since the original schema but were never written to — and both had
-- RLS DISABLED, which was fine while empty but must be locked down before the
-- first patient photo lands.
--
-- Access model:
--   * a patient sees ONLY their own images/analyses;
--   * clinic staff (ADMIN 1, DOCTOR 2, TECHNICIAN 3, RECEPTIONIST 4) can read
--     all of them (the doctor's workspace shows the patient's self-scans);
--   * inserts: the patient for themselves, or staff on a patient's behalf.
--   * no UPDATE/DELETE policies — an analysis is an immutable historical fact.

-- ── Table RLS ────────────────────────────────────────────────────────────────

alter table public.skin_images enable row level security;

drop policy if exists "skin_images_select" on public.skin_images;
create policy "skin_images_select"
  on public.skin_images for select
  using (patient_id = auth.uid() or current_role_id() = any (array[1, 2, 3, 4]));

drop policy if exists "skin_images_insert" on public.skin_images;
create policy "skin_images_insert"
  on public.skin_images for insert
  with check (
    (patient_id = auth.uid() and uploaded_by = auth.uid())
    or current_role_id() = any (array[1, 2, 3, 4])
  );

alter table public.ai_skin_analyses enable row level security;

drop policy if exists "ai_analyses_select" on public.ai_skin_analyses;
create policy "ai_analyses_select"
  on public.ai_skin_analyses for select
  using (patient_id = auth.uid() or current_role_id() = any (array[1, 2, 3, 4]));

drop policy if exists "ai_analyses_insert" on public.ai_skin_analyses;
create policy "ai_analyses_insert"
  on public.ai_skin_analyses for insert
  with check (patient_id = auth.uid() or current_role_id() = any (array[1, 2, 3, 4]));

-- ── Private storage bucket for the raw photos ───────────────────────────────
-- Patient skin photos are medical data: the bucket is PRIVATE and every read
-- goes through a signed URL. Object paths are namespaced `{patient_uuid}/…` so
-- the folder name itself carries ownership for the policies below.

insert into storage.buckets (id, name, public)
values ('skin-scans', 'skin-scans', false)
on conflict (id) do nothing;

drop policy if exists "skin_scans_insert" on storage.objects;
create policy "skin_scans_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'skin-scans'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_role_id() = any (array[1, 2, 3, 4])
    )
  );

drop policy if exists "skin_scans_select" on storage.objects;
create policy "skin_scans_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'skin-scans'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_role_id() = any (array[1, 2, 3, 4])
    )
  );
