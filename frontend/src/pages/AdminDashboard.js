import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    fetchUsers();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const theme = darkMode ? darkTheme : lightTheme;

  if (loading) {
    return (
      <div style={{ ...styles.loadingContainer, backgroundColor: theme.background }}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, backgroundColor: theme.background }}>
      <nav style={{ ...styles.navbar, backgroundColor: theme.navbarBg, borderBottom: `1px solid ${theme.border}` }}>
        <div style={styles.navbarContent}>
          <div style={styles.navbarLeft}>
            <h1 style={{ ...styles.logo, color: theme.text }}>🛡️ Panel de Administrador</h1>
          </div>
          <div style={styles.navbarRight}>
            <button onClick={toggleTheme} style={{ ...styles.themeBtn, backgroundColor: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}` }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <span style={{ ...styles.username, color: theme.textMuted }}>👤 {username}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
          </div>
        </div>
      </nav>

      <div style={styles.contentContainer}>
        <div style={{ ...styles.card, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
          <div style={styles.cardHeaderGradient}>
            <h2 style={styles.cardHeaderTitle}>Usuarios Registrados en el Sistema</h2>
            <span style={styles.categoryBadge}>Total: {users.length}</span>
          </div>
          
          <div style={{ overflowX: 'auto', padding: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.textMuted }}>
                  <th style={{ padding: '12px 15px', fontWeight: '600' }}>Usuario</th>
                  <th style={{ padding: '12px 15px', fontWeight: '600' }}>Rol</th>
                  <th style={{ padding: '12px 15px', fontWeight: '600', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody style={{ color: theme.text }}>
                {users.map((user) => (
                  <tr key={user.id || user._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '15px', fontWeight: '500' }}>{user.username}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        ...styles.roleBadge, 
                        ...(user.rol === 'admin' ? styles.roleAdmin : styles.roleUser) 
                      }}>
                        {user.rol === 'admin' ? '🛡️ Admin' : '👤 Usuario'}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button 
                        style={{ ...styles.actionBtnDelete, opacity: user.rol === 'admin' ? 0.5 : 1, cursor: user.rol === 'admin' ? 'not-allowed' : 'pointer' }}
                        disabled={user.rol === 'admin'}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mismos temas que en Dashboard.js
const lightTheme = { background: '#F7E7FA', text: '#2D2D2D', textMuted: '#7A7A85', navbarBg: '#FFFFFF', cardBg: '#FFFFFF', inputBg: '#FFFFFF', border: '#e8d9eb' };
const darkTheme = { background: '#1a1a1a', text: '#FFFFFF', textMuted: '#9a9a9a', navbarBg: '#2D2D2D', cardBg: '#2D2D2D', inputBg: '#3a3a3a', border: '#4a4a4a' };

const styles = {
  container: { minHeight: '100vh', paddingBottom: '40px', transition: 'background-color 0.3s ease' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
  spinner: { width: '50px', height: '50px', border: '4px solid #e8d9eb', borderTop: '4px solid #8C7AE6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  navbar: { padding: '15px 0', marginBottom: '30px', transition: 'all 0.3s ease' },
  navbarContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navbarLeft: {},
  logo: { margin: 0, fontSize: '24px', fontWeight: '700' },
  navbarRight: { display: 'flex', gap: '15px', alignItems: 'center' },
  themeBtn: { width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' },
  username: { fontSize: '15px', fontWeight: '500' },
  logoutBtn: { padding: '8px 20px', background: '#C7C8F4', color: '#2D2D2D', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.3s ease' },
  contentContainer: { maxWidth: '1000px', margin: '0 auto', padding: '0 20px' },
  card: { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(140, 122, 230, 0.1)', transition: 'all 0.3s ease' },
  cardHeaderGradient: { background: 'linear-gradient(135deg, #8C7AE6 0%, #C7C8F4 100%)', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderTitle: { margin: 0, color: 'white', fontSize: '20px', fontWeight: '600' },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.25)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', backdropFilter: 'blur(10px)' },
  roleBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  roleAdmin: { backgroundColor: '#8C7AE6', color: 'white' },
  roleUser: { backgroundColor: '#C7C8F4', color: '#2D2D2D' },
  actionBtnDelete: { padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', transition: 'all 0.3s ease', boxShadow: '0 2px 6px rgba(231, 76, 60, 0.3)' }
};

export default AdminDashboard;