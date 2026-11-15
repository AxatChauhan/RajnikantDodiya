-- ==============================================================================
-- NET VIDYA & ATHENEUM CONSOLIDATED PRODUCTION DATABASE SCHEMA
-- Dr. Rajnikant S. Dodiya | NET Vidya English Preparation Portal
-- Remote Supabase Target: https://ztqmrikjwmlawifjekdy.supabase.co
-- ==============================================================================

-- 1. Student User Accounts & Authentication Credentials
CREATE TABLE IF NOT EXISTS public.netvidya_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    is_buyer BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    amount_paid NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'none',
    enrolled_packs TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT '2026-12-31 23:59:59+05:30',
    reset_token_hash TEXT,
    reset_token_expires_at TIMESTAMPTZ,
    role TEXT DEFAULT 'student',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_netvidya_users_email ON public.netvidya_users (lower(email));
CREATE INDEX IF NOT EXISTS idx_netvidya_users_buyer ON public.netvidya_users (is_buyer, is_active);
CREATE INDEX IF NOT EXISTS idx_netvidya_users_reset ON public.netvidya_users (reset_token_hash);

-- 2. Enrolled Buyers & Course Pack Transactions
CREATE TABLE IF NOT EXISTS public.netvidya_buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    order_id TEXT NOT NULL UNIQUE,
    product_id TEXT DEFAULT 'ugc-net-english-bundle',
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    amount_paid NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'razorpay',
    is_active BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT '2026-12-31 23:59:59+05:30'
);

CREATE INDEX IF NOT EXISTS idx_netvidya_buyers_email ON public.netvidya_buyers (lower(email));
CREATE INDEX IF NOT EXISTS idx_netvidya_buyers_order ON public.netvidya_buyers (order_id);

-- 3. Reading Files Catalog (Private PDFs)
CREATE TABLE IF NOT EXISTS public.netvidya_reading_files (
    id TEXT PRIMARY KEY DEFAULT ('file_' || substr(md5(random()::text), 1, 10)),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Paper II: English',
    description TEXT,
    file_path TEXT NOT NULL,
    file_size_mb NUMERIC DEFAULT 4.5,
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Test Hall Modules (CBT Test Runners)
CREATE TABLE IF NOT EXISTS public.netvidya_tests (
    id TEXT PRIMARY KEY DEFAULT ('test_' || substr(md5(random()::text), 1, 10)),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Full Mock',
    release_date TIMESTAMPTZ NOT NULL,
    file_path TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 180,
    total_questions INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4B. Student CBT Exam Submissions & Score Tracking
CREATE TABLE IF NOT EXISTS public.netvidya_test_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL,
    student_name TEXT,
    test_id TEXT,
    test_title TEXT NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    score_percentage NUMERIC NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0,
    submitted_answers JSONB,
    completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_netvidya_test_submissions_email ON public.netvidya_test_submissions (lower(student_email));
CREATE INDEX IF NOT EXISTS idx_netvidya_test_submissions_title ON public.netvidya_test_submissions (test_title);

-- 5. Store Global Configuration (Pricing & Early-Bird Offer)
CREATE TABLE IF NOT EXISTS public.netvidya_store_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_pack',
    product_slug TEXT NOT NULL DEFAULT 'final-pack-2026',
    product_name TEXT NOT NULL DEFAULT 'GSET + UGC NET English Final Pack 2026',
    early_bird_price NUMERIC NOT NULL DEFAULT 799,
    standard_price NUMERIC NOT NULL DEFAULT 999,
    early_bird_cutoff TIMESTAMPTZ NOT NULL DEFAULT '2026-11-10 23:59:59+05:30',
    access_expiry_date TIMESTAMPTZ NOT NULL DEFAULT '2026-12-31 23:59:59+05:30',
    is_store_active BOOLEAN DEFAULT true,
    support_email TEXT DEFAULT 'netvidyaenglish@gmail.com',
    support_phone TEXT DEFAULT '+91 98251 23456',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default store settings
INSERT INTO public.netvidya_store_settings (id, product_slug, product_name, early_bird_price, standard_price, early_bird_cutoff)
VALUES ('current_pack', 'final-pack-2026', 'GSET + UGC NET English Final Pack 2026', 799, 999, '2026-11-10 23:59:59+05:30')
ON CONFLICT (id) DO NOTHING;

-- 6. Author Studio Dynamic CMS State & Master Security
CREATE TABLE IF NOT EXISTS public.site_content (
    key TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by TEXT DEFAULT 'author_master'
);

CREATE TABLE IF NOT EXISTS public.author_security (
    email TEXT PRIMARY KEY,
    master_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Atheneum Academic Library Core Tables (Monograph & Devices)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'scholar',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    student_name TEXT NOT NULL,
    product_type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile TEXT NOT NULL,
    student_name TEXT NOT NULL,
    product_type TEXT NOT NULL,
    order_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    granted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(mobile, product_type)
);

CREATE TABLE IF NOT EXISTS public.device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile TEXT NOT NULL UNIQUE,
    active_device_token TEXT NOT NULL,
    device_info TEXT,
    last_active_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.netvidya_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_reading_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Allow Server Functions Full Access (Managed via service_role key or server policies)
DROP POLICY IF EXISTS "Allow server full access on netvidya_users" ON public.netvidya_users;
CREATE POLICY "Allow server full access on netvidya_users" ON public.netvidya_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow server full access on netvidya_buyers" ON public.netvidya_buyers;
CREATE POLICY "Allow server full access on netvidya_buyers" ON public.netvidya_buyers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on netvidya_reading_files" ON public.netvidya_reading_files;
CREATE POLICY "Allow public read on netvidya_reading_files" ON public.netvidya_reading_files FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow server write on netvidya_reading_files" ON public.netvidya_reading_files;
CREATE POLICY "Allow server write on netvidya_reading_files" ON public.netvidya_reading_files FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on netvidya_tests" ON public.netvidya_tests;
CREATE POLICY "Allow public read on netvidya_tests" ON public.netvidya_tests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow server write on netvidya_tests" ON public.netvidya_tests;
CREATE POLICY "Allow server write on netvidya_tests" ON public.netvidya_tests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on netvidya_store_settings" ON public.netvidya_store_settings;
CREATE POLICY "Allow public read on netvidya_store_settings" ON public.netvidya_store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow server write on netvidya_store_settings" ON public.netvidya_store_settings;
CREATE POLICY "Allow server write on netvidya_store_settings" ON public.netvidya_store_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on site_content" ON public.site_content;
CREATE POLICY "Allow public read on site_content" ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow server write on site_content" ON public.site_content;
CREATE POLICY "Allow server write on site_content" ON public.site_content FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Deny public read on author_security" ON public.author_security;
CREATE POLICY "Deny public read on author_security" ON public.author_security FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Allow server write on author_security" ON public.author_security;
CREATE POLICY "Allow server write on author_security" ON public.author_security FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert orders" ON public.orders;
CREATE POLICY "Allow anon insert orders" ON public.orders FOR INSERT TO anon WITH CHECK (amount > 0 AND mobile ~ '^[0-9]{10}$');

DROP POLICY IF EXISTS "Allow server full access on orders" ON public.orders;
CREATE POLICY "Allow server full access on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow server full access on students" ON public.students;
CREATE POLICY "Allow server full access on students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow server full access on student_licenses" ON public.student_licenses;
CREATE POLICY "Allow server full access on student_licenses" ON public.student_licenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow server full access on device_sessions" ON public.device_sessions;
CREATE POLICY "Allow server full access on device_sessions" ON public.device_sessions FOR ALL USING (true) WITH CHECK (true);

-- Test Submissions RLS
ALTER TABLE public.netvidya_test_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow server full access on test_submissions" ON public.netvidya_test_submissions;
CREATE POLICY "Allow server full access on test_submissions" ON public.netvidya_test_submissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert test_submissions" ON public.netvidya_test_submissions;
CREATE POLICY "Allow anon insert test_submissions" ON public.netvidya_test_submissions FOR INSERT TO anon WITH CHECK (total_questions > 0);

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('netvidya-materials', 'netvidya-materials', false, 52428800, ARRAY['application/pdf', 'application/octet-stream']),
  ('academic-books', 'academic-books', true, 104857600, ARRAY['application/pdf', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Public access to academic-books" ON storage.objects;
CREATE POLICY "Public access to academic-books" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'academic-books');

DROP POLICY IF EXISTS "Server full access on storage" ON storage.objects;
CREATE POLICY "Server full access on storage" ON storage.objects FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- SECURE STORED PROCEDURES (SECURITY DEFINER RPCs)
-- ==============================================================================

-- 1. Atomic Order & License Grant RPC
CREATE OR REPLACE FUNCTION public.record_verified_purchase(
    p_order_id TEXT,
    p_mobile TEXT,
    p_student_name TEXT,
    p_product_type TEXT,
    p_amount NUMERIC,
    p_payment_id TEXT,
    p_licensed_items TEXT[],
    p_device_token TEXT,
    p_status TEXT DEFAULT 'completed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_mobile TEXT;
    v_item TEXT;
BEGIN
    v_clean_mobile := regexp_replace(p_mobile, '\D', '', 'g');
    v_clean_mobile := right(v_clean_mobile, 10);

    IF length(v_clean_mobile) <> 10 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid 10-digit mobile number.');
    END IF;

    INSERT INTO public.orders (
        order_id, mobile, student_name, product_type, amount, razorpay_payment_id, status
    ) VALUES (
        p_order_id, v_clean_mobile, p_student_name, p_product_type, p_amount, p_payment_id, p_status
    )
    ON CONFLICT (order_id) DO UPDATE SET
        razorpay_payment_id = EXCLUDED.razorpay_payment_id,
        status = EXCLUDED.status;

    IF p_status = 'completed' THEN
        FOREACH v_item IN ARRAY p_licensed_items LOOP
            INSERT INTO public.student_licenses (
                mobile, student_name, product_type, order_id, is_active
            ) VALUES (
                v_clean_mobile, p_student_name, v_item, p_order_id, true
            )
            ON CONFLICT (mobile, product_type) DO UPDATE SET
                is_active = true,
                order_id = EXCLUDED.order_id;
        END LOOP;
    END IF;

    INSERT INTO public.device_sessions (
        mobile, active_device_token, device_info, last_active_at
    ) VALUES (
        v_clean_mobile, p_device_token, 'Verified Web Client', now()
    )
    ON CONFLICT (mobile) DO UPDATE SET
        active_device_token = EXCLUDED.active_device_token,
        last_active_at = now();

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'device_token', p_device_token,
        'status', p_status
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_verified_purchase(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT[], TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_verified_purchase(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT[], TEXT, TEXT) TO service_role;

-- 2. Scoped Pass Restoration RPC
CREATE OR REPLACE FUNCTION public.restore_scholar_licenses(
    p_mobile TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_mobile TEXT;
    v_student_name TEXT;
    v_order_id TEXT;
    v_unlocked TEXT[];
BEGIN
    v_clean_mobile := regexp_replace(p_mobile, '\D', '', 'g');
    v_clean_mobile := right(v_clean_mobile, 10);

    IF length(v_clean_mobile) <> 10 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid 10-digit mobile number.');
    END IF;

    SELECT array_agg(product_type), max(student_name), max(order_id)
    INTO v_unlocked, v_student_name, v_order_id
    FROM public.student_licenses
    WHERE mobile = v_clean_mobile AND is_active = true;

    IF v_unlocked IS NULL OR array_length(v_unlocked, 1) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'found', false,
            'message', 'No active scholar licenses registered for this mobile number.'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'found', true,
        'student_name', v_student_name,
        'order_id', v_order_id,
        'unlocked_items', v_unlocked
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_scholar_licenses(TEXT) TO anon, authenticated, service_role;

-- 3. Device Session Verification RPC
CREATE OR REPLACE FUNCTION public.verify_device_token(
    p_mobile TEXT,
    p_device_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_mobile TEXT;
    v_active_token TEXT;
BEGIN
    v_clean_mobile := regexp_replace(p_mobile, '\D', '', 'g');
    v_clean_mobile := right(v_clean_mobile, 10);

    SELECT active_device_token INTO v_active_token
    FROM public.device_sessions
    WHERE mobile = v_clean_mobile;

    IF v_active_token IS NULL THEN
        RETURN jsonb_build_object('valid', true, 'is_current_device', true);
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'is_current_device', (v_active_token = p_device_token)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_device_token(TEXT, TEXT) TO anon, authenticated, service_role;

-- 4. Centralized Multi-Device Scholar Registration RPC
CREATE OR REPLACE FUNCTION public.register_scholar_credential(
    p_email TEXT,
    p_full_name TEXT,
    p_mobile TEXT,
    p_password_hash TEXT,
    p_role TEXT DEFAULT 'scholar'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_email TEXT;
    v_clean_mobile TEXT;
BEGIN
    v_clean_email := lower(trim(p_email));
    v_clean_mobile := regexp_replace(p_mobile, '\D', '', 'g');
    v_clean_mobile := right(v_clean_mobile, 10);

    IF length(v_clean_email) < 5 OR position('@' in v_clean_email) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid email address.');
    END IF;

    IF length(v_clean_mobile) <> 10 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid 10-digit mobile number.');
    END IF;

    IF p_role = 'author' OR v_clean_email IN ('rajnikantdodiya2@gmail.com', 'rajnikant.dodiya@spuvvn.edu', 'rajnikantdodiya@hmpenglish.com') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Author accounts cannot be created via public scholar registration.');
    END IF;

    INSERT INTO public.students (
        full_name, mobile, email, password_hash, role
    ) VALUES (
        p_full_name, v_clean_mobile, v_clean_email, p_password_hash, 'scholar'
    )
    ON CONFLICT (mobile) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email
    WHERE students.password_hash IS NULL;

    RETURN jsonb_build_object(
        'success', true,
        'email', v_clean_email,
        'mobile', v_clean_mobile,
        'role', 'scholar'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_scholar_credential(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 5. Centralized Multi-Device Scholar Authentication RPC
CREATE OR REPLACE FUNCTION public.authenticate_scholar_credential(
    p_email TEXT,
    p_password_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_email TEXT;
    v_student RECORD;
BEGIN
    v_clean_email := lower(trim(p_email));

    SELECT full_name, mobile, email, password_hash, role
    INTO v_student
    FROM public.students
    WHERE lower(email) = v_clean_email;

    IF v_student IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No scholar account found with this email. Please create a pass below.');
    END IF;

    IF v_student.password_hash IS NULL OR v_student.password_hash <> p_password_hash THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'name', v_student.full_name,
        'mobile', v_student.mobile,
        'email', v_student.email,
        'role', coalesce(v_student.role, 'scholar')
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_scholar_credential(TEXT, TEXT) TO anon, authenticated, service_role;

