-- =====================================================
-- COMPLETE DATABASE SETUP FOR FACEBOOK LEADS PROJECT
-- =====================================================

-- 1. CREATE PROFILES TABLE
-- This table stores additional user information beyond what Supabase Auth provides
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE FACEBOOK PAGE CONFIGURATIONS TABLE
-- This table stores Facebook page access tokens and configurations
CREATE TABLE IF NOT EXISTS public.facebook_page_configs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    page_id TEXT NOT NULL,
    page_name TEXT,
    access_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, page_id) -- One config per page per user
);

-- 3. CREATE FACEBOOK LEAD FORMS TABLE
-- This table stores lead form configurations for each page
CREATE TABLE IF NOT EXISTS public.facebook_lead_forms (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    page_config_id INTEGER REFERENCES public.facebook_page_configs(id) ON DELETE CASCADE NOT NULL,
    form_id TEXT NOT NULL,
    form_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, form_id) -- One form per user
);

-- 4. CREATE FACEBOOK LEADS TABLE
-- This is the main table that stores all leads (both from API and manual entries)
CREATE TABLE IF NOT EXISTS public.facebook_leads (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lead_id TEXT NOT NULL,
    page_id TEXT NOT NULL,
    form_id TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    phone_number TEXT,
    company TEXT,
    job_title TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    lead_source TEXT DEFAULT 'facebook', -- 'facebook' or 'manual'
    lead_status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    contacted_at TIMESTAMP WITH TIME ZONE,
    raw_data JSONB, -- Store complete lead data from Facebook or additional manual data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lead_id, page_id, form_id) -- Prevent duplicate leads
);

-- 5. CREATE LEAD ACTIVITIES TABLE
-- This table tracks all activities/interactions with leads
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lead_id INTEGER REFERENCES public.facebook_leads(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'note', 'status_change'
    activity_title TEXT NOT NULL,
    activity_description TEXT,
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREATE LEAD TAGS TABLE
-- This table stores tags that can be applied to leads
CREATE TABLE IF NOT EXISTS public.lead_tags (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tag_name TEXT NOT NULL,
    tag_color TEXT DEFAULT '#3B82F6', -- Hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tag_name) -- Unique tag names per user
);

-- 7. CREATE LEAD TAG ASSIGNMENTS TABLE
-- This table creates many-to-many relationship between leads and tags
CREATE TABLE IF NOT EXISTS public.lead_tag_assignments (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES public.facebook_leads(id) ON DELETE CASCADE NOT NULL,
    tag_id INTEGER REFERENCES public.lead_tags(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lead_id, tag_id) -- Prevent duplicate tag assignments
);

-- 8. CREATE USER SETTINGS TABLE
-- This table stores user preferences and settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    time_format TEXT DEFAULT '12h', -- '12h' or '24h'
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    auto_sync_enabled BOOLEAN DEFAULT false,
    sync_interval INTEGER DEFAULT 60, -- minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_page_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_lead_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES FOR PROFILES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- CREATE RLS POLICIES FOR FACEBOOK PAGE CONFIGS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own page configs" ON public.facebook_page_configs;
DROP POLICY IF EXISTS "Users can insert own page configs" ON public.facebook_page_configs;
DROP POLICY IF EXISTS "Users can update own page configs" ON public.facebook_page_configs;
DROP POLICY IF EXISTS "Users can delete own page configs" ON public.facebook_page_configs;

CREATE POLICY "Users can view own page configs" ON public.facebook_page_configs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own page configs" ON public.facebook_page_configs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own page configs" ON public.facebook_page_configs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own page configs" ON public.facebook_page_configs
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE RLS POLICIES FOR FACEBOOK LEAD FORMS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own lead forms" ON public.facebook_lead_forms;
DROP POLICY IF EXISTS "Users can insert own lead forms" ON public.facebook_lead_forms;
DROP POLICY IF EXISTS "Users can update own lead forms" ON public.facebook_lead_forms;
DROP POLICY IF EXISTS "Users can delete own lead forms" ON public.facebook_lead_forms;

CREATE POLICY "Users can view own lead forms" ON public.facebook_lead_forms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead forms" ON public.facebook_lead_forms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead forms" ON public.facebook_lead_forms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead forms" ON public.facebook_lead_forms
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE RLS POLICIES FOR FACEBOOK LEADS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own leads" ON public.facebook_leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON public.facebook_leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.facebook_leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON public.facebook_leads;

CREATE POLICY "Users can view own leads" ON public.facebook_leads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads" ON public.facebook_leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads" ON public.facebook_leads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads" ON public.facebook_leads
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE RLS POLICIES FOR LEAD ACTIVITIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Users can insert own lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Users can update own lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Users can delete own lead activities" ON public.lead_activities;

CREATE POLICY "Users can view own lead activities" ON public.lead_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead activities" ON public.lead_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead activities" ON public.lead_activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead activities" ON public.lead_activities
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE RLS POLICIES FOR LEAD TAGS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own tags" ON public.lead_tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON public.lead_tags;
DROP POLICY IF EXISTS "Users can update own tags" ON public.lead_tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON public.lead_tags;

CREATE POLICY "Users can view own tags" ON public.lead_tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags" ON public.lead_tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON public.lead_tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON public.lead_tags
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE RLS POLICIES FOR LEAD TAG ASSIGNMENTS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own tag assignments" ON public.lead_tag_assignments;
DROP POLICY IF EXISTS "Users can insert own tag assignments" ON public.lead_tag_assignments;
DROP POLICY IF EXISTS "Users can delete own tag assignments" ON public.lead_tag_assignments;

CREATE POLICY "Users can view own tag assignments" ON public.lead_tag_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.facebook_leads 
            WHERE id = lead_tag_assignments.lead_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own tag assignments" ON public.lead_tag_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.facebook_leads 
            WHERE id = lead_tag_assignments.lead_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own tag assignments" ON public.lead_tag_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.facebook_leads 
            WHERE id = lead_tag_assignments.lead_id 
            AND user_id = auth.uid()
        )
    );

-- =====================================================
-- CREATE RLS POLICIES FOR USER SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Facebook page configs indexes
CREATE INDEX IF NOT EXISTS idx_facebook_page_configs_user_id ON public.facebook_page_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_page_configs_page_id ON public.facebook_page_configs(page_id);

-- Facebook lead forms indexes
CREATE INDEX IF NOT EXISTS idx_facebook_lead_forms_user_id ON public.facebook_lead_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_lead_forms_page_config_id ON public.facebook_lead_forms(page_config_id);
CREATE INDEX IF NOT EXISTS idx_facebook_lead_forms_form_id ON public.facebook_lead_forms(form_id);

-- Facebook leads indexes
CREATE INDEX IF NOT EXISTS idx_facebook_leads_user_id ON public.facebook_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_page_id ON public.facebook_leads(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_form_id ON public.facebook_leads(form_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_email ON public.facebook_leads(email);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_phone ON public.facebook_leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_status ON public.facebook_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_source ON public.facebook_leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_submitted_at ON public.facebook_leads(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_created_at ON public.facebook_leads(created_at DESC);

-- Lead activities indexes
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON public.lead_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON public.lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_date ON public.lead_activities(activity_date DESC);

-- Lead tags indexes
CREATE INDEX IF NOT EXISTS idx_lead_tags_user_id ON public.lead_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_name ON public.lead_tags(tag_name);

-- Lead tag assignments indexes
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_lead_id ON public.lead_tag_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_tag_id ON public.lead_tag_assignments(tag_id);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- =====================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    
    -- Also create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile manually (fallback)
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
    new_profile public.profiles;
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        user_id,
        user_email,
        COALESCE(user_full_name, split_part(user_email, '@', 1))
    )
    RETURNING * INTO new_profile;
    
    -- Also create default user settings if they don't exist
    INSERT INTO public.user_settings (user_id)
    VALUES (user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_facebook_page_configs_updated_at ON public.facebook_page_configs;
CREATE TRIGGER handle_facebook_page_configs_updated_at
    BEFORE UPDATE ON public.facebook_page_configs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_facebook_lead_forms_updated_at ON public.facebook_lead_forms;
CREATE TRIGGER handle_facebook_lead_forms_updated_at
    BEFORE UPDATE ON public.facebook_lead_forms
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_facebook_leads_updated_at ON public.facebook_leads;
CREATE TRIGGER handle_facebook_leads_updated_at
    BEFORE UPDATE ON public.facebook_leads
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER handle_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Sample lead tags (will be created for each user when they first use the system)
-- These are just examples - actual tags will be user-specific

-- Sample lead statuses are already defined in the lead_status column default values:
-- 'new', 'contacted', 'qualified', 'converted', 'lost'

-- =====================================================
-- GRANT PERMISSIONS (if needed)
-- =====================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This completes the database setup for the Facebook Leads Management System
-- Tables created:
-- 1. profiles - User profile information
-- 2. facebook_page_configs - Facebook page configurations
-- 3. facebook_lead_forms - Lead form configurations  
-- 4. facebook_leads - Main leads table
-- 5. lead_activities - Lead activity tracking
-- 6. lead_tags - Custom tags for leads
-- 7. lead_tag_assignments - Many-to-many relationship for lead tags
-- 8. user_settings - User preferences and settings

SELECT 'Database setup completed successfully! All tables, indexes, policies, and triggers have been created.' as status;
