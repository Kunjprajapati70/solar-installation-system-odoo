import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Smartphone,
  Users,
  ClipboardCheck,
  Layers,
  Sparkles,
  Server,
  Database,
  Activity,
  RefreshCw,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Wifi,
  WifiOff,
  Wrench,
  Check,
  Zap
} from 'lucide-react';
import api from '../api/client';
import heroSolarImg from '../assets/solar-hero.jpg';
import introSolarImg from '../assets/solar-intro.jpg';
import ctaSolarImg from '../assets/solar-cta.jpg';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Navigation state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Live System Status State
  const [statusLoading, setStatusLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [apiLatency, setApiLatency] = useState(null);
  const [healthData, setHealthData] = useState({
    status: 'checking',
    database: 'checking',
    uptime: null,
    service: 'SunPower Solutions'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track window scroll for sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Live System Status from /api/health
  const checkHealth = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    const startTime = performance.now();

    try {
      const res = await api.get('/health', { timeout: 6000 });
      const latency = Math.round(performance.now() - startTime);
      setApiLatency(latency);
      setHealthData({
        status: res?.status === 'online' ? 'operational' : 'degraded',
        database: res?.database || 'disconnected',
        uptime: res?.uptime || null,
        service: res?.service || 'SunPower Solutions Enterprise'
      });
      setLastChecked(new Date());
    } catch (err) {
      const latency = Math.round(performance.now() - startTime);
      setApiLatency(latency > 6000 ? null : latency);
      setHealthData({
        status: 'offline',
        database: 'unreachable',
        uptime: null,
        service: 'SunPower Solutions Standby Engine'
      });
      setLastChecked(new Date());
    } finally {
      setStatusLoading(false);
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  // Poll status every 35 seconds
  useEffect(() => {
    checkHealth();
    const interval = setInterval(() => {
      checkHealth();
    }, 35000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Smooth scroll handler
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Format uptime cleanly
  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return 'Standby Active';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m continuous`;
    return `${mins}m continuous`;
  };

  const isAuthenticated = Boolean(token && user);

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'technician') return '/technician-portal';
    if (user.role === 'customer') return '/customer-portal';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-solar-500 selection:text-midnight-950">
      {/* ========================================================= */}
      {/* SECTION 1: CLEAN NAVBAR                                   */}
      {/* ========================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass-panel border-b border-slate-200/90 dark:border-slate-800/80 shadow-sm py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: App Logo & Brand Name */}
            <div
              onClick={() => scrollToSection('hero')}
              className="flex items-center space-x-3 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-solar-600 via-solar-500 to-amber-300 flex items-center justify-center shadow-glow-solar group-hover:scale-105 transition-transform duration-200 shrink-0">
                <Sun className="w-5 h-5 text-midnight-950 font-bold" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg sm:text-xl tracking-tight font-sans text-slate-900 dark:text-white leading-tight">
                  SunPower <span className="gradient-solar-text">Solutions</span>
                </span>
                <span className="text-[10px] font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase hidden sm:block">
                  Solar Energy Management
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium">
              <button
                onClick={() => scrollToSection('hero')}
                className="px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-solar-600 dark:hover:text-solar-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-solar-600 dark:hover:text-solar-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-solar-600 dark:hover:text-solar-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('status')}
                className="px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-solar-600 dark:hover:text-solar-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition flex items-center gap-1.5"
              >
                <span>System Status</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    healthData.status === 'operational'
                      ? 'bg-emerald-500 animate-pulse'
                      : healthData.status === 'checking'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
              </button>
            </nav>

            {/* Right: Theme Toggle & Authentication Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Theme Switcher Button */}
              <button
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 transition duration-150 shadow-sm"
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-solar-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              {/* Login & Get Started Buttons */}
              {isAuthenticated ? (
                <button
                  onClick={() => navigate(getDashboardRoute())}
                  className="inline-flex items-center justify-center font-bold text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-solar-600 via-solar-500 to-amber-400 hover:from-solar-500 hover:to-amber-300 text-midnight-950 shadow-glow-solar transition-all duration-200 active:scale-95"
                >
                  <span>Go to Workspace</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-semibold px-4 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-solar-600 dark:hover:text-solar-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center font-bold text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-solar-600 via-solar-500 to-amber-400 hover:from-solar-500 hover:to-amber-300 text-midnight-950 shadow-glow-solar transition-all duration-200 active:scale-95"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu & Theme Button */}
            <div className="flex items-center space-x-2 md:hidden">
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {isDark ? <Sun className="w-4 h-4 text-solar-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
                className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 mt-3 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => scrollToSection('hero')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              About Platform
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Key Capabilities
            </button>
            <button
              onClick={() => scrollToSection('status')}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>Live System Status</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  healthData.status === 'operational'
                    ? 'bg-emerald-500'
                    : healthData.status === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
            </button>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(getDashboardRoute());
                  }}
                  className="w-full py-2.5 rounded-xl text-center font-bold text-sm bg-gradient-to-r from-solar-600 via-solar-500 to-amber-400 text-midnight-950 shadow-glow-solar"
                >
                  Enter Workspace
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full py-2.5 rounded-xl text-center font-semibold text-sm border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full py-2.5 rounded-xl text-center font-bold text-sm bg-gradient-to-r from-solar-600 via-solar-500 to-amber-400 text-midnight-950 shadow-glow-solar"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* SECTION 2: HERO — THE MOST IMPORTANT SECTION              */}
      {/* ========================================================= */}
      <section
        id="hero"
        className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8"
      >
        {/* Ambient background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] sm:w-[48rem] h-[32rem] bg-gradient-to-b from-solar-500/10 via-amber-400/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-solar-400 border border-amber-500/30 dark:border-solar-500/30 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-solar-500" />
            <span>SMART SOLAR MANAGEMENT PLATFORM</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] mb-7">
            Powering a Brighter Future with{' '}
            <span className="gradient-solar-text block sm:inline">
              Smarter Solar Management.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            One intelligent platform to manage solar projects, streamline installations, coordinate teams, and monitor your solar operations.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => scrollToSection('about')}
              className="w-full sm:w-auto inline-flex items-center justify-center font-bold text-base px-7 py-3.5 rounded-xl bg-gradient-to-r from-solar-600 via-solar-500 to-amber-400 hover:from-solar-500 hover:to-amber-300 text-midnight-950 shadow-glow-solar transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Explore Platform</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? getDashboardRoute() : '/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center font-semibold text-base px-7 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-midnight-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>

        {/* Hero Visual Composition — High-Quality Solar Photography */}
        <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 dark:border-white/10 shadow-2xl bg-slate-900">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full">
              <img
                src={heroSolarImg}
                alt="Solar panels capturing sunlight on clean modern rooftop"
                loading="eager"
                className="w-full h-full object-cover object-center"
              />
              {/* Subtle visual gradient overlay for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/80 via-transparent to-midnight-950/20 pointer-events-none" />

              {/* Floating Live Telemetry Badge over image */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center space-x-3 px-4 py-2.5 rounded-xl glass-panel border border-white/20 text-white shadow-lg backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div className="text-left">
                  <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                    <span>High-Efficiency Photovoltaic Grid</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/20 px-1.5 py-0.2 rounded">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Real-time generation telemetry &amp; project dispatch
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Small Scroll Indicator */}
        <div
          onClick={() => scrollToSection('about')}
          className="mt-12 inline-flex flex-col items-center text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-solar-600 dark:hover:text-solar-400 cursor-pointer transition select-none group"
        >
          <span className="tracking-wider uppercase text-[11px] mb-1">Scroll to explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce group-hover:text-solar-500" />
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 3: SIMPLE PLATFORM INTRODUCTION                   */}
      {/* ========================================================= */}
      <section id="about" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold font-mono tracking-widest uppercase text-solar-600 dark:text-solar-400 block mb-3">
              UNIFIED SOLAR OPERATIONS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Everything Connected. <br className="hidden sm:inline" />
              <span className="gradient-solar-text">Every Installation Smarter.</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              SunPower Solutions brings customer enquiries, site feasibility surveys, custom engineering quotations, field technicians, and physical equipment tracking into a single synchronized operating system.
            </p>
          </div>

          {/* Clean Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Column 1: Solar Installation Image Composition */}
            <div className="relative order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-2xl relative group bg-midnight-900">
                <div className="aspect-[4/3] w-full">
                  <img
                    src={introSolarImg}
                    alt="Pristine solar array under vibrant sky"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/70 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Overlapping feature highlight card */}
              <div className="absolute -bottom-6 -right-2 sm:-bottom-8 sm:right-6 glass-card p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xl max-w-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      PM Surya Ghar Compliant
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Direct subsidy documentation &amp; verification
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: 3 Key Capabilities with Minimal Icons & Whitespace */}
            <div className="order-1 lg:order-2 space-y-8">
              {/* Capability 1 */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-solar-400 flex items-center justify-center shrink-0 mt-1 border border-amber-500/20">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    End-to-End Project Pipeline
                  </h3>
                  <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Seamlessly transition prospects from initial enquiry to roof shadow analysis, formal bill of materials, order approval, and final grid commissioning without lost handoffs.
                  </p>
                </div>
              </div>

              {/* Capability 2 */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-1 border border-emerald-500/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Synchronized Field Operations
                  </h3>
                  <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Arm rooftop crews with a mobile portal that validates installation steps, uploads geotagged photographic proof, and scans equipment barcodes in real time.
                  </p>
                </div>
              </div>

              {/* Capability 3 */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-1 border border-sky-500/20">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Intelligent Serialization &amp; Warranties
                  </h3>
                  <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Track individual panel, inverter, and battery serials through unique QR identifiers. Automatically issue digital warranty certificates upon project handover.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 4: KEY FEATURES                                   */}
      {/* ========================================================= */}
      <section id="features" className="py-20 sm:py-28 bg-slate-100/60 dark:bg-midnight-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold font-mono tracking-widest uppercase text-solar-600 dark:text-solar-400 block mb-3">
              CORE CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Purpose-Built for Solar Excellence
            </h2>
            <p className="mt-3.5 text-base text-slate-600 dark:text-slate-400">
              Six essential modules engineered specifically for solar contractors, installers, engineers, and customers.
            </p>
          </div>

          {/* Minimal 3x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="glass-card glass-card-hover p-7 rounded-2xl border border-slate-200 dark:border-slate-800/90 relative group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-solar-600 dark:text-solar-400 flex items-center justify-center mb-5 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Solar Project Management
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Centralized orchestration from initial enquiry to final commissioning with milestone tracking, technician assignments, and SLA visibility.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card glass-card-hover p-7 rounded-2xl border border-slate-200 dark:border-slate-800/90 relative group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 border border-purple-500/20 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Customer CRM &amp; Portal
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Comprehensive customer directory, quotation history, and a self-service customer portal for rooftop generation metrics and invoice downloads.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card glass-card-hover p-7 rounded-2xl border border-slate-200 dark:border-slate-800/90 relative group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Technician Field Coordination
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Mobile-optimized workflow portal for field engineers with task dispatch, live installation checklists, photo proof uploads, and repair tickets.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card glass-card-hover p-7 rounded-2xl border border-slate-200 dark:border-slate-800/90 relative group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-5 border border-sky-500/20 group-hover:scale-105 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Smart Equipment QR Tracking
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Warehouse and on-site hardware tracking with individual QR code scanning for solar panels, inverters, and battery banks with real-time field lookup.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card glass-card-hover p-7 rounded-2xl border border-slate-200 dark:border-slate-800/90 relative group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 border border-rose-500/20 group-hover:scale-105 transition-transform">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Precision Site Surveys
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                On-site roof geometry measurements, shadow analysis, orientation tilt calculation, and electrical structural feasibility verification.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card glass-card-hover p-7 rounded-2xl border border-slate-200 dark:border-slate-800/90 relative group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Subsidy Filing &amp; Analytics
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Automated PM Surya Ghar Muft Bijli Yojana subsidy tracking, milestone payment reconciliation, margin tracking, and executive business reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 5: LIVE PLATFORM STATUS                           */}
      {/* ========================================================= */}
      <section id="status" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-3">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>LIVE PLATFORM TELEMETRY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Built for Reliable Operations.
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl">
                Continuous health verification across backend services, database clusters, and operational endpoints.
              </p>
            </div>

            {/* Refresh Action */}
            <div className="flex items-center space-x-3 self-start md:self-auto">
              {lastChecked && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Checked: {lastChecked.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => checkHealth(true)}
                disabled={isRefreshing}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-midnight-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition disabled:opacity-50 cursor-pointer"
                title="Refresh Live Health Metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-solar-500' : ''}`} />
                <span>{isRefreshing ? 'Checking...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Status Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Backend API Status */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Backend API
                </span>
                <Server className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-center space-x-2.5">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    healthData.status === 'operational'
                      ? 'bg-emerald-500 animate-pulse'
                      : healthData.status === 'checking'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {statusLoading
                    ? 'Verifying...'
                    : healthData.status === 'operational'
                    ? 'Operational'
                    : healthData.status === 'degraded'
                    ? 'Degraded'
                    : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                REST Gateway &amp; Socket Engine
              </p>
            </div>

            {/* Card 2: Database Connection */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Database Link
                </span>
                <Database className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-center space-x-2.5">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    healthData.database === 'connected'
                      ? 'bg-emerald-500'
                      : healthData.database === 'checking'
                      ? 'bg-amber-400'
                      : 'bg-amber-500'
                  }`}
                />
                <span className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {statusLoading
                    ? 'Checking...'
                    : healthData.database === 'connected'
                    ? 'Connected'
                    : 'Standby / Sync'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                MongoDB Document Store
              </p>
            </div>

            {/* Card 3: API Response Time */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  API Latency
                </span>
                <Zap className="w-4 h-4 text-solar-500" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {statusLoading ? '...' : apiLatency !== null ? apiLatency : '—'}
                </span>
                {apiLatency !== null && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">ms</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                {apiLatency && apiLatency < 100
                  ? 'Ultra-low latency response'
                  : 'Round-trip endpoint ping'}
              </p>
            </div>

            {/* Card 4: System Uptime */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  System Uptime
                </span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono truncate">
                {statusLoading ? 'Checking...' : formatUptime(healthData.uptime)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Enterprise High-Availability
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 6: FINAL CTA                                      */}
      {/* ========================================================= */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-white/10 shadow-2xl bg-midnight-950 px-6 py-16 sm:px-12 sm:py-20 text-center">
            {/* Background image with gentle overlay */}
            <img
              src={ctaSolarImg}
              alt="Clean rooftop solar array in sunlight"
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-midnight-950/80 via-midnight-950/95 to-midnight-950 pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5">
                Ready to Power Your Solar Operations?
              </h2>
              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8">
                Bring your projects, people, and installations together in one intelligent platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate(isAuthenticated ? getDashboardRoute() : '/login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center font-bold text-base px-8 py-4 rounded-xl bg-gradient-to-r from-solar-600 via-solar-500 to-amber-400 hover:from-solar-500 hover:to-amber-300 text-midnight-950 shadow-glow-solar transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <span>{isAuthenticated ? 'Open Solar Workspace' : 'Get Started Today'}</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 7: MINIMAL FOOTER                                 */}
      {/* ========================================================= */}
      <footer className="py-12 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-midnight-950 text-slate-600 dark:text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo and short description */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-solar-600 to-amber-300 flex items-center justify-center shadow-glow-solar shrink-0">
                <Sun className="w-4 h-4 text-midnight-950 font-bold" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  SunPower <span className="gradient-solar-text">Solutions</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enterprise Solar Installation &amp; Operations Management Architecture
                </p>
              </div>
            </div>

            {/* Essential Navigation Links */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs sm:text-sm font-medium">
              <button
                onClick={() => scrollToSection('hero')}
                className="hover:text-solar-600 dark:hover:text-solar-400 transition"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="hover:text-solar-600 dark:hover:text-solar-400 transition"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="hover:text-solar-600 dark:hover:text-solar-400 transition"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('status')}
                className="hover:text-solar-600 dark:hover:text-solar-400 transition"
              >
                System Status
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-solar-600 dark:hover:text-solar-400 transition font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-8 pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} SunPower Solutions. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <span>Enterprise Edition v2.6</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Grid Telemetry Connected
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

