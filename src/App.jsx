import { useEffect, useState } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import Editor from './pages/Editor';
import Profile from './pages/Profile';
import CollabRoom from './pages/CollabRoom';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import { useTheme } from './ThemeContext';
import './theme.css';

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE_URL = isLocal
  ? "http://localhost:5000"
  : "https://editor-server-te21.onrender.com";

axios.defaults.baseURL = BASE_URL;
axios.defaults.withCredentials = true;

function Home({ onLogin, onRegister, onViewDemo }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 50%, #fbc2eb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '650px',
          width: '100%',
          textAlign: 'center',
          color: '#fff',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        }}
      >
        <h1
          style={{
            fontSize: '2.8rem',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#fff',
          }}
        >
          🚀 Code, Test & Deploy Effortlessly
        </h1>

        <p
          style={{
            fontSize: '1.1rem',
            lineHeight: '1.6',
            marginBottom: '30px',
            color: '#f0f0f0',
          }}
        >
          An elegant cloud-based code editor with real-time collaboration, project
          management, and instant deployment.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={onRegister}
            style={{
              background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
              border: 'none',
              padding: '12px 24px',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'transform 0.2s ease',
            }}
            onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Get Started Free
          </button>

          <button
            onClick={onViewDemo}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              padding: '12px 24px',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'transform 0.2s ease',
            }}
            onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
          >
            View Demo
          </button>
        </div>

        <div style={{ marginTop: '40px' }}>
          <button
            onClick={onLogin}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              textDecoration: 'underline',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState('loading');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/reset-password/')) {
      const token = path.split('/reset-password/')[1];
      setView(`reset:${token}`);
      return;
    }

    axios
      .get('/api/check-auth')
      .then((res) => {
        setIsAuthenticated(true);
        setUserRole(res.data.user.role);
        setView('editor'); // ✅ always go to editor, even if admin
      })
      .catch(() => {
        setIsAuthenticated(false);
        setView('home');
      });
  }, []);

  const handleLogout = () => {
    axios.post('/api/logout').then(() => {
      setIsAuthenticated(false);
      setUserRole(null);
      setView('home');
      setShowDropdown(false);
    });
  };

  const navButtonStyle = {
    marginRight: '10px',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: theme === 'dark' ? '#444' : '#ddd',
    color: theme === 'dark' ? '#eee' : '#000',
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: '20px' }}>
      <nav
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <button onClick={toggleTheme} style={navButtonStyle}>
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>

          {!isAuthenticated && (
            <>
              <button onClick={() => setView('login')} style={navButtonStyle}>
                Login
              </button>
              <button
                onClick={() => setView('register')}
                style={navButtonStyle}
              >
                Register
              </button>
            </>
          )}

          {isAuthenticated && (
            <>
              {/* ✅ Show admin button only if user is admin */}
              {userRole === 'admin' && (
                <button onClick={() => setView('admin')} style={navButtonStyle}>
                  Admin Dashboard
                </button>
              )}
              <button onClick={() => setView('editor')} style={navButtonStyle}>
                Editor
              </button>
              <button onClick={() => setView('collab')} style={navButtonStyle}>
                Collaborative Room
              </button>
            </>
          )}
        </div>

        {isAuthenticated && (
          <div style={{ position: 'relative' }}>
            <img
              src="https://i.pravatar.cc/32"
              alt="Profile"
              onClick={() => setShowDropdown((prev) => !prev)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            />

            {showDropdown && (
              <div className="profile-dropdown">
                <button
                  onClick={() => {
                    setView('profile');
                    setShowDropdown(false);
                  }}
                >
                  View Profile
                </button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* PAGES */}
      {view === 'home' && (
        <Home
          onLogin={() => setView('login')}
          onRegister={() => setView('register')}
          onViewDemo={() => alert('Demo page coming soon!')}
        />
      )}
      {view === 'login' && (
        <Login
          onLoginSuccess={(user) => {
            setIsAuthenticated(true);
            setUserRole(user.role);
            setView('editor'); // ✅ always go to editor
          }}
          onForgotPassword={() => setView('forgot')}
        />
      )}
      {view === 'register' && (
        <Register onRegisterSuccess={() => setView('login')} />
      )}
      {view === 'editor' && isAuthenticated && <Editor />}
      {view === 'profile' && isAuthenticated && <Profile />}
      {view === 'collab' && isAuthenticated && <CollabRoom />}
      {view === 'admin' && userRole === 'admin' && (
        <AdminDashboard onBack={() => setView('profile')} />
      )}
      {view === 'editor' && !isAuthenticated && <p>You must be logged in</p>}
      {view === 'forgot' && <ForgotPassword onBack={() => setView('login')} />}
      {view.startsWith('reset:') && (
        <ResetPassword token={view.split(':')[1]} onBack={() => setView('login')} />
      )}
    </div>
  );
}

export default App;
