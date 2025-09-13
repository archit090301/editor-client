import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../ThemeContext';

function VerifyEmail({ onBackToLogin }) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('Verifying...');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setMessage('Invalid or missing token.');
      return;
    }

    axios.get(`/api/verify-email?token=${token}`)
      .then(res => {
        setMessage(res.data.message);
        setSuccess(true);
      })
      .catch(err => {
        setMessage(err.response?.data?.message || 'Verification failed');
        setSuccess(false);
      });
  }, []);

  return (
    <div
      style={{
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
        color: theme === 'dark' ? '#eee' : '#000',
        padding: '40px',
        textAlign: 'center',
        borderRadius: '8px',
        maxWidth: '500px',
        margin: '80px auto',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.08)'
      }}
    >
      <h2>🔐 Email Verification</h2>
      <p>{message}</p>
      {success && (
        <button
          onClick={onBackToLogin}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      )}
    </div>
  );
}

export default VerifyEmail;
