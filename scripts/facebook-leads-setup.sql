-- Create facebook_leads table to store fetched leads
CREATE TABLE IF NOT EXISTS public.facebook_leads (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lead_id TEXT NOT NULL,
    page_id TEXT NOT NULL,
    form_id TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    phone_number TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    raw_data JSONB, -- Store complete lead data from Facebook
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lead_id, page_id, form_id) -- Prevent duplicate leads
);

-- Create facebook_page_configs table to store user's Facebook page configurations
CREATE TABLE IF NOT EXISTS public.facebook_page_configs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    page_id TEXT NOT NULL,
    page_name TEXT,
    access_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, page_id) -- One config per page per user
);

-- Create facebook_lead_forms table to store lead form configurations
CREATE TABLE IF NOT EXISTS public.facebook_lead_forms (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    page_config_id INTEGER REFERENCES public.facebook_page_configs(id) ON DELETE CASCADE NOT NULL,
    form_id TEXT NOT NULL,
    form_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, form_id) -- One form per user
);

-- Enable RLS on all tables
ALTER TABLE public.facebook_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_page_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_lead_forms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for facebook_leads
CREATE POLICY "Users can view own leads" ON public.facebook_leads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads" ON public.facebook_leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads" ON public.facebook_leads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads" ON public.facebook_leads
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for facebook_page_configs
CREATE POLICY "Users can view own page configs" ON public.facebook_page_configs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own page configs" ON public.facebook_page_configs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own page configs" ON public.facebook_page_configs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own page configs" ON public.facebook_page_configs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for facebook_lead_forms
CREATE POLICY "Users can view own lead forms" ON public.facebook_lead_forms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead forms" ON public.facebook_lead_forms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead forms" ON public.facebook_lead_forms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead forms" ON public.facebook_lead_forms
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_leads_user_id ON public.facebook_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_page_id ON public.facebook_leads(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_form_id ON public.facebook_leads(form_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_submitted_at ON public.facebook_leads(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_facebook_page_configs_user_id ON public.facebook_page_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_lead_forms_user_id ON public.facebook_lead_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_lead_forms_page_config_id ON public.facebook_lead_forms(page_config_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_facebook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_facebook_leads_updated_at
    BEFORE UPDATE ON public.facebook_leads
    FOR EACH ROW EXECUTE FUNCTION public.handle_facebook_updated_at();

CREATE TRIGGER handle_facebook_page_configs_updated_at
    BEFORE UPDATE ON public.facebook_page_configs
    FOR EACH ROW EXECUTE FUNCTION public.handle_facebook_updated_at();

CREATE TRIGGER handle_facebook_lead_forms_updated_at
    BEFORE UPDATE ON public.facebook_lead_forms
    FOR EACH ROW EXECUTE FUNCTION public.handle_facebook_updated_at();
