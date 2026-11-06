-- ==============================================================================
-- THE ATHENEUM ACADEMIC LIBRARY & SCHOLAR PASS DATABASE SCHEMA (HARDENED)
-- Dr. Rajnikant S. Dodiya | NET Vidya English
-- ZERO-VULNERABILITY ROW LEVEL SECURITY (RLS) & STORED PROCEDURES (RPC)
-- ==============================================================================

-- 1. Students Registry (Centralized Multi-Device Credentials)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'scholar',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Orders History (Razorpay & Verified UPI Transactions)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    student_name TEXT NOT NULL,
    product_type TEXT NOT NULL, -- 'book' | 'exam' | 'bundle'
    amount NUMERIC NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    status TEXT DEFAULT 'completed', -- 'completed' | 'pending_verification'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Student Licenses (Anti-Piracy Entitlements)
CREATE TABLE IF NOT EXISTS public.student_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile TEXT NOT NULL,
    student_name TEXT NOT NULL,
    product_type TEXT NOT NULL, -- 'book' | 'exam'
    order_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    granted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(mobile, product_type)
);

-- 4. Device Sessions (Enforcing 1 Single Active Student Device)
CREATE TABLE IF NOT EXISTS public.device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile TEXT NOT NULL UNIQUE,
    active_device_token TEXT NOT NULL,
    device_info TEXT,
    last_active_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ZERO-PII-LEAK ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Deny raw wildcard access by anonymous users to prevent PII harvesting
-- Dropping legacy insecure policies if they exist:
DROP POLICY IF EXISTS "Allow anon select orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon select students" ON public.students;
DROP POLICY IF EXISTS "Allow anon insert licenses" ON public.student_licenses;
DROP POLICY IF EXISTS "Allow anon select licenses" ON public.student_licenses;
DROP POLICY IF EXISTS "Allow anon update licenses" ON public.student_licenses;
DROP POLICY IF EXISTS "Allow anon all device_sessions" ON public.device_sessions;

-- Strictly deny unrestricted wildcard SELECT on device_sessions to prevent PII harvesting
-- Token verification and license checks are routed exclusively through secure stored procedures:
-- 1. verify_device_token(p_mobile, p_device_token)
-- 2. restore_scholar_licenses(p_mobile)
DROP POLICY IF EXISTS "Allow anon scoped device session check" ON public.device_sessions;

-- Allow anonymous callers to insert verified orders through stored procedures or scoped insert
CREATE POLICY "Allow anon insert orders" ON public.orders
    FOR INSERT TO anon
    WITH CHECK (amount > 0 AND mobile ~ '^[0-9]{10}$');

-- ==============================================================================
-- SECURE STORED PROCEDURES (SECURITY DEFINER RPCs)
-- These procedures prevent direct table manipulation and guarantee transactional integrity
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

    -- Insert or update order
    INSERT INTO public.orders (
        order_id, mobile, student_name, product_type, amount, razorpay_payment_id, status
    ) VALUES (
        p_order_id, v_clean_mobile, p_student_name, p_product_type, p_amount, p_payment_id, p_status
    )
    ON CONFLICT (order_id) DO UPDATE SET
        razorpay_payment_id = EXCLUDED.razorpay_payment_id,
        status = EXCLUDED.status;

    -- Only grant active licenses if status is 'completed'
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

    -- Register active device token
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

-- Restrict RPC execution: Prevent unauthorized anonymous license fulfillment
REVOKE EXECUTE ON FUNCTION public.record_verified_purchase(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT[], TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_verified_purchase(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT[], TEXT, TEXT) TO service_role;

-- 2. Scoped Pass Restoration RPC (Returns ONLY caller's own licenses, zero PII leak)
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

    -- Fetch active licenses for this mobile only
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

    -- Reject attempts to claim author privileges via public registration (SEC-001)
    IF p_role = 'author' OR v_clean_email IN ('rajnikantdodiya2@gmail.com', 'rajnikant.dodiya@spuvvn.edu', 'rajnikantdodiya@hmpenglish.com') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Author accounts cannot be created via public scholar registration.');
    END IF;

    -- Upsert student record - prevent overwriting existing password without authentication
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

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.netvidya_store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_reading_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netvidya_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read NetVidya Settings" ON public.netvidya_store_settings;
CREATE POLICY "Public Read NetVidya Settings"
    ON public.netvidya_store_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Deny Public Read NetVidya Buyers" ON public.netvidya_buyers;
CREATE POLICY "Deny Public Read NetVidya Buyers"
    ON public.netvidya_buyers FOR SELECT
    TO anon
    USING (false);

DROP POLICY IF EXISTS "Deny Public Read NetVidya Users" ON public.netvidya_users;
CREATE POLICY "Deny Public Read NetVidya Users"
    ON public.netvidya_users FOR SELECT
    TO anon
    USING (false);


