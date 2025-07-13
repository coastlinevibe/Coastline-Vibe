"use client";
import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function OwnerVerificationPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [status, setStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected'>('not_submitted');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [ownerIdFile, setOwnerIdFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [registrationPreview, setRegistrationPreview] = useState<string | null>(null);
  const [ownerIdPreview, setOwnerIdPreview] = useState<string | null>(null);
  const [addressProofPreview, setAddressProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Replace with actual logic to get current business and user
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const fetchUserAndSession = async () => {
      // Try getting session first
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session data:', sessionData);
      
      // Then try getting user
      const { data: userData } = await supabase.auth.getUser();
      console.log('User data:', userData);
      
      if (userData?.user) {
        setUser(userData.user);
        setOwnerId(userData.user.id);
        console.log('User authenticated:', userData.user.id);
      } else {
        console.log('No user found');
        setError('You must be logged in.');
      }
    };

    fetchUserAndSession();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (session?.user) {
        setUser(session.user);
        setOwnerId(session.user.id);
        setError(null);
      } else {
        setUser(null);
        setOwnerId(null);
        setError('You must be logged in.');
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch business and verification status when user is available
  useEffect(() => {
    const fetchBusinessAndStatus = async () => {
      if (!user?.id) return;
      
      try {
        // Get business for this user - try both owner_id and user_id
        let businessData = null;
        let businessError = null;
        
        // First try owner_id
        const ownerResult = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
          
        if (ownerResult.data) {
          businessData = ownerResult.data;
          console.log('Business found via owner_id:', businessData);
        } else {
          // If not found, try user_id
          const userResult = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (userResult.data) {
            businessData = userResult.data;
            console.log('Business found via user_id:', businessData);
          } else {
            businessError = userResult.error || ownerResult.error;
            console.log('Business not found via either owner_id or user_id');
          }
        }
        
        if (!businessData) {
          console.log('Business error:', businessError);
          setError('Could not find your business.');
          return;
        }
        
        setBusinessId(businessData.id);
        
        // Check for existing verification request
        const { data: request, error: reqError } = await supabase
          .from('business_verification_requests')
          .select('*')
          .eq('business_id', businessData.id)
          .eq('owner_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (reqError) {
          console.log('Verification request error:', reqError);
          setError('Failed to fetch verification status.');
          return;
        }
        
        if (request) {
          console.log('Verification request found:', request);
          setStatus(request.status as any);
          if (request.status === 'rejected') {
            setRejectionReason(request.rejection_reason || null);
          }
        } else {
          console.log('No verification request found');
          setStatus('not_submitted');
        }
      } catch (err) {
        console.error('Error in fetchBusinessAndStatus:', err);
        setError('An error occurred while fetching data.');
      }
    };
    
    fetchBusinessAndStatus();
  }, [user, supabase]);

  // File preview handlers
  useEffect(() => {
    if (registrationFile) {
      setRegistrationPreview(URL.createObjectURL(registrationFile));
    } else {
      setRegistrationPreview(null);
    }
  }, [registrationFile]);
  useEffect(() => {
    if (ownerIdFile) {
      setOwnerIdPreview(URL.createObjectURL(ownerIdFile));
    } else {
      setOwnerIdPreview(null);
    }
  }, [ownerIdFile]);
  useEffect(() => {
    if (addressProofFile) {
      setAddressProofPreview(URL.createObjectURL(addressProofFile));
    } else {
      setAddressProofPreview(null);
    }
  }, [addressProofFile]);

  // File input refs for re-upload
  const regInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const addrInputRef = useRef<HTMLInputElement>(null);

  // Upload file to Supabase Storage
  const uploadFile = async (file: File, type: string, businessId: string) => {
    const ext = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${ext}`;
    const filePath = `${businessId}/${fileName}`;
    const { error } = await supabase.storage
      .from('businessverifications')
      .upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('businessverifications').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!registrationFile || !ownerIdFile) {
      setError('Please upload both your business registration and owner ID.');
      return;
    }
    if (!businessId || !ownerId) {
      setError('Could not find your business or profile.');
      return;
    }
    setSubmitting(true);
    try {
      // Upload files
      const registrationUrl = await uploadFile(registrationFile, 'registration', businessId);
      const ownerIdUrl = await uploadFile(ownerIdFile, 'ownerid', businessId);
      let addressProofUrl = null;
      if (addressProofFile) {
        addressProofUrl = await uploadFile(addressProofFile, 'addressproof', businessId);
      }
      // Insert verification request
      const { error: insertError } = await supabase
        .from('business_verification_requests')
        .insert({
          business_id: businessId,
          owner_id: ownerId,
          registration_url: registrationUrl,
          owner_id_url: ownerIdUrl,
          address_proof: addressProofUrl,
          status: 'pending',
        });
      if (insertError) throw insertError;
      setSuccess(true);
      setStatus('pending');
      setRegistrationFile(null);
      setOwnerIdFile(null);
      setAddressProofFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification request.');
    } finally {
      setSubmitting(false);
    }
  };

  // UI
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-2">Owner Verification</h1>
      
      {/* Debug info - remove in production */}
      <div className="mb-4 p-2 bg-gray-100 text-xs border rounded">
        <p>Debug info:</p>
        <p>User ID: {user?.id || 'Not logged in'}</p>
        <p>Business ID: {businessId || 'Not found'}</p>
        <p>Auth state: {user ? 'Authenticated' : 'Not authenticated'}</p>
      </div>
      
      {/* Status */}
      <div className="mb-4">
        <strong>Status:</strong>{' '}
        {status === 'not_submitted' && <span>Not submitted</span>}
        {status === 'pending' && <span>Pending review</span>}
        {status === 'approved' && <span>Approved</span>}
        {status === 'rejected' && <span>Rejected</span>}
        {status === 'rejected' && rejectionReason && (
          <div className="text-red-600 text-sm">Reason: {rejectionReason}</div>
        )}
      </div>
      {/* Instructions */}
      <div className="mb-4">
        <strong>Instructions:</strong>
        <ul className="list-disc ml-6 text-sm">
          <li>Upload your business registration/license (PDF, JPG, PNG).</li>
          <li>Upload your owner photo ID (JPG, PNG).</li>
          <li>(Optional) Upload address proof (PDF, JPG, PNG).</li>
          <li>All files must be clear and legible.</li>
        </ul>
      </div>
      {/* Form */}
      {(status === 'not_submitted' || status === 'rejected') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registration/license */}
          <div>
            <label className="block font-medium">Business Registration/License *</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              ref={regInputRef}
              onChange={e => {
                if (e.target.files && e.target.files[0]) setRegistrationFile(e.target.files[0]);
              }}
              className="block mt-1"
            />
            {registrationPreview && (
              <div className="mt-1">
                {registrationFile?.type.startsWith('image') ? (
                  <img src={registrationPreview} alt="Registration Preview" className="h-24 border" />
                ) : (
                  <a href={registrationPreview} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View PDF</a>
                )}
                <button type="button" className="ml-2 text-xs text-blue-700 underline" onClick={() => { setRegistrationFile(null); regInputRef.current?.value && (regInputRef.current.value = ''); }}>Re-upload</button>
              </div>
            )}
          </div>
          {/* Owner ID */}
          <div>
            <label className="block font-medium">Owner Photo ID *</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              ref={idInputRef}
              onChange={e => {
                if (e.target.files && e.target.files[0]) setOwnerIdFile(e.target.files[0]);
              }}
              className="block mt-1"
            />
            {ownerIdPreview && (
              <div className="mt-1">
                <img src={ownerIdPreview} alt="Owner ID Preview" className="h-24 border" />
                <button type="button" className="ml-2 text-xs text-blue-700 underline" onClick={() => { setOwnerIdFile(null); idInputRef.current?.value && (idInputRef.current.value = ''); }}>Re-upload</button>
              </div>
            )}
          </div>
          {/* Address Proof (optional) */}
          <div>
            <label className="block font-medium">Address Proof (optional)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              ref={addrInputRef}
              onChange={e => {
                if (e.target.files && e.target.files[0]) setAddressProofFile(e.target.files[0]);
              }}
              className="block mt-1"
            />
            {addressProofPreview && (
              <div className="mt-1">
                {addressProofFile?.type.startsWith('image') ? (
                  <img src={addressProofPreview} alt="Address Proof Preview" className="h-24 border" />
                ) : (
                  <a href={addressProofPreview} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View PDF</a>
                )}
                <button type="button" className="ml-2 text-xs text-blue-700 underline" onClick={() => { setAddressProofFile(null); addrInputRef.current?.value && (addrInputRef.current.value = ''); }}>Re-upload</button>
              </div>
            )}
          </div>
          {/* Submit */}
          <div>
            <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Verification Request'}
            </button>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">Verification request submitted!</div>}
        </form>
      )}
      {(status === 'pending' || status === 'approved') && (
        <div className="text-sm text-gray-700">You have already submitted a verification request. Please wait for admin review.</div>
      )}
    </div>
  );
} 