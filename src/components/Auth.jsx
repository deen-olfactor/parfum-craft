import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Auth() {
  const { saveUser } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isLogin && !name) {
      setError('Please enter your name');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    const userData = {
      id: 'u' + Date.now(),
      name: isLogin ? email.split('@')[0] : name,
      email,
      createdAt: new Date().toISOString()
    };

    saveUser(userData);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">ParfumCraft</h1>
        <p className="auth-subtitle">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: '14px' }}>{error}</div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => setIsLogin(false)}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}