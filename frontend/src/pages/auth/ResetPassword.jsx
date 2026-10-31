import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Lock, KeyRound, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';

export const ResetPassword = () => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!code) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }, 700);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-midnight-950 relative overflow-hidden text-slate-100">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-solar-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-solar-600 to-amber-300 shadow-glow-solar mb-1">
            <Sun className="w-6 h-6 text-midnight-950 font-bold" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create New Password</h1>
          <p className="text-xs text-slate-400">
            Enter your recovery code and choose a new secure password
          </p>
        </div>

        <div className="glass-card border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Password Updated!</h3>
                <p className="text-xs text-slate-400">
                  Your credentials have been updated securely. Redirecting to sign in...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">6-Digit Recovery Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-solar-500 font-mono tracking-widest"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-solar-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-solar-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-2.5 text-xs font-bold flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-midnight-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Reset Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-slate-400 hover:text-white transition">
                  Cancel and return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
