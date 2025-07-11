-- =====================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- =====================================================

-- Note: This script should only be run after a user has signed up
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from auth.users

-- Insert sample Facebook page config
-- INSERT INTO public.facebook_page_configs (user_id, page_id, page_name, access_token) 
-- VALUES (
--     'YOUR_USER_ID_HERE',
--     '123456789',
--     'Sample Business Page',
--     'sample_access_token_here'
-- );

-- Insert sample lead tags
-- INSERT INTO public.lead_tags (user_id, tag_name, tag_color) VALUES
-- ('YOUR_USER_ID_HERE', 'Hot Lead', '#EF4444'),
-- ('YOUR_USER_ID_HERE', 'Cold Lead', '#3B82F6'),
-- ('YOUR_USER_ID_HERE', 'Qualified', '#10B981'),
-- ('YOUR_USER_ID_HERE', 'Follow Up', '#F59E0B'),
-- ('YOUR_USER_ID_HERE', 'Not Interested', '#6B7280');

-- Insert sample leads
-- INSERT INTO public.facebook_leads (
--     user_id, lead_id, page_id, form_id, full_name, email, phone_number, 
--     lead_source, lead_status, submitted_at
-- ) VALUES
-- ('YOUR_USER_ID_HERE', 'sample_lead_1', '123456789', 'form_123', 'John Doe', 'john@example.com', '+1234567890', 'facebook', 'new', NOW() - INTERVAL '1 day'),
-- ('YOUR_USER_ID_HERE', 'sample_lead_2', '123456789', 'form_123', 'Jane Smith', 'jane@example.com', '+1234567891', 'facebook', 'contacted', NOW() - INTERVAL '2 days'),
-- ('YOUR_USER_ID_HERE', 'manual_sample_1', '123456789', 'form_123', 'Bob Johnson', 'bob@example.com', '+1234567892', 'manual', 'qualified', NOW() - INTERVAL '3 days');

SELECT 'Sample data insertion template ready. Replace YOUR_USER_ID_HERE with actual user ID.' as status;
