import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WifiOff, RefreshCw, Home, AlertTriangle, Globe, Server } from 'lucide-react';
import ManagementButton from '../components/common/ManagementButton';

const ServerUnreachable = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0 && !isRetrying) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !isRetrying) {
      handleRetry();
    }
    return () => clearTimeout(timer);
  }, [countdown, isRetrying]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch('/api/health-check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        window.location.reload();
      } else {
        throw new Error('Server still unreachable');
      }
    } catch (error) {
      console.error('Server unreachable:', error);
      setCountdown(30);
      setIsRetrying(false);
    }
  };

  const handleManualRetry = () => {
    setCountdown(0);
    handleRetry();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg px-4 font-sans">
      <div className="admin-panel w-full max-w-md p-8 text-center">
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <Server className="h-10 w-10" />
          <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white">
            <WifiOff className="h-3.5 w-3.5" />
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-admin-text">
          Server unreachable
        </h1>
        <p className="mt-2 text-sm text-admin-text-sub">
          Unable to connect to the server. This could be due to:
        </p>

        <div className="mt-5 space-y-2 rounded-lg border border-admin-border bg-admin-raised p-4 text-left">
          <div className="flex items-center gap-2 text-sm text-admin-text-sub">
            <Globe className="h-4 w-4 text-rose-500" />
            <span>Network connectivity issues</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-admin-text-sub">
            <Server className="h-4 w-4 text-rose-500" />
            <span>Server is down or under maintenance</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-admin-text-sub">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <span>Firewall or proxy blocking the connection</span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <ManagementButton
            tone="rose"
            fullWidth
            loading={isRetrying}
            onClick={handleManualRetry}
            leftIcon={!isRetrying ? <RefreshCw className="h-4 w-4" /> : undefined}
          >
            {isRetrying
              ? 'Retrying…'
              : `Retry connection${countdown > 0 ? ` (${countdown}s)` : ''}`}
          </ManagementButton>

          <ManagementButton
            tone="slate"
            variant="outline"
            fullWidth
            onClick={() => navigate('/')}
            leftIcon={<Home className="h-4 w-4" />}
          >
            Go to Dashboard
          </ManagementButton>
        </div>

        <div className="mt-6 border-t border-admin-border pt-4">
          <p className="text-sm text-admin-muted">
            If the problem persists, check your internet connection or contact your system
            administrator.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/login';
            }}
            className="mt-2 text-sm font-semibold text-admin-accent-text hover:underline"
          >
            Try logging in again →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerUnreachable;
