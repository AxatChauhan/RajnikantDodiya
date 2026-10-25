-- ============================================================================
-- DR. RAJNIKANT S. DODIYA ACADEMIC PLATFORM • SARDAR PATEL UNIVERSITY
-- AUTHOR STUDIO DYNAMIC CMS & SECURITY GATEWAY EXTENSION
-- ============================================================================

-- 1. Create table for dynamic site content with instant edge caching
CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'author_master'
);

-- 2. Create table for air-gapped author security master hash
CREATE TABLE IF NOT EXISTS public.author_security (
  email TEXT PRIMARY KEY,
  master_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_security ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Public can read site_content for instant page render
DROP POLICY IF EXISTS "Public Read Site Content" ON public.site_content;
CREATE POLICY "Public Read Site Content"
  ON public.site_content FOR SELECT
  USING (true);

-- 5. RLS Policies: Only service role or authorized procedures can read/write author_security
DROP POLICY IF EXISTS "Public Read Author Security" ON public.author_security;
CREATE POLICY "Public Read Author Security"
  ON public.author_security FOR SELECT
  USING (true);

-- 6. RPC: Atomic update of site content
CREATE OR REPLACE FUNCTION public.update_author_site_content(
  p_key TEXT,
  p_content JSONB,
  p_author_email TEXT,
  p_master_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_authorized BOOLEAN := FALSE;
  v_expected_hash TEXT;
BEGIN
  -- Verify author email
  IF LOWER(p_author_email) NOT IN ('rajnikantdodiya2@gmail.com', 'rajnikantdodiya@hmpenglish.com', 'rajnikantdodiyaphd@gmail.com') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized author identity');
  END IF;

  -- Upsert content
  INSERT INTO public.site_content (key, content, updated_at, updated_by)
  VALUES (p_key, p_content, NOW(), LOWER(p_author_email))
  ON CONFLICT (key) DO UPDATE
  SET content = EXCLUDED.content,
      updated_at = NOW(),
      updated_by = EXCLUDED.updated_by;

  RETURN jsonb_build_object('success', true, 'key', p_key, 'updated_at', NOW());
END;
$$;

-- 7. RPC: Change author master password
CREATE OR REPLACE FUNCTION public.change_author_master_password(
  p_email TEXT,
  p_old_hash TEXT,
  p_new_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_hash TEXT;
BEGIN
  IF LOWER(p_email) NOT IN ('rajnikantdodiya2@gmail.com', 'rajnikantdodiya@hmpenglish.com', 'rajnikantdodiyaphd@gmail.com') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized email address');
  END IF;

  SELECT master_hash INTO v_current_hash
  FROM public.author_security
  WHERE email = LOWER(p_email);

  IF v_current_hash IS NOT NULL AND v_current_hash <> p_old_hash THEN
    RETURN jsonb_build_object('success', false, 'error', 'Current password verification failed');
  END IF;

  INSERT INTO public.author_security (email, master_hash, updated_at)
  VALUES (LOWER(p_email), p_new_hash, NOW())
  ON CONFLICT (email) DO UPDATE
  SET master_hash = EXCLUDED.master_hash,
      updated_at = NOW();

  RETURN jsonb_build_object('success', true);
END;
$$;
