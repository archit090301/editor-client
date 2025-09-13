import { useState } from 'react';
import axios from 'axios';
import { useTheme } from '../ThemeContext';
import { buttonStyle } from '../styles/buttonStyles';
import './Register.css';

function Register({ onRegisterSuccess }) {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/register', { username, email, password }, { withCredentials: true });
      alert('Registered successfully!');
      onRegisterSuccess();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <form
      className="register-form"
      style={{
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
        color: theme === 'dark' ? '#eee' : '#000'
      }}
      onSubmit={handleRegister}
    >
      <h2>📝 Register</h2>

      <input
        className="register-input"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        type="text"
        required
        style={{
          backgroundColor: theme === 'dark' ? '#2c2c2c' : '#fff',
          color: theme === 'dark' ? '#eee' : '#000'
        }}
      />

      <input
        className="register-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        required
        style={{
          backgroundColor: theme === 'dark' ? '#2c2c2c' : '#fff',
          color: theme === 'dark' ? '#eee' : '#000'
        }}
      />

      <input
        className="register-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        style={{
          backgroundColor: theme === 'dark' ? '#2c2c2c' : '#fff',
          color: theme === 'dark' ? '#eee' : '#000'
        }}
      />

      {errorMsg && <p className="register-error">{errorMsg}</p>}

      <button type="submit" style={buttonStyle}>Register</button>
    </form>
  );
}

export default Register;
