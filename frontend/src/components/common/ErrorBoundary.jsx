import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('SunPower render error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#070b14] text-slate-100 p-6">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            <p className="text-sm text-slate-400">
              The workspace hit a render error. You can return to login and continue using the demo accounts.
            </p>
            {this.state.error?.message && (
              <p className="text-xs font-mono text-rose-300 break-all">{this.state.error.message}</p>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
