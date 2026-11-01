import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Lock, KeyRound, Eye, EyeOff, CheckCircle2, ArrowRight, Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';

export const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState(location.state?.devOtp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResendOtp = async () => {
    if (!email.trim() || cooldown > 0) return;
    try {
      setResending(true);
      setError('');
      setInfoMsg('');
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      if (res.success) {
        setCooldown(45);
        setInfoMsg('New OTP code dispatched via SMTP.');
        if (res.data?.devOtp) {
          setCode(res.data.devOtp);
        }
      } else {
        setError(res.message || 'Failed to resend code');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!email.trim()) {
      setError('Please provide your verified email address');
      return;
    }
    if (!code.trim() || code.trim().length < 6) {
      setError('Please enter the full 6-digit OTP code');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters in length');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: code.trim(),
        newPassword
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login', { state: { resetSuccessEmail: email } });
        }, 2000);
      } else {
        setError(res.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Password reset failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-midnight-950 relative overflow-hidden text-slate-100">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-solar-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-solar-600 to-amber-300 shadow-glow-solar mb-1">
            <Sun className="w-6 h-6 text-midnight-950 font-bold" />
          </div>
          <h1 className="text-2xl font-bold text-white">Verify OTP & Set Password</h1>
          <p className="text-xs text-slate-400">
            Enter the 6-digit code received via email to finalize password update
          </p>
        </div>

        <div className="glass-card border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Password Reset Verified!</h3>
                <p className="text-xs text-slate-400">
                  Your credentials have been securely updated in MongoDB. Redirecting you to sign in...
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={() => navigate('/login')}
                  className="w-full text-xs font-bold"
                >
                  Go to Login Now
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              {infoMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                  {infoMsg}
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@sunpower.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-solar-500"
                  />
                </div>
              </div>

              {/* 6-Digit OTP Code with Resend button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">6-Digit Verification OTP</label>
                  <button
                    type="button"
                    disabled={cooldown > 0 || resending || !email.trim()}
                    onClick={handleResendOtp}
                    className="text-[11px] text-solar-400 hover:text-solar-300 disabled:text-slate-600 transition flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                    <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-base font-bold text-solar-400 placeholder-slate-600 focus:outline-none focus:border-solar-500 font-mono tracking-[0.3em]"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">New Password (min. 6 characters)</label>
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

              {/* Confirm New Password */}
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
                    <span>Verify Code & Update Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-solar-400 transition">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel and return to Login</span>
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