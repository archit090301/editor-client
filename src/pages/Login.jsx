import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../ThemeContext';
import { buttonStyle } from '../styles/buttonStyles';
import './Login.css';

function Login({ onLoginSuccess, onForgotPassword }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Persisted user state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('workspace_user');
    if (storedUser) {
      onLoginSuccess(JSON.parse(storedUser));
    }
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Toggle password visibility
  const togglePassword = () => setShowPassword((prev) => !prev);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post(
        '/api/login',
        formData,
        { withCredentials: true } // ensures cookie is stored
      );

      const user = res.data.user;

      // ✅ Store user in localStorage for UI persistence
      localStorage.setItem('workspace_user', JSON.stringify(user));

      // Update app state
      onLoginSuccess(user);
    } catch (err) {
      if (err.response) {
        setErrorMsg(err.response.data.message || 'Login failed.');
      } else if (err.request) {
        setErrorMsg('No response from server. Please try again later.');
      } else {
        setErrorMsg('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={`login-form ${theme}`}
      onSubmit={handleLogin}
      aria-busy={loading}
    >
      <h2 className="login-title">🔐 Login</h2>

      <label htmlFor="email" className="login-label">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter your email"
        required
        className="login-input"
      />

      <label htmlFor="password" className="login-label">Password</label>
      <div className="password-wrapper">
        <input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
          className="login-input"
        />
        <button
          type="button"
          className="show-password-btn"
          onClick={togglePassword}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      {errorMsg && <p className="login-error">{errorMsg}</p>}

      <button
        type="submit"
        className="login-button"
        style={buttonStyle}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <button
        type="button"
        onClick={onForgotPassword}
        className="forgot-password-button"
      >
        Forgot Password?
      </button>
    </form>
  );
}

export default Login;
