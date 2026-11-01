import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sun,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  UserCheck,
  Wrench,
  User,
  ArrowRight,
  Sparkles,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import Button from '../../components/ui/Button';

export const Login = () => {
  const { user, token, loading: authLoading, login, switchRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedRole, setCopiedRole] = useState(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (!authLoading && token && user) {
      if (user.role === 'technician') navigate('/technician-portal', { replace: true });
      else if (user.role === 'customer') navigate('/customer-portal', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [authLoading, token, user, navigate]);

  const demoAccounts = [
    {
      role: 'admin',
      label: 'Admin',
      sublabel: 'Full Platform Control',
      email: 'admin@sunpower.com',
      pass: 'admin123',
      icon: ShieldAlert,
      color: 'amber'
    },
    {
      role: 'sales',
      label: 'Sales Employee',
      sublabel: 'Surveys & Quotations',
      email: 'sales@sunpower.com',
      pass: 'sales123',
      icon: UserCheck,
      color: 'sky'
    },
    {
      role: 'technician',
      label: 'Technician',
      sublabel: 'Field Mobile Portal',
      email: 'tech@sunpower.com',
      pass: 'tech123',
      icon: Wrench,
      color: 'emerald'
    },
    {
      role: 'customer',
      label: 'Customer',
      sublabel: 'Solar Rooftop & Invoices',
      email: 'customer@sunpower.com',
      pass: 'customer123',
      icon: User,
      color: 'purple'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please provide your work email address');
      return;
    }
    if (!password) {
      setError('Please provide your password');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        setSuccessMsg('Authentication successful! Initializing workspace...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 600);
      } else {
        setError(result.message || 'Invalid email or password. Please check credentials.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setCopiedRole(acc.role);
    setTimeout(() => setCopiedRole(null), 2000);
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      const res = await switchRole(role);
      if (res.success) {
        setSuccessMsg(`Authenticated as ${role.toUpperCase()} through secure backend!`);
        setTimeout(() => {
          if (role === 'technician') navigate('/technician-portal');
          else if (role === 'customer') navigate('/customer-portal');
          else navigate('/dashboard');
        }, 500);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-midnight-950 relative overflow-hidden text-slate-100">
      {/* Dynamic Background Glow & Solar Geometry */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-solar-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-electric-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-solar-600 via-solar-500 to-amber-300 shadow-glow-solar mb-1">
            <Sun className="w-8 h-8 text-midnight-950 font-bold" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            SunPower <span className="gradient-solar-text">Solutions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Enterprise Solar Installation & Warranty Lifecycle Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-ping" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Work Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sunpower.com"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-solar-500 transition shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-solar-400 hover:text-solar-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-solar-500 transition shadow-inner"
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

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-midnight-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Clearly Labelled Demo Accounts Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-1.5 text-solar-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Accounts (Click card to autofill or 1-click enter)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                const isSelected = email === acc.email;
                return (
                  <div
                    key={acc.role}
                    className={`p-3 rounded-xl border transition text-left flex flex-col justify-between ${
                      isSelected
                        ? 'bg-solar-500/15 border-solar-500 text-white shadow-glow-solar'
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-solar-400" />
                        <span className="font-bold text-white">{acc.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fillCredentials(acc)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 font-mono flex items-center space-x-1"
                        title="Autofill form fields"
                      >
                        {copiedRole === acc.role ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Fill</span>
                      </button>
                    </div>

                    <div className="space-y-0.5 font-mono text-[10px] text-slate-400">
                      <div className="truncate text-slate-300">{acc.email}</div>
                      <div className="text-slate-500">PIN / Pass: <span className="text-solar-400">{acc.pass}</span></div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDemoLogin(acc.role)}
                        disabled={loading}
                        className="text-[10px] font-bold text-solar-400 hover:text-solar-300 flex items-center space-x-1"
                      >
                        <span>1-Click Login</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-solar-500" />
          <span>Authenticates through real MongoDB database with salted bcrypt hashing</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
