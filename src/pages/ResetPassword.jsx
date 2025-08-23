import React, { useState } from 'react';
import axios from 'axios';

const ResetPassword = ({ token, onBack }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');

    if (password !== confirm) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/reset-password', { token, password }, { withCredentials: true });
      setMessage(res.data.message);
      setTimeout(() => onBack(), 2000); // Return to login after success
    } catch (err) {
      setMessage(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Reset Password</h2>
      <form onSubmit={handleReset} style={styles.form}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Reset Password</button>
      </form>
      {message && <p style={styles.message}>{message}</p>}
      <button onClick={onBack} style={styles.backButton}>Back to Login</button>
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
    background: '#28a745',
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
    color: 'red'
  }
};

export default ResetPassword;
