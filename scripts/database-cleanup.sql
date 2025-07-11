-- =====================================================
-- DATABASE CLEANUP SCRIPT (USE WITH CAUTION)
-- =====================================================

-- This script will drop all tables and related objects
-- Only run this if you want to completely reset the database

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS handle_facebook_page_configs_updated_at ON public.facebook_page_configs;
DROP TRIGGER IF EXISTS handle_facebook_lead_forms_updated_at ON public.facebook_lead_forms;
DROP TRIGGER IF EXISTS handle_facebook_leads_updated_at ON public.facebook_leads;
DROP TRIGGER IF EXISTS handle_user_settings_updated_at ON public.user_settings;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT);

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS public.lead_tag_assignments CASCADE;
DROP TABLE IF EXISTS public.lead_activities CASCADE;
DROP TABLE IF EXISTS public.lead_tags CASCADE;
DROP TABLE IF EXISTS public.facebook_leads CASCADE;
DROP TABLE IF EXISTS public.facebook_lead_forms CASCADE;
DROP TABLE IF EXISTS public.facebook_page_configs CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

SELECT 'Database cleanup completed. All tables and related objects have been dropped.' as status;
