import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🤖</div>
        <h1 className={styles.title}>Crypto Give Away</h1>
        <p className={styles.subtitle}>Admin Dashboard</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          <input className={styles.input} placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)} required autoFocus />
          <input className={styles.input} type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} required />
          <button className={styles.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
