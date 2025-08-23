import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setResetLink('');

    try {
      const res = await axios.post('http://localhost:5000/api/request-password-reset', { email }, { withCredentials: true });
      setMessage(res.data.message);
      setResetLink(res.data.resetLink);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Send Reset Link</button>
      </form>
      {message && <p style={styles.message}>{message}</p>}
      {resetLink && (
        <p style={styles.link}>
          <strong>Reset link:</strong>{' '}
          <a href={resetLink} target="_blank" rel="noopener noreferrer">{resetLink}</a>
        </p>
      )}
      <button onClick={onBack} style={styles.backButton}>
        Back to Login
      </button>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 400,
    margin: '80px auto',
    padding: 30,
    border: '1px solid #ccc',
    borderRadius: 10,
    background: '#f9f9f9',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 15
  },
  input: {
    padding: 10,
    fontSize: 16
  },
  button: {
    padding: 10,
    fontSize: 16,
    background: '#007bff',
    color: '#fff',
    border: 'none',
    cursor: 'pointer'
  },
  backButton: {
    marginTop: 20,
    background: '#ccc',
    padding: 10,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer'
  },
  message: {
    marginTop: 15,
    color: 'green'
  },
  link: {
    marginTop: 10,
    wordBreak: 'break-all'
  }
};

export default ForgotPassword;
