-- ==============================================================================
-- NET VIDYA ENGLISH STUDENT STORE DATABASE SCHEMA
-- Sole Product: "GSET + UGC NET English Final Pack 2026"
-- Merchant / Proprietor: Nilam Dodiya (NET Vidya)
-- Academic Director: Dr. Rajnikant S. Dodiya
-- ==============================================================================

-- 1. Store Global Configuration (Pricing, Deadlines & Early-Bird Offer)
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

-- 2. Enrolled Buyers & Entitlements
CREATE TABLE IF NOT EXISTS public.netvidya_buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    order_id TEXT NOT NULL UNIQUE,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    amount_paid NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'razorpay', -- 'razorpay' | 'manual_upi' | 'admin_grant'
    is_active BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT '2026-12-31 23:59:59+05:30'
);

-- 2.1 Student User Accounts & Authentication Credentials
CREATE TABLE IF NOT EXISTS public.netvidya_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    is_buyer BOOLEAN DEFAULT false,
    order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    amount_paid NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'none', -- 'razorpay' | 'manual_upi' | 'admin_grant' | 'none'
    is_active BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT '2026-12-31 23:59:59+05:30',
    reset_token_hash TEXT,
    reset_token_expires_at TIMESTAMPTZ,
    role TEXT DEFAULT 'student', -- 'student' | 'admin'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for high-performance authentication and access control lookups
CREATE INDEX IF NOT EXISTS idx_netvidya_users_email ON public.netvidya_users (lower(email));
CREATE INDEX IF NOT EXISTS idx_netvidya_users_buyer ON public.netvidya_users (is_buyer, is_active);
CREATE INDEX IF NOT EXISTS idx_netvidya_users_reset ON public.netvidya_users (reset_token_hash);


-- 3. Reading Files Catalog (Private PDFs)
CREATE TABLE IF NOT EXISTS public.netvidya_reading_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Paper II: English',
    description TEXT,
    file_path TEXT NOT NULL, -- Storage path in private bucket
    file_size_mb NUMERIC DEFAULT 4.5,
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Test Hall Modules (NTA-Style HTML Test Runners)
CREATE TABLE IF NOT EXISTS public.netvidya_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Full Mock',
    release_date TIMESTAMPTZ NOT NULL, -- Date and time when test unlocks
    file_path TEXT NOT NULL, -- Storage path or identifier for HTML runner
    duration_minutes INTEGER DEFAULT 180,
    total_questions INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.netvidya_store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_reading_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_tests ENABLE ROW LEVEL SECURITY;

-- Public can view active store settings (pricing & countdown)
DROP POLICY IF EXISTS "Public Read NetVidya Settings" ON public.netvidya_store_settings;
CREATE POLICY "Public Read NetVidya Settings"
    ON public.netvidya_store_settings FOR SELECT
    USING (true);

-- Deny raw public select on buyers table (zero PII leaks)
DROP POLICY IF EXISTS "Deny Public Read NetVidya Buyers" ON public.netvidya_buyers;
CREATE POLICY "Deny Public Read NetVidya Buyers"
    ON public.netvidya_buyers FOR SELECT
    TO anon
    USING (false);

-- Deny raw public select on users credentials table (strictly protected)
DROP POLICY IF EXISTS "Deny Public Read NetVidya Users" ON public.netvidya_users;
CREATE POLICY "Deny Public Read NetVidya Users"
    ON public.netvidya_users FOR SELECT
    TO anon
    USING (false);

-- Procedures & service_role handle write and verification
-- Seed initial store settings if not already present
INSERT INTO public.netvidya_store_settings (
    id, product_slug, product_name, early_bird_price, standard_price, early_bird_cutoff, access_expiry_date
) VALUES (
    'current_pack',
    'final-pack-2026',
    'GSET + UGC NET English Final Pack 2026',
    799,
    999,
    '2026-11-10 23:59:59+05:30',
    '2026-12-31 23:59:59+05:30'
) ON CONFLICT (id) DO NOTHING;
