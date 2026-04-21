"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const profileMutation = useMutation({
    mutationFn: () => api.patch('/users/profile', { firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined }),
    onSuccess: async () => { await refreshUser(); setProfileMsg('Profile updated.'); },
    onError: (e: any) => setProfileMsg(e.message),
  });

  const pwMutation = useMutation({
    mutationFn: () => api.patch('/users/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
    onSuccess: () => { setPwMsg('Password changed.'); setPw({ currentPassword: '', newPassword: '', confirm: '' }); },
    onError: (e: any) => setPwMsg(e.message),
  });

  const inputCls = "w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-gold transition-colors text-sm";
  const labelCls = "block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2";

  return (
    <div>
      <p className="text-[10px] tracking-[0.4em] text-kallos-gold uppercase mb-3">Settings</p>
      <h1 className="font-editorial text-4xl text-kallos-ivory mb-10">My Profile</h1>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-kallos-ivory/10 mb-10">
        {(['profile', 'password'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setProfileMsg(''); setPwMsg(''); }}
            className={`pb-3 text-xs tracking-[0.2em] uppercase transition-colors ${
              tab === t ? 'text-kallos-gold border-b border-kallos-gold' : 'text-kallos-ivory/40 hover:text-kallos-ivory'
            }`}
          >
            {t === 'profile' ? 'Personal Info' : 'Change Password'}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <form onSubmit={e => { e.preventDefault(); setProfileMsg(''); profileMutation.mutate(); }} className="space-y-6 max-w-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="profile-first-name" className={labelCls}>First Name</label>
              <input id="profile-first-name" className={inputCls} value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
            </div>
            <div>
              <label htmlFor="profile-last-name" className={labelCls}>Last Name</label>
              <input id="profile-last-name" className={inputCls} value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label htmlFor="profile-phone" className={labelCls}>Phone</label>
            <input id="profile-phone" className={inputCls} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit mobile number" />
          </div>
          <div>
            <label htmlFor="profile-email" className={labelCls}>Email</label>
            <input id="profile-email" className={`${inputCls} opacity-40`} value={user?.email} disabled />
          </div>
          {profileMsg && <p className={`text-xs ${profileMsg.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>{profileMsg}</p>}
          <button type="submit" disabled={profileMutation.isPending} className="px-8 py-3 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase hover:bg-kallos-gold transition-colors disabled:opacity-50">
            {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <form onSubmit={e => {
          e.preventDefault();
          setPwMsg('');
          if (pw.newPassword !== pw.confirm) { setPwMsg('Passwords do not match'); return; }
          if (pw.newPassword.length < 8) { setPwMsg('Min. 8 characters'); return; }
          pwMutation.mutate();
        }} className="space-y-6 max-w-md">
          <div>
            <label htmlFor="profile-current-password" className={labelCls}>Current Password</label>
            <input id="profile-current-password" type="password" className={inputCls} value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="profile-new-password" className={labelCls}>New Password</label>
            <input id="profile-new-password" type="password" className={inputCls} value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} required placeholder="Min. 8 characters" />
          </div>
          <div>
            <label htmlFor="profile-confirm-password" className={labelCls}>Confirm New Password</label>
            <input id="profile-confirm-password" type="password" className={inputCls} value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} required />
          </div>
          {pwMsg && <p className={`text-xs ${pwMsg.includes('changed') ? 'text-green-400' : 'text-red-400'}`}>{pwMsg}</p>}
          <button type="submit" disabled={pwMutation.isPending} className="px-8 py-3 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase hover:bg-kallos-gold transition-colors disabled:opacity-50">
            {pwMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}
