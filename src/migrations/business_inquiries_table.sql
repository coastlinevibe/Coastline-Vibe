-- Create business_inquiries table for storing contact form submissions
CREATE TABLE IF NOT EXISTS public.business_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'spam')),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_spam BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  metadata JSONB
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS business_inquiries_business_id_idx ON public.business_inquiries(business_id);
CREATE INDEX IF NOT EXISTS business_inquiries_user_id_idx ON public.business_inquiries(user_id);
CREATE INDEX IF NOT EXISTS business_inquiries_community_id_idx ON public.business_inquiries(community_id);
CREATE INDEX IF NOT EXISTS business_inquiries_status_idx ON public.business_inquiries(status);
CREATE INDEX IF NOT EXISTS business_inquiries_created_at_idx ON public.business_inquiries(created_at);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;

-- Business owners can see inquiries for their businesses
CREATE POLICY "Business owners can manage their own inquiries" 
ON public.business_inquiries
FOR ALL 
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE user_id = auth.uid()
  )
);

-- Community admins can see inquiries for businesses in their community
CREATE POLICY "Community admins can see inquiries in their community" 
ON public.business_inquiries
FOR SELECT 
TO authenticated
USING (
  community_id IN (
    SELECT community_id FROM public.community_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Users can see inquiries they submitted
CREATE POLICY "Users can see their own inquiries" 
ON public.business_inquiries
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid()
);

-- Allow service role to access all inquiries
CREATE POLICY "Service role has full access to inquiries" 
ON public.business_inquiries
FOR ALL 
TO service_role
USING (true);

-- Add function to count unread inquiries for a business
CREATE OR REPLACE FUNCTION public.get_unread_inquiry_count(business_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*) 
  FROM public.business_inquiries 
  WHERE business_id = $1 
  AND status = 'unread' 
  AND is_archived = false
  AND is_spam = false;
$$ LANGUAGE sql SECURITY DEFINER;

-- Add a trigger function to update the updated_at field
CREATE OR REPLACE FUNCTION update_business_inquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at on update
CREATE TRIGGER update_business_inquiry_updated_at_trigger
BEFORE UPDATE ON public.business_inquiries
FOR EACH ROW
EXECUTE FUNCTION update_business_inquiry_updated_at(); 