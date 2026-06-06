import React from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const TopBar = ({ darkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (['/login', '/register', '/'].includes(location.pathname)) return null;

  const handleLogout = () => {
    if (window.confirm('¿Seguro que deseas cerrar sesión?')) {
      localStorage.clear();
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
      navigate('/login');
    }
  };

  return (
    <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px', zIndex: 1000 }}>
      <button 
        onClick={toggleTheme} 
        style={{ 
          width: '40px', height: '40px', border: '1px solid var(--border-color)', 
          background: 'var(--card-bg)', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', 
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-primary)'
        }}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button 
        onClick={handleLogout} 
        style={{ 
          width: '40px', height: '40px', border: 'none', 
          background: 'var(--danger-light)', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', 
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: 'var(--danger)' 
        }}
      >
        <LogOut size={20} />
      </button>
    </div>
  );
};

export default TopBar;
