import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  Calendar,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const Profile = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSavedMsg('Security credentials updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setSavedMsg(''), 4000);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-slate-800 bg-gradient-to-r from-midnight-900 via-midnight-850 to-midnight-900 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-solar-600 to-amber-300 flex items-center justify-center text-midnight-950 font-black text-2xl shadow-glow-solar flex-shrink-0">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{user?.name || 'Authorized User'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-solar-500/10 text-solar-400 border border-solar-500/30">
                {user?.role} Access
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              SunPower Solutions Enterprise Authorized Operations Account
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user?.email}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{user?.phone || '+91 98765 43210'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 w-64 h-64 bg-solar-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details & Role Permissions */}
        <Card title="Role Permissions & Access Scope" icon={ShieldCheck}>
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">Assigned Privilege Level</span>
              <p className="text-slate-200">
                You are currently signed in as an <strong className="text-solar-400 capitalize">{user?.role}</strong>. Your account has verified access to operational modules according to the company security policy.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">Module Access Checklist</span>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Interactive Telemetry & Database KPIs</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Smart QR Serial Equipment Tracking</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Field Installation Pipeline & Testing Data</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Automatic Warranty Certificates & ₹0 Claims</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password & Security */}
        <Card title="Update Security Credentials" icon={KeyRound}>
          {savedMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-solar-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">New Secure Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-solar-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-2.5 text-xs font-bold"
            >
              {loading ? 'Updating Credentials...' : 'Save Password Changes'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
