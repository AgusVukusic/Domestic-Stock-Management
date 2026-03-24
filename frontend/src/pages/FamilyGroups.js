import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import toast from 'react-hot-toast';

function FamilyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [newMemberUsername, setNewMemberUsername] = useState('');

  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    loadGroups();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const loadGroups = async () => {
    try {
      const response = await groupsAPI.getAll();
      setGroups(response.data);
    } catch (error) {
      console.error('Error cargando grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupsAPI.create(newGroupName);
      setNewGroupName('');
      setShowCreateModal(false);
      loadGroups();
    } catch (error) {
      toast.error('Error al crear el grupo');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await groupsAPI.addMember(selectedGroupId, newMemberUsername);
      setNewMemberUsername('');
      setShowAddMemberModal(false);
      loadGroups();
      toast.success('¡Miembro agregado correctamente!');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error al agregar miembro';
      toast.error(errorMsg);
    }
  };

  const openAddMemberModal = (groupId) => {
    setSelectedGroupId(groupId);
    setShowAddMemberModal(true);
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
            <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver
            </button>
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
            <h2 style={{ ...styles.pageTitle, color: theme.text }}>Tus Grupos</h2>
            <p style={{ color: theme.textMuted, marginTop: '5px' }}>Gestiona los inventarios compartidos.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} style={styles.primaryActionBtn}>
            ➕ Nuevo Grupo
          </button>
        </div>

        <div style={styles.grid}>
          {groups.length === 0 ? (
            <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, gridColumn: '1 / -1', border: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: '60px', display: 'block', marginBottom: '15px' }}>🏠</span>
              <h3 style={{ color: theme.text, fontSize: '1.5rem', marginBottom: '10px' }}>No tienes grupos todavía</h3>
              <p style={{ color: theme.textMuted, fontSize: '1.1rem' }}>Crea un grupo para compartir tu inventario.</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group._id} style={{ ...styles.groupCard, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
                <div style={styles.cardHeaderGradient}>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '20px' }}>{group.nombre}</h3>
                  <span style={styles.badge}>{group.members.length} miembros</span>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginBottom: '15px', fontWeight: 'bold' }}>MIEMBROS:</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {group.members_detail && group.members_detail.map((member, index) => (
                      <li key={index} style={{ color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ backgroundColor: theme.inputBg, padding: '4px 8px', borderRadius: '6px', fontSize: '14px', border: `1px solid ${theme.border}` }}>
                          👤 {member.username === username ? `Tú (${member.username})` : member.username}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: '0 20px 20px' }}>
                  <button 
                    onClick={() => openAddMemberModal(group._id)}
                    style={{ ...styles.addMemberBtn, backgroundColor: theme.inputBg, color: theme.text, border: `2px dashed ${theme.border}` }}
                  >
                    ➕ Invitar Usuario
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>
        {`
          .custom-input { width: 100%; padding: 12px 16px; border-radius: 8px; border-width: 1px; border-style: solid; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
          .custom-input:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2); }
        `}
      </style>

      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, backgroundColor: '#8b5cf6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🏠</span>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Crear Grupo Familiar</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleCreateGroup} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: theme.text, fontWeight: '500' }}>Nombre del Grupo</label>
                <input type="text" className="custom-input" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} placeholder="Ej: Familia Pérez" />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ ...styles.cancelBtn, color: theme.text, border: `1px solid ${theme.border}` }}>Cancelar</button>
                <button type="submit" style={styles.submitBtn}>Crear Grupo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMemberModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddMemberModal(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, backgroundColor: '#8b5cf6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>✉️</span>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Invitar Miembro</h2>
              </div>
              <button onClick={() => setShowAddMemberModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleAddMember} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: theme.text, fontWeight: '500' }}>Nombre de Usuario</label>
                <input type="text" className="custom-input" value={newMemberUsername} onChange={(e) => setNewMemberUsername(e.target.value)} required style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} placeholder="Ingresa el username exacto..." />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowAddMemberModal(false)} style={{ ...styles.cancelBtn, color: theme.text, border: `1px solid ${theme.border}` }}>Cancelar</button>
                <button type="submit" style={styles.submitBtn}>Agregar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const lightTheme = { background: '#F7E7FA', text: '#2D2D2D', textMuted: '#7A7A85', navbarBg: '#FFFFFF', cardBg: '#FFFFFF', inputBg: '#FFFFFF', border: '#e8d9eb' };
const darkTheme = { background: '#1a1a1a', text: '#FFFFFF', textMuted: '#9a9a9a', navbarBg: '#2D2D2D', cardBg: '#2D2D2D', inputBg: '#3a3a3a', border: '#4a4a4a' };

const styles = {
  container: { minHeight: '100vh', transition: 'background-color 0.3s' },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  spinner: { width: '50px', height: '50px', border: '4px solid #e8d9eb', borderTop: '4px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  navbar: { padding: 'calc(15px + env(safe-area-inset-top)) 0 15px 0', marginBottom: '15px', position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s ease' },
  navbarContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navbarLeft: { display: 'flex', alignItems: 'center' },
  backBtn: { background: 'transparent', border: '2px solid #8C7AE6', color: '#8C7AE6', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '15px', transition: 'all 0.2s ease' },
  logo: { margin: 0, fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navbarRight: { display: 'flex', gap: '8px', alignItems: 'center' },
  themeBtn: { width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', background: 'transparent', border: 'none' },
  logoutBtn: { padding: '8px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.3s ease' },
  content: { maxWidth: '1200px', margin: '0 auto', padding: '20px 15px 40px' },
  headerSection: { display: 'flex', flexDirection: 'column', marginBottom: '25px', gap: '15px' },
  pageTitle: { margin: 0, fontSize: '24px', fontWeight: '700' },
  primaryActionBtn: { padding: '12px 28px', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' },
  groupCard: { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' },
  cardHeaderGradient: { background: 'linear-gradient(135deg, #8C7AE6 0%, #C7C8F4 100%)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: 'rgba(255,255,255,0.25)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', backdropFilter: 'blur(10px)' },
  addMemberBtn: { width: '100%', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' },
  emptyState: { padding: '60px 20px', textAlign: 'center', borderRadius: '16px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { width: '90%', maxWidth: '450px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalHeader: { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' },
  modalActions: { display: 'flex', gap: '12px', borderTop: '1px solid #e8d9eb', paddingTop: '16px' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', fontWeight: '600' },
  submitBtn: { flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: '#8b5cf6', color: 'white', border: 'none', fontWeight: '600' }
};

export default FamilyGroups;