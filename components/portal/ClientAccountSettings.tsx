'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Building,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Check,
  Camera,
  LogOut,
  Loader2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { createClient } from '@/lib/supabase/client';
import { updateClientProfileAction, updatePasswordAction } from '@/app/actions/settings';

interface ClientAccountSettingsProps {
  initialFullName: string;
  initialEmail: string;
  initialBusinessName: string;
  initialPhone: string;
  initialAddress: string;
  initialAvatarInitials: string;
}

export function ClientAccountSettings({
  initialFullName,
  initialEmail,
  initialBusinessName,
  initialPhone,
  initialAddress,
  initialAvatarInitials,
}: ClientAccountSettingsProps) {
  const router = useRouter();
  const supabase = createClient();

  // Profile Form State
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [avatarInitials, setAvatarInitials] = useState(initialAvatarInitials);
  const [profileToast, setProfileToast] = useState<string | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();

  // Security Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSecurityPending, startSecurityTransition] = useTransition();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileToast(null);

    startProfileTransition(async () => {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('phone', phone);
      formData.append('address', address);

      const res = await updateClientProfileAction(formData);
      if (res?.error) {
        setProfileToast(`Error: ${res.error}`);
      } else {
        if (res?.initials) setAvatarInitials(res.initials);
        setProfileToast('Profile information updated successfully!');
        setTimeout(() => setProfileToast(null), 4000);
      }
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (newPassword.length < 6) {
      setSecurityMessage({ text: 'Password must be at least 6 characters.', isError: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ text: 'New passwords do not match.', isError: true });
      return;
    }

    startSecurityTransition(async () => {
      const formData = new FormData();
      formData.append('newPassword', newPassword);

      const res = await updatePasswordAction(formData);
      if (res?.error) {
        setSecurityMessage({ text: res.error, isError: true });
      } else {
        setNewPassword('');
        setConfirmPassword('');
        setSecurityMessage({ text: 'Password successfully updated!', isError: false });
        setTimeout(() => setSecurityMessage(null), 4000);
      }
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {profileToast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 ${
            profileToast.startsWith('Error')
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900 text-white'
          }`}
        >
          {!profileToast.startsWith('Error') && <Check className="w-4 h-4 text-emerald-400" />}
          <span>{profileToast}</span>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1.5">
          <Link href="/portal" className="hover:text-slate-700 transition-colors">
            Portal
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Account</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal details, contact preferences, and login credentials.
        </p>
      </div>

      {/* Main Grid: Left Profile Card (7 cols), Right Security Cards (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 sm:p-8 border-slate-200">
            {/* Profile Avatar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-100">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#0e2a47] text-white flex items-center justify-center text-xl font-bold shadow-md tracking-wider">
                  {avatarInitials}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center border-2 border-white text-xs shadow-xs"
                  title="Profile Avatar"
                >
                  <Camera className="w-3 h-3" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                    {fullName || 'Client User'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Verified Client
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{initialBusinessName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{initialEmail}</p>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      disabled
                      value={initialEmail}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed shadow-xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Managed by your insurance agency</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Company / Business</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      disabled
                      value={initialBusinessName}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed shadow-xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Registered insured business</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Business Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Commercial Way, Suite 100"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isProfilePending}
                  className="bg-[#0e2a47] hover:bg-[#0a1e33] text-white font-semibold text-xs py-2.5 px-6 rounded-xl shadow-sm flex items-center gap-2"
                >
                  {isProfilePending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Security & Sign Out Cards */}
        <div className="lg:col-span-5 space-y-6">
          {/* Password Card */}
          <Card className="p-6 sm:p-8 border-slate-200 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[#0e2a47] shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-500">Update your credentials to keep your account safe</p>
              </div>
            </div>

            {securityMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  securityMessage.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}
              >
                {!securityMessage.isError && <Check className="w-4 h-4 text-emerald-600" />}
                <span>{securityMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={isSecurityPending}
                  className="bg-[#0e2a47] hover:bg-[#0a1e33] text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  {isSecurityPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Account Details & Sign Out Card */}
          <Card className="p-6 border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Managing Agency</span>
              <span className="text-slate-900 font-bold">The Ewing Agency Inc.</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Account Type</span>
              <span className="text-slate-900 font-bold">Client Portal</span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50/50 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Portal</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
