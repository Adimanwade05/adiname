export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
}

export interface FacebookLead {
  id: number
  user_id: string
  lead_id: string
  page_id: string
  form_id: string
  full_name: string | null
  email: string | null
  phone_number: string | null
  submitted_at: string | null
  raw_data: any
  created_at: string
  updated_at: string
}

export interface FacebookPageConfig {
  id: number
  user_id: string
  page_id: string
  page_name: string | null
  access_token: string
  created_at: string
  updated_at: string
}

export interface FacebookLeadForm {
  id: number
  user_id: string
  page_config_id: number
  form_id: string
  form_name: string | null
  created_at: string
  updated_at: string
}
