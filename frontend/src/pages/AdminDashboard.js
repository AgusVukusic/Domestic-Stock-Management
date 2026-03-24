import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Estados para el Modal de Detalles
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Estados para el Modal de Eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const navigate = useNavigate();

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

  const handleViewDetails = async (user) => {
    setSelectedUser(user.username);
    setShowModal(true);
    setLoadingDetails(true);
    try {
      const response = await api.get(`/admin/users/${user.username}/details`);
      setUserDetails(response.data);
    } catch (error) {
      toast.error('Error al cargar los detalles del usuario');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    const toastId = toast.loading('Eliminando usuario...');
    try {
      await api.delete(`/admin/users/${userToDelete.id || userToDelete._id}`);
      toast.success('Usuario eliminado exitosamente', { id: toastId });
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers(); 
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al eliminar el usuario', { id: toastId });
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
      <nav style={{ ...styles.navbar, backgroundColor: theme.cardBg, borderBottom: `1px solid ${theme.border}` }}>
        <div style={styles.navbarContent}>
          <div style={styles.navbarLeft}>
            <h1 style={styles.logo}>StockApp</h1>
          </div>
          <div style={styles.navbarRight}>
            <button onClick={toggleTheme} style={{ ...styles.themeBtn, color: theme.text }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} style={styles.logoutBtn}>Salir</button>
          </div>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.headerSection}>
          <div>
            <h2 style={{ ...styles.pageTitle, color: theme.text }}>Panel Admin</h2>
            <p style={{ color: theme.textMuted, marginTop: '5px' }}>Gestión de usuarios del sistema.</p>
          </div>
          <div style={styles.badge}>Total: {users.length} usuarios</div>
        </div>

        <div style={styles.userList}>
          {users.map((user) => (
            <div key={user.id || user._id} style={{ ...styles.userCard, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
              <div style={styles.userInfo}>
                <h3 style={{ ...styles.userName, color: theme.text }}>
                  <span style={{ marginRight: '8px' }}>👤</span>{user.username}
                </h3>
                <span style={{ 
                  ...styles.roleBadge, 
                  ...(user.rol === 'admin' ? styles.roleAdmin : styles.roleUser) 
                }}>
                  {user.rol === 'admin' ? '🛡️ Admin' : 'Usuario'}
                </span>
              </div>
              
              <div style={styles.userActions}>
                <button 
                  onClick={() => handleViewDetails(user)}
                  style={styles.actionBtnView}
                >
                  👁️ Detalles
                </button>
                <button 
                  onClick={() => handleDeleteClick(user)}
                  style={{ ...styles.actionBtnDelete, opacity: user.rol === 'admin' ? 0.5 : 1, cursor: user.rol === 'admin' ? 'not-allowed' : 'pointer' }}
                  disabled={user.rol === 'admin'}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalles del Usuario */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, backgroundColor: '#8b5cf6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📋</span>
                <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: '600' }}>Detalles: {selectedUser}</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            
            <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '20px', color: theme.text }}>Cargando información... ⏳</div>
              ) : userDetails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: theme.textMuted }}>
                  <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🤷‍♂️</span>
                  Este usuario no pertenece a ningún grupo familiar todavía.
                </div>
              ) : (
                userDetails.map((group) => (
                  <div key={group.group_id} style={{ ...styles.groupCard, backgroundColor: theme.inputBg, border: `1px solid ${theme.border}` }}>
                    <h3 style={{ margin: '0 0 12px 0', color: theme.text, fontSize: '16px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>👥</span> Grupo: {group.group_name}
                    </h3>
                    
                    {group.products.length === 0 ? (
                      <p style={{ margin: 0, color: theme.textMuted, fontSize: '14px', fontStyle: 'italic' }}>Inventario vacío.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {group.products.map((prod, index) => (
                          <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                            <span style={{ color: theme.text, fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '10px' }}>
                              📦 {prod.nombre}
                            </span>
                            <span style={{ color: theme.textMuted, fontWeight: '600', backgroundColor: theme.cardBg, padding: '4px 8px', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                              Stock: {prod.cantidad}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, background: '#e74c3c' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: '600' }}>Confirmar Eliminación</h2>
              </div>
              <button onClick={() => setShowDeleteConfirm(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: theme.text, fontSize: '1.05rem', marginBottom: '8px', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas eliminar a <strong>{userToDelete?.username}</strong>?
              </p>
              <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginBottom: '24px' }}>
                Esta acción no se puede deshacer y el usuario perderá su acceso.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  style={{ ...styles.cancelBtn, color: theme.text, border: `1px solid ${theme.border}` }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete} 
                  style={styles.confirmDeleteBtn}
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lightTheme = { background: '#F7E7FA', text: '#2D2D2D', textMuted: '#7A7A85', navbarBg: '#FFFFFF', cardBg: '#FFFFFF', inputBg: '#f8f9fa', border: '#e8d9eb' };
const darkTheme = { background: '#1a1a1a', text: '#FFFFFF', textMuted: '#9a9a9a', navbarBg: '#2D2D2D', cardBg: '#2D2D2D', inputBg: '#3a3a3a', border: '#4a4a4a' };

const styles = {
  container: { minHeight: '100vh', paddingBottom: '40px', transition: 'background-color 0.3s ease' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
  spinner: { width: '50px', height: '50px', border: '4px solid #e8d9eb', borderTop: '4px solid #8C7AE6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  
  // Navbar unificada con safe-area-inset, sin botón de volver
  navbar: { padding: 'calc(15px + env(safe-area-inset-top)) 0 15px 0', marginBottom: '15px', position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s ease' },
  navbarContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navbarLeft: { display: 'flex', alignItems: 'center' },
  logo: { margin: 0, fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navbarRight: { display: 'flex', gap: '8px', alignItems: 'center' },
  themeBtn: { width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', background: 'transparent', border: 'none' },
  logoutBtn: { padding: '8px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.3s ease' },
  
  // Contenido Principal
  content: { maxWidth: '1000px', margin: '0 auto', padding: '10px 15px' },
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  pageTitle: { margin: 0, fontSize: '24px', fontWeight: '700' },
  badge: { backgroundColor: '#8C7AE6', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', boxShadow: '0 2px 8px rgba(140, 122, 230, 0.3)' },
  
  // Lista de Usuarios
  userList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
  userCard: { borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  userInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  userName: { margin: 0, fontSize: '18px', fontWeight: '600' },
  roleBadge: { padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' },
  roleAdmin: { backgroundColor: '#8C7AE6', color: 'white' },
  roleUser: { backgroundColor: '#F7E7FA', color: '#8C7AE6' },
  
  userActions: { display: 'flex', gap: '10px' },
  actionBtnView: { flex: 1, padding: '10px', background: 'transparent', color: '#8C7AE6', border: '2px solid #8C7AE6', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  actionBtnDelete: { flex: 1, padding: '10px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },

  // Modales
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { borderRadius: '16px', width: '90%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalHeader: { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  groupCard: { padding: '15px', borderRadius: '12px', marginBottom: '15px' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', background: 'transparent' },
  confirmDeleteBtn: { flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', background: '#e74c3c', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)' }
};

export default AdminDashboard;