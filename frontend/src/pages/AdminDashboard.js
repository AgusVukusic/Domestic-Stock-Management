import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LogOut, Sun, Moon, Shield, X, Users, ClipboardList, Trash2, Eye } from 'lucide-react';
import './AdminDashboard.css';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            <h1 className="logo gradient-text">
              <Shield size={28} color="#8C7AE6" /> StockApp Admin
            </h1>
          </div>
          <div className="navbar-right">
            <button onClick={toggleTheme} className="theme-btn">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleLogoutClick} className="logout-btn">
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="content-wrapper animate-fade-in" style={{ maxWidth: '1000px' }}>
        <div className="admin-header-section">
          <div>
            <h2 className="admin-page-title">Panel Admin</h2>
            <p className="admin-subtitle">Gestión de usuarios del sistema.</p>
          </div>
          <div className="admin-badge-total">Total: {users.length} usuarios</div>
        </div>

        <div className="user-list">
          {users.map((user) => (
            <div key={user.id || user._id} className="card card-hover user-card">
              <div className="user-info">
                <h3 className="user-name">
                  <Users size={18} /> {user.username}
                </h3>
                <span className={`role-badge ${user.rol === 'admin' ? 'role-admin' : 'role-user'}`}>
                  {user.rol === 'admin' ? '🛡️ Admin' : 'Usuario'}
                </span>
              </div>
              
              <div className="user-actions">
                <button 
                  onClick={() => handleViewDetails(user)}
                  className="btn-outline"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Eye size={16} /> Detalles
                </button>
                <button 
                  onClick={() => handleDeleteClick(user)}
                  className="btn btn-danger"
                  style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                  disabled={user.rol === 'admin'}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><ClipboardList size={24} /> Detalles: {selectedUser}</h2>
              <button onClick={() => setShowModal(false)} className="modal-close"><X size={24} /></button>
            </div>
            
            <div className="modal-body">
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Cargando información... ⏳</div>
              ) : userDetails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🤷‍♂️</span>
                  Este usuario no pertenece a ningún grupo familiar todavía.
                </div>
              ) : (
                userDetails.map((group) => (
                  <div key={group.group_id} className="group-details-card">
                    <h3 className="group-details-header">
                      <Users size={18} /> Grupo: {group.group_name}
                    </h3>
                    
                    {group.products.length === 0 ? (
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>Inventario vacío.</p>
                    ) : (
                      <ul className="group-details-list">
                        {group.products.map((prod, index) => (
                          <li key={index} className="group-details-item">
                            <span className="group-details-item-name">
                              📦 {prod.nombre}
                            </span>
                            <span className="group-details-item-stock">
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

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'var(--danger)' }}>
              <h2>⚠️ Confirmar Eliminación</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="modal-close"><X size={24} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.05rem', marginBottom: '8px', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas eliminar a <strong>{userToDelete?.username}</strong>?
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Esta acción no se puede deshacer y el usuario perderá su acceso.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={confirmDelete} className="btn btn-danger" style={{ flex: 1 }}>Sí, Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cierre de Sesión */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'var(--danger)' }}>
              <h2>🚪 Cerrar Sesión</h2>
              <button onClick={() => setShowLogoutConfirm(false)} className="modal-close"><X size={24} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.05rem', margin: '10px 0 20px' }}>¿Estás seguro de que deseas cerrar la sesión?</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowLogoutConfirm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={confirmLogout} className="btn btn-danger" style={{ flex: 1 }}>Sí, Salir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;