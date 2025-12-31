import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('Verifying...');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token.');
        return;
      }

      try {
        const API = import.meta.env.VITE_API_URL || 'theprojectclub.vercel.app';
        const res = await fetch(`${API}/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch (e) {
        setStatus('error');
        setMessage('Verification failed. Please try again.');
      }
    };

    run();
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Email Verification</h1>
          <p>{message}</p>
        </div>

        {status === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <Link className="auth-btn" to="/login">
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <Link className="auth-btn" to="/login">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
