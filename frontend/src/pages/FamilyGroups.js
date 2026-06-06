import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Users, User, UserPlus, Mail, X, Home } from 'lucide-react';
import './FamilyGroups.css';

function FamilyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    loadGroups();
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



  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    const toastId = toast.loading('Creando grupo...');

    try {
      await groupsAPI.create(newGroupName);
      setNewGroupName('');
      setShowCreateModal(false);
      loadGroups();
      toast.success('¡Grupo creado exitosamente!', { id: toastId });
    } catch (error) {
      toast.error('Error al crear el grupo', { id: toastId });
    } finally {
      setIsCreating(false);
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



  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-slide-up">

      <div className="content-wrapper animate-fade-in" style={{ maxWidth: '1200px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '25px', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Tus Grupos</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>Gestiona los inventarios compartidos.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            <Plus size={18} strokeWidth={2.5} /> Nuevo Grupo
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
          {groups.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
              <span style={{ display: 'block', marginBottom: '15px', color: 'var(--text-secondary)' }}>
                <Home size={60} strokeWidth={1.5} />
              </span>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>No tienes grupos todavía</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Crea un grupo para compartir tu inventario.</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group._id} className="card card-hover group-card" style={{ padding: 0 }}>
                <div className="group-header-gradient">
                  <h3 style={{ margin: 0, color: 'white', fontSize: '20px' }}>{group.nombre}</h3>
                  <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }}>
                    {group.members.length} miembros
                  </span>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px', fontWeight: 'bold' }}>MIEMBROS:</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {group.members_detail && group.members_detail.map((member, index) => (
                      <li key={index} style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="group-member-item">
                          <User size={14} /> {member.username === username ? `Tú (${member.username})` : member.username}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: '0 20px 20px' }}>
                  <button onClick={() => openAddMemberModal(group._id)} className="add-member-btn">
                    <UserPlus size={16} /> Invitar Usuario
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Users size={24} /> Crear Grupo Familiar</h2>
              <button onClick={() => setShowCreateModal(false)} className="modal-close"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateGroup} className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre del Grupo</label>
                <input type="text" className="form-input" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required placeholder="Ej: Familia Pérez" />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={isCreating} className="btn btn-primary">
                  {isCreating ? 'Creando...' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Mail size={24} /> Invitar Miembro</h2>
              <button onClick={() => setShowAddMemberModal(false)} className="modal-close"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddMember} className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre de Usuario</label>
                <input type="text" className="form-input" value={newMemberUsername} onChange={(e) => setNewMemberUsername(e.target.value)} required placeholder="Ingresa el username exacto..." />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Agregar</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}

export default FamilyGroups;