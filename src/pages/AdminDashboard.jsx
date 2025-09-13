import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../ThemeContext';
import { buttonStyle } from '../styles/buttonStyles';
import './AdminDashboard.css';

const AdminDashboard = ({ onBack }) => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get('/api/admin/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const updateRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await axios.post(`/api/users/${id}/role`, { role: newRole });
      fetchUsers(); // Refresh list
    } catch (err) {
      alert('Role update failed');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSummary();
  }, []);

  return (
    <div
      style={{
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
        color: theme === 'dark' ? '#eee' : '#000',
        padding: '20px',
        borderRadius: '8px'
      }}
    >
      <h2>🔒 Admin Dashboard</h2>

      {summary && (
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Total Projects:</strong> {summary.totalProjects}</p>
          <p><strong>Total Files:</strong> {summary.totalFiles}</p>
          <p><strong>Most Active Users:</strong></p>
{summary.mostActiveUsers && summary.mostActiveUsers.length > 0 ? (
  <ul>
    {summary.mostActiveUsers.map(user => (
      <li key={user.userId || user.id}>
        {user.username} — {user.fileCount || user.projectCount || 0} file(s)
      </li>
    ))}
  </ul>
) : (
  <p>No data available.</p>
)}

        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px' }}>Username</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Role</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td style={{ padding: '8px' }}>{user.username}</td>
              <td style={{ padding: '8px' }}>{user.email}</td>
              <td style={{ padding: '8px' }}>{user.role}</td>
              <td style={{ padding: '8px' }}>
                <button
                  onClick={() => updateRole(user.id, user.role)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: user.role === 'admin' ? '#dc3545' : '#28a745',
                    color: 'white'
                  }}
                >
                  {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={onBack} style={{ ...buttonStyle, marginTop: '20px' }}>← Back</button>
    </div>
  );
};

export default AdminDashboard;
