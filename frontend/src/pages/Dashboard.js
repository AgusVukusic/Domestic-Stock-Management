import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, groupsAPI } from '../services/api';
import toast from 'react-hot-toast';

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Estados de formularios
  const [formData, setFormData] = useState({ nombre: '', cantidad: 0, stock_min: 0, categoria: '', notas: '' });
  const [editingProduct, setEditingProduct] = useState(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [sortBy, setSortBy] = useState('name-asc'); // Por defecto de la A a la Z

  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const loadInitialData = async () => {
    try {
      const [groupsRes, productsRes] = await Promise.all([
        groupsAPI.getAll(),
        productsAPI.getAll()
      ]);
      setGroups(groupsRes.data);
      setProducts(productsRes.data);
      
      if (groupsRes.data.length > 0) {
        setActiveGroup(groupsRes.data[0]._id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    navigate('/login');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!activeGroup) {
      toast.error('Selecciona un grupo primero');
      return;
    }
    
    try {
      await productsAPI.create({ ...formData, owner_id: activeGroup });
      const response = await productsAPI.getAll();
      setProducts(response.data);
      setFormData({ nombre: '', cantidad: 0, stock_min: 0, categoria: '', notas: '' });
      setShowCreateModal(false);
      toast.success('Producto creado exitosamente');
    } catch (error) {
      toast.error('Error al crear el producto');
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.update(editingProduct._id, editingProduct);
      const response = await productsAPI.getAll();
      setProducts(response.data);
      setShowEditModal(false);
      setEditingProduct(null);
      toast.success('Producto actualizado');
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await productsAPI.delete(id);
        const response = await productsAPI.getAll();
        setProducts(response.data);
        toast.success('Producto eliminado');
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  const handleIncrease = async (id) => {
    try {
      await productsAPI.increaseStock(id, 1);
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Error al sumar stock');
    }
  };

  const handleDecrease = async (id) => {
    try {
      await productsAPI.decreaseStock(id, 1);
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Error al restar stock');
    }
  };

  const activeGroupProducts = products.filter(p => p.owner_id === activeGroup);
  const groupCategories = [...new Set(activeGroupProducts.map(p => p.categoria))].sort();

  let displayedProducts = activeGroupProducts;

  if (activeCategory) {
    displayedProducts = displayedProducts.filter(p => p.categoria === activeCategory);
  }

  if (searchTerm) {
    displayedProducts = displayedProducts.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (sortBy === 'name-asc') displayedProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (sortBy === 'name-desc') displayedProducts.sort((a, b) => b.nombre.localeCompare(a.nombre));
  if (sortBy === 'stock-asc') displayedProducts.sort((a, b) => a.cantidad - b.cantidad);
  if (sortBy === 'stock-desc') displayedProducts.sort((a, b) => b.cantidad - a.cantidad);

  const theme = darkMode ? darkTheme : lightTheme;

  if (loading) {
    return (
      <div style={{ ...styles.loadingContainer, backgroundColor: theme.background }}>
        <div style={styles.spinner}></div>
        <p style={{ ...styles.loadingText, color: theme.text }}>Cargando inventario...</p>
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
            <button onClick={handleLogoutClick} style={styles.logoutBtn}>Salir</button>
          </div>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.headerSection}>
          <h2 style={{ ...styles.pageTitle, color: theme.text }}>Tu Inventario</h2>
          <button onClick={() => setShowCreateModal(true)} style={styles.primaryBtn}>
            + Nuevo Producto
          </button>
        </div>

        {groups.length === 0 ? (
          <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
            <h3 style={{ color: theme.text }}>¡Bienvenido!</h3>
            <p style={{ color: theme.textMuted }}>Para comenzar, necesitas crear o unirte a un grupo familiar.</p>
            <button onClick={() => navigate('/groups')} style={{ ...styles.primaryBtn, marginTop: '15px' }}>Ir a Grupos</button>
          </div>
        ) : (
          <>
            <div style={styles.filtersSection}>
              <div style={styles.filterRow}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: theme.textMuted, whiteSpace: 'nowrap' }}>Inventario de:</span>
                <select
                  value={activeGroup}
                  onChange={(e) => setActiveGroup(e.target.value)}
                  style={{ 
                    ...styles.filterSelect, flex: 1, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, margin: 0
                  }}
                >
                  {groups.map(g => (
                    <option key={g._id} value={g._id}>{g.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ ...styles.filterRow, marginTop: '10px' }}>
                <div style={styles.searchBox}>
                  <span style={styles.searchIcon}>🔍</span>
                  <input 
                    type="text" 
                    placeholder="Buscar producto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...styles.searchInput, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  />
                </div>
              </div>

              <div style={{ ...styles.filterRow, marginTop: '10px', display: 'flex', gap: '10px' }}>
                <select 
                  value={activeCategory} 
                  onChange={(e) => setActiveCategory(e.target.value)}
                  style={{ ...styles.filterSelect, flex: 1, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                >
                  <option value="">🏷️ Todas las categorías</option>
                  {groupCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ ...styles.filterSelect, flex: 1, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                >
                  <option value="name-asc">🔤 A-Z</option>
                  <option value="name-desc">🔠 Z-A</option>
                  <option value="stock-asc">📉 Stock (-)</option>
                  <option value="stock-desc">📈 Stock (+)</option>
                </select>
              </div>
            </div>

            {displayedProducts.length === 0 ? (
              <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '15px' }}>🤷‍♂️</span>
                <h3 style={{ color: theme.text, fontSize: '1.2rem', marginBottom: '8px' }}>No hay resultados</h3>
                <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginBottom: '20px' }}>Intenta ajustar tus filtros de búsqueda.</p>
                <button onClick={() => { setSearchTerm(''); setActiveCategory(''); setSortBy('name-asc'); }} style={styles.emptyBtn}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div style={styles.grid}>
                {displayedProducts.map((product) => (
                  <div key={product._id} style={{ ...styles.card, backgroundColor: theme.cardBg, border: `1px solid ${product.cantidad <= product.stock_min ? '#ffcdd2' : theme.border}` }}>
                    <div style={styles.cardHeader}>
                      <div style={styles.titleArea}>
                        <h3 style={{ ...styles.productName, color: theme.text }}>{product.nombre}</h3>
                        <span style={{ ...styles.categoryBadge, backgroundColor: theme.inputBg, color: theme.textMuted }}>{product.categoria}</span>
                      </div>
                      <div style={styles.actionMenu}>
                        <button onClick={() => handleEditClick(product)} style={{ ...styles.iconBtn, color: theme.textMuted }}>✏️</button>
                        <button onClick={() => handleDelete(product._id)} style={{ ...styles.iconBtn, color: '#e74c3c' }}>🗑️</button>
                      </div>
                    </div>

                    <div style={{ ...styles.stockStatus, backgroundColor: product.cantidad <= product.stock_min ? '#ffebee' : theme.inputBg, color: product.cantidad <= product.stock_min ? '#c62828' : theme.text }}>
                      {product.cantidad <= product.stock_min ? '⚠️ ¡Stock bajo!' : '✅ Stock saludable'}
                    </div>

                    <div style={styles.stockControls}>
                      <button onClick={() => handleDecrease(product._id)} style={{ ...styles.controlBtn, backgroundColor: theme.inputBg, color: theme.text }}>-</button>
                      <div style={styles.stockDisplay}>
                        <span style={{ ...styles.stockNumber, color: theme.text }}>{product.cantidad}</span>
                        <span style={{ ...styles.stockMin, color: theme.textMuted }}>/ min {product.stock_min}</span>
                      </div>
                      <button onClick={() => handleIncrease(product._id)} style={{ ...styles.controlBtn, backgroundColor: '#8b5cf6', color: 'white', border: 'none' }}>+</button>
                    </div>

                    {product.notas && (
                      <div style={{ ...styles.cardNotes, color: theme.textMuted, borderTop: `1px solid ${theme.border}` }}>
                        <span style={{ fontSize: '12px' }}>📝 {product.notas}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Menú Flotante Fijo (Bottom Navigation) */}
      <div style={{ ...styles.bottomNav, backgroundColor: theme.cardBg, borderTop: `1px solid ${theme.border}` }}>
        <button onClick={() => navigate('/dashboard')} style={{ ...styles.navItem, color: '#8b5cf6' }}>
          <span style={{ fontSize: '20px' }}>📦</span>
          <span style={styles.navText}>Inicio</span>
        </button>
        <button onClick={() => navigate('/shopping-list')} style={{ ...styles.navItem, color: theme.textMuted }}>
          <span style={{ fontSize: '20px' }}>🛒</span>
          <span style={styles.navText}>Compras</span>
        </button>
        <button onClick={() => navigate('/register-purchase')} style={{ ...styles.navItem, color: theme.textMuted }}>
          <span style={{ fontSize: '20px' }}>➕</span>
          <span style={styles.navText}>Sumar</span>
        </button>
        <button onClick={() => navigate('/groups')} style={{ ...styles.navItem, color: theme.textMuted }}>
          <span style={{ fontSize: '20px' }}>👥</span>
          <span style={styles.navText}>Grupos</span>
        </button>
      </div>

      {/* MODAL CREAR PRODUCTO */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg, padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', backgroundColor: '#8b5cf6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Nuevo Producto</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '24px' }}>
              <div style={{...styles.formGroup, marginBottom: '20px'}}>
                <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Nombre del producto</label>
                <input type="text" className="custom-input" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, boxSizing: 'border-box' }} placeholder="Ej: Jabón líquido" />
              </div>

              <div style={{ ...styles.formRow, display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{...styles.formGroup, flex: 1}}>
                    <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Cantidad</label>
                    <input type="number" className="custom-input" value={formData.cantidad} onFocus={(e) => e.target.select()} onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, boxSizing: 'border-box' }} placeholder="0" />
                </div>
                <div style={{...styles.formGroup, flex: 1}}>
                    <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Stock mínimo</label>
                    <input type="number" className="custom-input" value={formData.stock_min} onFocus={(e) => e.target.select()} onChange={(e) => setFormData({ ...formData, stock_min: parseInt(e.target.value) || 0 })} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, boxSizing: 'border-box' }} placeholder="0" />
                </div>
              </div>

              <div style={{...styles.formGroup, marginBottom: '20px'}}>
                <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Categoría</label>
                <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                  <input 
                    type="text" 
                    value={formData.categoria} 
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value.toLowerCase() })} 
                    required 
                    style={{ flex: 1, border: 'none', padding: '12px', fontSize: '1rem', backgroundColor: 'transparent', color: theme.text, outline: 'none', width: '100%' }} 
                    placeholder="Ej: limpieza, alimentos" 
                  />
                  <div style={{ width: '1px', backgroundColor: theme.border, margin: '6px 0' }}></div>
                  <select 
                    value="" 
                    onChange={(e) => {
                      if (e.target.value) setFormData({ ...formData, categoria: e.target.value });
                    }} 
                    style={{ width: '45px', border: 'none', backgroundColor: 'transparent', color: 'transparent', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238b5cf6%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '12px auto' }}
                  >
                    <option value="" disabled></option>
                    {groupCategories.map(cat => (
                      <option key={cat} value={cat} style={{ color: '#000' }}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{...styles.formGroup, marginBottom: '24px'}}>
                <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Notas (Opcional)</label>
                <textarea className="custom-input" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' }} placeholder="Ej: Comprar marca X" />
              </div>

              <div style={{ display: 'flex', gap: '12px', borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', fontWeight: '600', color: theme.text, border: `1px solid ${theme.border}` }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: '#8b5cf6', color: 'white', border: 'none', fontWeight: '600' }}>Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PRODUCTO */}
      {showEditModal && editingProduct && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg, padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', backgroundColor: '#8b5cf6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>✏️</span>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Editar Producto</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '24px' }}>
              <div style={{...styles.formGroup, marginBottom: '20px'}}>
                <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Nombre del producto</label>
                <input type="text" className="custom-input" value={editingProduct.nombre} onChange={(e) => setEditingProduct({ ...editingProduct, nombre: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, boxSizing: 'border-box' }} placeholder="Ej: Jabón líquido" />
              </div>

              <div style={{ ...styles.formRow, display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{...styles.formGroup, flex: 1}}>
                    <label style={{ ...styles.label, color: theme.textMuted, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Stock actual</label>
                    <input 
                      type="number" 
                      className="custom-input" 
                      value={editingProduct.cantidad} 
                      disabled 
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: theme.background, color: theme.textMuted, border: `1px solid ${theme.border}`, boxSizing: 'border-box', cursor: 'not-allowed', opacity: 0.7 }} 
                      title="El stock se modifica sumando o restando desde los botones"
                    />
                </div>
                <div style={{...styles.formGroup, flex: 1}}>
                    <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Stock mínimo</label>
                    <input type="number" className="custom-input" value={editingProduct.stock_min} onFocus={(e) => e.target.select()} onChange={(e) => setEditingProduct({ ...editingProduct, stock_min: parseInt(e.target.value) || 0 })} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, boxSizing: 'border-box' }} placeholder="0" />
                </div>
              </div>

              <div style={{...styles.formGroup, marginBottom: '20px'}}>
                <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Categoría</label>
                <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                  <input 
                    type="text" 
                    value={editingProduct.categoria} 
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoria: e.target.value.toLowerCase() })} 
                    required 
                    style={{ flex: 1, border: 'none', padding: '12px', fontSize: '1rem', backgroundColor: 'transparent', color: theme.text, outline: 'none', width: '100%' }} 
                    placeholder="Ej: limpieza, alimentos" 
                  />
                  <div style={{ width: '1px', backgroundColor: theme.border, margin: '6px 0' }}></div>
                  <select 
                    value="" 
                    onChange={(e) => {
                      if (e.target.value) setEditingProduct({ ...editingProduct, categoria: e.target.value });
                    }} 
                    style={{ width: '45px', border: 'none', backgroundColor: 'transparent', color: 'transparent', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238b5cf6%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '12px auto' }}
                  >
                    <option value="" disabled></option>
                    {groupCategories.map(cat => (
                      <option key={cat} value={cat} style={{ color: '#000' }}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{...styles.formGroup, marginBottom: '24px'}}>
                <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Notas (Opcional)</label>
                <textarea className="custom-input" value={editingProduct.notas} onChange={(e) => setEditingProduct({ ...editingProduct, notas: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' }} placeholder="Ej: Comprar marca X" />
              </div>

              <div style={{ display: 'flex', gap: '12px', borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', fontWeight: '600', color: theme.text, border: `1px solid ${theme.border}` }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: '#8b5cf6', color: 'white', border: 'none', fontWeight: '600' }}>Actualizar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cierre de Sesión */}
      {showLogoutConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, maxWidth: '400px', padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', background: '#e74c3c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🚪</span>
                <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: '600' }}>Cerrar Sesión</h2>
              </div>
              <button onClick={() => setShowLogoutConfirm(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: theme.text, fontSize: '1.05rem', marginBottom: '24px', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas cerrar la sesión?
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setShowLogoutConfirm(false)} 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', background: 'transparent', color: theme.text, border: `1px solid ${theme.border}` }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmLogout} 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', background: '#e74c3c', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)' }}
                >
                  Sí, Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lightTheme = { background: '#F7E7FA', text: '#2D2D2D', textMuted: '#7A7A85', navbarBg: '#FFFFFF', cardBg: '#FFFFFF', inputBg: '#FFFFFF', border: '#e8d9eb' };
const darkTheme = { background: '#1a1a1a', text: '#FFFFFF', textMuted: '#9a9a9a', navbarBg: '#2D2D2D', cardBg: '#2D2D2D', inputBg: '#3a3a3a', border: '#4a4a4a' };

const styles = {
  container: { minHeight: '100vh', paddingBottom: '80px', transition: 'background-color 0.3s ease' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
  spinner: { width: '50px', height: '50px', border: '4px solid #e8d9eb', borderTop: '4px solid #8C7AE6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '20px', fontSize: '18px', fontWeight: '500' },
  navbar: { padding: 'calc(15px + env(safe-area-inset-top)) 0 15px 0', marginBottom: '15px', position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s ease' },
  navbarContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navbarLeft: { display: 'flex', alignItems: 'center' },
  logo: { margin: 0, fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navbarRight: { display: 'flex', gap: '8px', alignItems: 'center' },
  themeBtn: { width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', background: 'transparent', border: 'none' },
  logoutBtn: { padding: '8px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.3s ease' },
  content: { maxWidth: '1200px', margin: '0 auto', padding: '10px 15px' },
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  pageTitle: { margin: 0, fontSize: '24px', fontWeight: '700' },
  primaryBtn: { padding: '10px 18px', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)' },
  filtersSection: { marginBottom: '25px', display: 'flex', flexDirection: 'column' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  filterSelect: { padding: '10px 12px', borderRadius: '10px', border: '2px solid', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  searchBox: { position: 'relative', flex: 1 },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' },
  searchInput: { width: '100%', padding: '10px 12px 10px 35px', borderRadius: '10px', border: '2px solid', boxSizing: 'border-box', outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' },
  card: { borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleArea: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 },
  productName: { margin: 0, fontSize: '17px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  categoryBadge: { alignSelf: 'flex-start', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' },
  actionMenu: { display: 'flex', gap: '4px' },
  iconBtn: { background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer', fontSize: '16px', borderRadius: '8px', transition: 'background-color 0.2s ease' },
  stockStatus: { padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textAlign: 'center' },
  stockControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  controlBtn: { width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #e8d9eb', fontSize: '20px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' },
  stockDisplay: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  stockNumber: { fontSize: '24px', fontWeight: '800', lineHeight: '1' },
  stockMin: { fontSize: '12px', fontWeight: '500', marginTop: '4px' },
  cardNotes: { marginTop: '10px', paddingTop: '10px', fontSize: '13px', fontStyle: 'italic' },
  emptyState: { padding: '40px 20px', textAlign: 'center', borderRadius: '16px' },
  emptyBtn: { padding: '10px 20px', background: 'transparent', color: '#8b5cf6', border: '2px solid #8b5cf6', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 calc(12px + env(safe-area-inset-bottom)) 0', zIndex: 100 },
  navItem: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1 },
  navText: { fontSize: '11px', fontWeight: '600' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { width: '90%', maxWidth: '450px', maxHeight: '90vh', overflow: 'auto', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  closeBtn: { background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' },
};

export default Dashboard;