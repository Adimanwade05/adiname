-- Add auto-sync configuration to facebook_page_configs table
ALTER TABLE public.facebook_page_configs 
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sync_interval_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'success', 'error'
ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Create auto_sync_jobs table to track background sync jobs
CREATE TABLE IF NOT EXISTS public.auto_sync_jobs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    page_config_id INTEGER REFERENCES public.facebook_page_configs(id) ON DELETE CASCADE NOT NULL,
    job_status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    leads_fetched INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on auto_sync_jobs
ALTER TABLE public.auto_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for auto_sync_jobs
CREATE POLICY "Users can view own sync jobs" ON public.auto_sync_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync jobs" ON public.auto_sync_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync jobs" ON public.auto_sync_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for auto_sync_jobs
CREATE INDEX IF NOT EXISTS idx_auto_sync_jobs_user_id ON public.auto_sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_sync_jobs_page_config_id ON public.auto_sync_jobs(page_config_id);
CREATE INDEX IF NOT EXISTS idx_auto_sync_jobs_status ON public.auto_sync_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_auto_sync_jobs_started_at ON public.auto_sync_jobs(started_at DESC);

-- Create function to schedule next sync
CREATE OR REPLACE FUNCTION public.schedule_next_sync(config_id INTEGER)
RETURNS VOID AS $$
DECLARE
    sync_interval INTEGER;
BEGIN
    -- Get sync interval for this config
    SELECT sync_interval_minutes INTO sync_interval
    FROM public.facebook_page_configs
    WHERE id = config_id;
    
    -- Update next sync time
    UPDATE public.facebook_page_configs
    SET next_sync_at = NOW() + (sync_interval || ' minutes')::INTERVAL
    WHERE id = config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Auto-sync database setup completed successfully!' as status;
