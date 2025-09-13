import { useEffect, useState } from 'react';
import axios from 'axios';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/profile')
      .then((res) => setUser(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load profile');
      });
  }, []);

  if (error) {
    return <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>;
  }

  if (!user) return <p style={{ textAlign: 'center' }}>Loading...</p>;

  return (
    <div className="profile-container">
      <h2>👤 User Profile</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
    </div>
  );
}

export default Profile;
