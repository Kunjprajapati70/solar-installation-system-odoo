import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Mail, ArrowLeft, Send, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.message || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-midnight-950 relative overflow-hidden text-slate-100">
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-solar-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-solar-600 to-amber-300 shadow-glow-solar mb-1">
            <Sun className="w-6 h-6 text-midnight-950 font-bold" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Account Password</h1>
          <p className="text-xs text-slate-400">
            Enter your registered email to receive a secret 6-digit OTP verification code
          </p>
        </div>

        <div className="glass-card border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Verification Code Dispatched</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  A confidential 6-digit OTP has been sent to your email inbox:
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-solar-400 font-mono font-bold text-xs mt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{email}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
                  <Lock className="w-3.5 h-3.5 text-solar-400 shrink-0" />
                  <span>Confidential Security Code</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  For your account security, the one-time verification code is kept strictly secret and has been emailed to you. Please check your email inbox (and spam folder) and enter the code on the next screen. The code is valid for 10 minutes.
                </p>
              </div>

              <div className="pt-2 flex flex-col space-y-2">
                <Button
                  variant="primary"
                  onClick={() => navigate('/reset-password', { state: { email } })}
                  className="w-full text-xs font-bold py-2.5"
                >
                  Proceed to Enter Code
                </Button>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-slate-400 hover:text-solar-400 transition"
                >
                  Use a different email address
                </button>
                <Link to="/login" className="text-xs text-slate-500 hover:text-white transition pt-1">
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@sunpowersolutions.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-solar-500 transition"
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
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Secret 6-Digit OTP</span>
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-solar-400 transition">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
