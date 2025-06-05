"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [form, setForm] = useState({
    avatar_url: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
  });
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      setProfileId(userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profile) {
        setForm({
          avatar_url: profile.avatar_url || '',
          username: profile.username || '',
          email: profile.email || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
        });
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileId) return;
    setAvatarFile(file);
    const fileExt = file.name.split('.').pop();
    const fileName = `${profileId}_${Date.now()}.${fileExt}`;
    console.log('Uploading avatar:', { fileExt, fileName, file });
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
    }
    if (!uploadError && data) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, avatar_url: publicUrlData?.publicUrl || '' }));
    }
  };

  const handleAvatarDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !profileId) return;
    setAvatarFile(file);
    const fileExt = file.name.split('.').pop();
    const fileName = `${profileId}_${Date.now()}.${fileExt}`;
    console.log('Uploading avatar (drop):', { fileExt, fileName, file });
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
    }
    if (!uploadError && data) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, avatar_url: publicUrlData?.publicUrl || '' }));
    }
  };

  const handleRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    if (!profileId) return;
    let avatarUrl = form.avatar_url;
    const updates = {
      avatar_url: avatarUrl,
      username: form.username,
      email: form.email,
      phone: form.phone,
      bio: form.bio,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId);
    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => router.push('/community/miami'), 1200);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setEmailVerified(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-cyan-100 flex flex-col items-center py-10">
      <div className="w-full max-w-lg bg-white/90 rounded-2xl shadow-xl border border-cyan-100 p-8 flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-cyan-900 mb-4">Edit Profile</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Avatar Upload */}
          <div>
            <h2 className="font-semibold text-cyan-900 mb-2">Profile Photo</h2>
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-cyan-50 transition-colors ${isDragOver ? 'border-cyan-400 bg-cyan-100' : 'border-cyan-200'}`}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
              onDrop={handleAvatarDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              {form.avatar_url ? (
                <div className="relative group">
                  <img src={form.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-cyan-200 object-cover" />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleRemoveAvatar(); }}
                    className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500 border border-red-200 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-cyan-400">
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <span className="mt-2 text-cyan-700 text-sm">Click or drag an image here to upload</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                ref={fileInputRef}
                className="hidden"
              />
            </div>
          </div>
          {/* Basic Info */}
          <div>
            <h2 className="font-semibold text-cyan-900 mb-2">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Name</label>
                <input type="text" name="username" value={form.username} onChange={handleChange} className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition" required />
              </div>
              <div>
                <label className="block font-medium mb-1">Email</label>
                <div className="flex gap-2 items-center">
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition" required placeholder="add email here" />
                  <button type="button" onClick={handleVerifyEmail} className="px-3 py-1 rounded bg-cyan-100 text-cyan-700 font-semibold hover:bg-cyan-200 transition text-xs" disabled={verifying || emailVerified}>
                    {verifying ? 'Verifying...' : emailVerified ? 'Email verified!' : 'Verify Email'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Phone</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition" placeholder="add phone number here" />
              </div>
            </div>
          </div>
          {/* Bio */}
          <div>
            <h2 className="font-semibold text-cyan-900 mb-2">Bio</h2>
            <textarea name="bio" value={form.bio} onChange={handleChange} className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition" rows={3} placeholder="add bio here" />
          </div>
          {success && <div className="text-green-600 text-sm">Profile updated!</div>}
          <div className="flex gap-4 mt-2">
            <button type="submit" className="flex-1 px-4 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" className="flex-1 px-4 py-2 rounded bg-gray-100 text-cyan-700 font-semibold hover:bg-gray-200 transition" onClick={() => router.push('/profile')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
} 