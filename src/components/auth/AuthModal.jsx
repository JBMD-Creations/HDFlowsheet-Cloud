import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { signIn, signUp, resetPassword, error: authError } = useAuth();
  const [mode, setMode] = useState('login'); // login, signup, reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        onSuccess?.();
        onClose();
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signUp(email, password);
        setMessage('Account created! Please check your email to verify your account.');
        setMode('login');
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('Password reset email sent! Check your inbox.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setMessage('');
  };

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>
            {mode === 'login' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login' && 'Sign in to sync your data across devices'}
            {mode === 'signup' && 'Create an account to save your data to the cloud'}
            {mode === 'reset' && 'Enter your email to receive a reset link'}
          </p>
          <button className="auth-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {authError && <div className="auth-error">{authError}</div>}
          {message && <div className="auth-message">{message}</div>}

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {mode !== 'reset' && (
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'reset' && 'Send Reset Link'}
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' && (
            <>
              <button className="auth-link" onClick={() => switchMode('signup')}>
                Don't have an account? Sign up
              </button>
              <button className="auth-link" onClick={() => switchMode('reset')}>
                Forgot password?
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button className="auth-link" onClick={() => switchMode('login')}>
              Already have an account? Sign in
            </button>
          )}
          {mode === 'reset' && (
            <button className="auth-link" onClick={() => switchMode('login')}>
              Back to sign in
            </button>
          )}
        </div>

        <div className="auth-skip">
          <button className="auth-skip-btn" onClick={onClose}>
            Continue without signing in
          </button>
          <p className="auth-skip-note">Data will only be saved locally</p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
