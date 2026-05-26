import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        }),
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        setError(data.error || 'Login failed. Please check your credentials.');
      } else {
        // Success! Store the manual JWT in sessionStorage
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        window.location.href = '/';
      }
    } catch (err: any) {
      setError('Login failed. Ensure the backend orchestrator is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <div className="glass-panel" style={{
        padding: '3rem',
        maxWidth: '400px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        alignItems: 'center',
        borderRadius: 'var(--radius-lg)'
      }}>
        
        <div style={{ textAlign: 'center' }}>
          <div className="flex-center" style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            margin: '0 auto 1rem'
          }}>
            <Bot size={36} color="white" />
          </div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem' }}>Welcome Back</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Sign in to PlotArmor AI</p>
        </div>

        {error && (
          <div style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: 'rgba(255, 61, 113, 0.1)',
            border: '1px solid var(--danger, #ff3d71)',
            borderRadius: '8px',
            color: 'var(--danger, #ff3d71)',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Username or Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}
          >
            <LogIn size={20} />
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
};
