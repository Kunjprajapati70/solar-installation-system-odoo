import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetRequest = (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
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
            Enter your verified email to receive a password reset recovery link
          </p>
        </div>

        <div className="glass-card border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Check your email</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  We've sent a 6-digit recovery code and verification link to <span className="text-slate-200 font-mono">{email}</span>.
                </p>
              </div>
              <div className="pt-2 flex flex-col space-y-2">
                <Button variant="primary" onClick={() => navigate('/reset-password')} className="w-full text-xs">
                  Proceed to Enter Code
                </Button>
                <Link to="/login" className="text-xs text-slate-400 hover:text-white transition">
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
                    placeholder="technician@sunpower.com"
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
                    <span>Send Password Reset Instructions</span>
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
