import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import logoLight from '../assets/vizo-logo-light.png';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await login(username, password);
    setBusy(false);
    if (!res.ok) setError(res.error || 'Login failed.');
  }

  return (
    <div className="login">
      <form className="login__card card" onSubmit={onSubmit}>
        <div className="login__brand">
          <div className="login__logo-wrap">
            <img className="login__logo" src={logoLight} alt="Vizo Tech" draggable="false" />
          </div>
          <span className="login__tagline">Restaurant Point of Sale</span>
        </div>

        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          autoComplete="username"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          error={error || undefined}
        />

        <Button variant="primary" size="lg" fullWidth type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>
      <p className="login__footer">Software by Vizo Tech — 0308-8528128</p>
    </div>
  );
}
