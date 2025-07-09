import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function OwnerVerificationPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [status, setStatus] = useState<'not_submitted'|'pending'|'approved'|'rejected'>('not_submitted');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [ownerIdFile, setOwnerIdFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestRequest, setLatestRequest] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);

  // Fetch current user profile and business
  useEffect(() => {
    const fetchProfileAndBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profile);
      // Get the first business owned by this user
      const { data: businesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      if (businesses && businesses.length > 0) {
        setBusiness(businesses[0]);
      }
    };
    fetchProfileAndBusiness();
  }, [supabase]);

  // Fetch latest verification request
  useEffect(() => {
    const fetchLatestRequest = async () => {
      if (!business || !profile) return;
      const { data: requests } = await supabase
        .from('business_verification_requests')
        .select('*')
        .eq('business_id', business.id)
        .eq('owner_id', profile.id)
        .order('submitted_at', { ascending: false })
        .limit(1);
      if (requests && requests.length > 0) {
        setLatestRequest(requests[0]);
        setStatus(requests[0].status);
        setRejectionReason(requests[0].rejection_reason || null);
      } else {
        setStatus('not_submitted');
        setLatestRequest(null);
        setRejectionReason(null);
      }
    };
    fetchLatestRequest();
  }, [business, profile, supabase, success]);

  // Handle file uploads and submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!registrationFile || !ownerIdFile) {
      setError('Please upload both your business registration and owner ID.');
      return;
    }
    if (!business || !profile) {
      setError('Could not find your business or profile.');
      return;
    }
    setUploading(true);
    try {
      // Upload files to storage
      const uploadFile = async (file: File, type: string) => {
        const path = `business-verification/${business.id}/${type}-${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from('business-uploads')
          .upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('business-uploads').getPublicUrl(path);
        return data.publicUrl;
      };
      const registrationUrl = await uploadFile(registrationFile, 'registration');
      const ownerIdUrl = await uploadFile(ownerIdFile, 'ownerid');
      let addressProofUrl = null;
      if (addressProofFile) {
        addressProofUrl = await uploadFile(addressProofFile, 'addressproof');
      }
      // Insert verification request
      const { error: insertError } = await supabase
        .from('business_verification_requests')
        .insert({
          business_id: business.id,
          owner_id: profile.id,
          registration_url: registrationUrl,
          owner_id_url: ownerIdUrl,
          address_proof_url: addressProofUrl,
          status: 'pending',
        });
      if (insertError) throw insertError;
      setSuccess(true);
      setRegistrationFile(null);
      setOwnerIdFile(null);
      setAddressProofFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification request.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-primaryTeal mb-4">Owner Verification</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-700 mb-4">
          To build trust in the community, please submit the following documents for verification:
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-700">
          <li>Business registration/license (PDF, JPG, PNG)</li>
          <li>Owner photo ID (JPG, PNG)</li>
          <li>Optional: Address proof (utility bill, lease, etc.)</li>
        </ul>
        {status === 'approved' && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 rounded p-4 mb-4">
            <strong>Your business is verified!</strong>
          </div>
        )}
        {status === 'pending' && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded p-4 mb-4">
            <strong>Your verification request is pending review.</strong>
          </div>
        )}
        {status === 'rejected' && (
          <div className="bg-red-100 border border-red-300 text-red-800 rounded p-4 mb-4">
            <strong>Your verification request was rejected.</strong>
            {rejectionReason && <div className="mt-2 text-sm">Reason: {rejectionReason}</div>}
          </div>
        )}
        {(status === 'not_submitted' || status === 'rejected') && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-medium mb-1">Business Registration/License *</label>
              <input type="file" accept=".pdf,image/*" onChange={e => setRegistrationFile(e.target.files?.[0] || null)} />
              {registrationFile && <div className="text-xs text-gray-500 mt-1">{registrationFile.name}</div>}
            </div>
            <div>
              <label className="block font-medium mb-1">Owner Photo ID *</label>
              <input type="file" accept="image/*" onChange={e => setOwnerIdFile(e.target.files?.[0] || null)} />
              {ownerIdFile && <div className="text-xs text-gray-500 mt-1">{ownerIdFile.name}</div>}
            </div>
            <div>
              <label className="block font-medium mb-1">Address Proof (optional)</label>
              <input type="file" accept=".pdf,image/*" onChange={e => setAddressProofFile(e.target.files?.[0] || null)} />
              {addressProofFile && <div className="text-xs text-gray-500 mt-1">{addressProofFile.name}</div>}
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="px-6 py-2 rounded bg-primaryTeal text-white font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors"
              disabled={uploading}
            >
              {uploading ? 'Submitting...' : 'Submit Verification Request'}
            </button>
            {success && <div className="text-green-600 text-sm mt-2">Verification request submitted!</div>}
          </form>
        )}
        {status === 'approved' && (
          <div className="mt-4 text-primaryTeal font-medium">Thank you for verifying your business. Your profile now displays a verification badge.</div>
        )}
      </div>
    </div>
  );
} 