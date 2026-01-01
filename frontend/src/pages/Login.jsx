import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const { login, resendVerification } = useAuth(); // uses AuthContext
  const [formData, setFormData] = useState({ email: '', password: '' });

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // ✅ show resend button only when backend says email not verified
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        navigate('/profile');
        return;
      }

      setError(result.message || 'Login failed');

      if (result.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');

    if (!formData.email) {
      setError('Enter your email first.');
      return;
    }

    setLoading(true);
    try {
      const res = await resendVerification(formData.email);
      if (res.success) {
        setInfo(res.message || 'Verification email sent. Check your inbox/spam.');
      } else {
        setError(res.message || 'Failed to send verification email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="auth-title">Login</h2>
        <p className="auth-subtitle">Sign in to access your profile</p>

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-success">{info}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">Email</label>
          <input
            className="auth-input"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />

          <label className="auth-label">Password</label>
          <div className="auth-password-field">
            <input
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              className="show-hide-btn"
              onClick={() => setShowPassword((s) => !s)}
              disabled={loading}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {/* ✅ Show resend only when needed */}
        {needsVerification && (
          <button
            className="auth-button secondary"
            onClick={handleResend}
            disabled={loading}
            style={{ marginTop: 10 }}
          >
            {loading ? 'Sending...' : 'Resend verification email'}
          </button>
        )}

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
