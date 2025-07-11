-- =====================================================
-- DATABASE MIGRATION SCRIPT - VERSION 2
-- =====================================================

-- This script adds additional columns and features to existing tables
-- Run this after the main setup if you want extended functionality

-- Add additional columns to facebook_leads table
ALTER TABLE public.facebook_leads 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_facebook_leads_company ON public.facebook_leads(company);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_city ON public.facebook_leads(city);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_state ON public.facebook_leads(state);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_score ON public.facebook_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_next_follow_up ON public.facebook_leads(next_follow_up_at);

-- Create lead campaigns table
CREATE TABLE IF NOT EXISTS public.lead_campaigns (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    campaign_name TEXT NOT NULL,
    campaign_description TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on campaigns table
ALTER TABLE public.lead_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaigns
CREATE POLICY "Users can view own campaigns" ON public.lead_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON public.lead_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON public.lead_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON public.lead_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Add campaign reference to leads table
ALTER TABLE public.facebook_leads 
ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES public.lead_campaigns(id) ON DELETE SET NULL;

-- Create index for campaign reference
CREATE INDEX IF NOT EXISTS idx_facebook_leads_campaign_id ON public.facebook_leads(campaign_id);

-- Add trigger for campaigns updated_at
CREATE TRIGGER handle_lead_campaigns_updated_at
    BEFORE UPDATE ON public.lead_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

SELECT 'Database migration v2 completed successfully!' as status;
