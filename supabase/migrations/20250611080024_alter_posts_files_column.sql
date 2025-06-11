-- Alter the 'files' column in the 'posts' table from text[] to jsonb
ALTER TABLE public.posts
ALTER COLUMN files TYPE jsonb USING (
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'url', file_url,
        'name', reverse(split_part(reverse(file_url), '/', 1))
      )
    )
    FROM unnest(files) AS file_url
  )
);
