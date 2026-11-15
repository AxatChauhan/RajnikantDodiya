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
    id TEXT PRIMARY KEY,
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
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Full Mock',
    release_date TIMESTAMPTZ NOT NULL,
    file_path TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 180,
    total_questions INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

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
