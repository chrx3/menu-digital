begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'particle-icons',
  'particle-icons',
  true,
  102400,
  array['image/svg+xml']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read particle icons"
on storage.objects for select
to public
using (bucket_id = 'particle-icons');

create policy "Business admins upload particle icons"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'particle-icons'
  and public.is_business_admin((storage.foldername(name))[1]::uuid)
);

create policy "Business admins delete particle icons"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'particle-icons'
  and public.is_business_admin((storage.foldername(name))[1]::uuid)
);

commit;
