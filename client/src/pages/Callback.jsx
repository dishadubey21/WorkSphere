import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { handlePingCallback } from '../services/auth/pingAuth.js';
import Card from '../design-system/Card.jsx';
import Typography from '../design-system/Typography.jsx';

export const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState(null);
  const callbackTriggered = useRef(false);

  useEffect(() => {
    // Avoid double invocation in React StrictMode
    if (callbackTriggered.current) return;
    callbackTriggered.current = true;

    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        setError(errorDescription || `OAuth Error: ${errorParam}`);
        return;
      }

      if (!code || !state) {
        setError('Missing required authorization parameters (code/state).');
        return;
      }

      try {
        const res = await handlePingCallback(code, state);
        if (res.success) {
          await refreshUser();
          navigate('/dashboard', { replace: true });
        } else {
          setError(res.message || 'Verification failed. Please try again.');
        }
      } catch (err) {
        console.error('Callback parsing error:', err);
        setError(err.response?.data?.message || err.message || 'An unexpected authentication error occurred.');
      }
    };

    processCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4">
      <Card className="p-5 text-center shadow-lg border border-light" style={{ maxWidth: '440px', width: '100%', borderRadius: '16px' }}>
        {!error ? (
          <div className="d-flex flex-column align-items-center gap-3">
            <div className="placeholder-shimmer rounded-circle p-2 mb-2" style={{ width: '72px', height: '72px' }}>
              <div className="spinner-border text-ws-primary" role="status" style={{ width: '40px', height: '40px', borderWidth: '4px' }}>
                <span className="visually-hidden">Verifying credentials...</span>
              </div>
            </div>
            <Typography variant="h3" className="mb-1 text-dark fw-bold">
              Verifying Session
            </Typography>
            <Typography variant="body" className="text-muted fs-7">
              Exchanging Ping AIC secure credentials. Please wait...
            </Typography>
          </div>
        ) : (
          <div className="d-flex flex-column align-items-center gap-3">
            <div className="bg-ws-danger-light text-ws-danger rounded-circle p-3 mb-2 d-flex align-items-center justify-content-center" style={{ width: '72px', height: '72px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <Typography variant="h3" className="mb-1 text-ws-danger fw-bold">
              Authentication Failed
            </Typography>
            <Typography variant="body" className="text-muted fs-8 mb-3">
              {error}
            </Typography>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="btn btn-ws-primary w-100 py-2.5 rounded-2 font-heading fw-bold fs-7"
            >
              Return to Login
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Callback;
