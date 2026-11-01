import React from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  ServerCrash,
  WifiOff,
  HelpCircle,
  Clock,
  RotateCcw,
  Home,
  ArrowLeft,
  Lock,
  FileQuestion,
  ZapOff
} from 'lucide-react';
import Button from '../../components/ui/Button';

const errorConfigs = {
  400: {
    title: '400 - Bad Request',
    subtitle: 'Invalid Request Syntax',
    description: 'The server could not understand the request due to invalid syntax or missing required parameters.',
    icon: AlertTriangle,
    color: 'amber',
    canRetry: false
  },
  401: {
    title: '401 - Unauthorized Access',
    subtitle: 'Authentication Required or Expired',
    description: 'Your session has expired or you need to log in to access this enterprise module.',
    icon: Lock,
    color: 'rose',
    canRetry: false,
    action: { label: 'Go to Login', to: '/login' }
  },
  403: {
    title: '403 - Access Forbidden',
    subtitle: 'Role Permission Denied',
    description: 'You do not have the required administrative or role-based clearance to view or execute this action.',
    icon: ShieldAlert,
    color: 'rose',
    canRetry: false
  },
  404: {
    title: '404 - Page Not Found',
    subtitle: 'Resource Does Not Exist',
    description: 'The solar project record, module, or page you are looking for does not exist or has been moved.',
    icon: FileQuestion,
    color: 'solar',
    canRetry: false
  },
  408: {
    title: '408 - Request Timeout',
    subtitle: 'Server Timed Out',
    description: 'The server took too long to respond while executing the solar calculation or query.',
    icon: Clock,
    color: 'amber',
    canRetry: true
  },
  422: {
    title: '422 - Validation Error',
    subtitle: 'Unprocessable Entity',
    description: 'The submitted form or calculation contained validation conflicts with solar engineering rules.',
    icon: AlertTriangle,
    color: 'amber',
    canRetry: true
  },
  429: {
    title: '429 - Too Many Requests',
    subtitle: 'Rate Limit Exceeded',
    description: 'Too many requests were sent in a short duration. Please wait a moment before trying again.',
    icon: Clock,
    color: 'amber',
    canRetry: true
  },
  500: {
    title: '500 - Internal Server Error',
    subtitle: 'Unexpected Backend Failure',
    description: 'An internal server error occurred while processing the request. Our engineering team has been notified.',
    icon: ServerCrash,
    color: 'rose',
    canRetry: true
  },
  502: {
    title: '502 - Bad Gateway',
    subtitle: 'Proxy / Upstream Failure',
    description: 'The application gateway received an invalid response from the upstream solar API service.',
    icon: ZapOff,
    color: 'rose',
    canRetry: true
  },
  503: {
    title: '503 - Service Unavailable',
    subtitle: 'Temporary Maintenance or Overload',
    description: 'The solar backend server or MongoDB database is temporarily offline or undergoing maintenance. Please retry shortly.',
    icon: ServerCrash,
    color: 'rose',
    canRetry: true
  },
  network: {
    title: 'Network Connection Offline',
    subtitle: 'Unable to Reach Server',
    description: 'Please verify your internet connection. The frontend was unable to connect to the solar API server.',
    icon: WifiOff,
    color: 'rose',
    canRetry: true
  }
};

export const ErrorPage = ({
  code: propCode,
  title: propTitle,
  description: propDescription,
  onRetry: propOnRetry
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const code = propCode || params.code || location.state?.code || '404';
  const config = errorConfigs[code] || errorConfigs['404'];

  const title = propTitle || location.state?.title || config.title;
  const description = propDescription || location.state?.description || config.description;
  const Icon = config.icon || HelpCircle;

  const handleRetry = () => {
    if (propOnRetry) {
      propOnRetry();
    } else if (location.state?.retryUrl) {
      navigate(location.state.retryUrl);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full p-8 rounded-2xl border border-slate-700/80 text-center space-y-6 shadow-2xl">
        {/* Error Icon Halo */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-solar-500/15 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-glow-solar">
            <Icon className="w-8 h-8 text-solar-400" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-solar-400 bg-solar-500/10 px-3 py-1 rounded-full border border-solar-500/30">
            {config.subtitle}
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-800">
          {config.canRetry && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={handleRetry}
              className="w-full sm:w-auto"
            >
              Retry Action
            </Button>
          )}

          {config.action ? (
            <Link to={config.action.to} className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full">
                {config.action.label}
              </Button>
            </Link>
          ) : (
            <Link to="/" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Home className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Back to Dashboard
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
