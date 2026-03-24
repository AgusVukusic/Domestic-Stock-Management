import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, groupsAPI } from '../services/api';
import toast from 'react-hot-toast';

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Estados para Filtros y Ordenamiento
  const [activeGroup, setActiveGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [sortBy, setSortBy] = useState(''); // <-- estado para ordenar
  
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad: 0,
    categoria: '',
    stock_min: 0,
    notas: '',
    owner_type: 'group',
    owner_id: '',
  });
  
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    loadData();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, groupsRes] = await Promise.all([
        productsAPI.getAll(),
        groupsAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setGroups(groupsRes.data);
      
      if (groupsRes.data.length > 0 && !activeGroup) {
        setActiveGroup(groupsRes.data[0]._id);
      }
    } catch (error) {
      toast.error('Error al cargar la información');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Guardando producto...');
    try {
      const dataToSubmit = {
        ...formData,
        owner_type: 'group',
        owner_id: formData.owner_id || activeGroup
      };
      
      await productsAPI.create(dataToSubmit);
      setShowModal(false);
      setFormData({ nombre: '', cantidad: 0, categoria: '', stock_min: 0, notas: '', owner_type: 'group', owner_id: '' });
      loadData();
      toast.success('¡Producto agregado al inventario!', { id: toastId });
    } catch (error) {
      toast.error('Error al crear producto', { id: toastId });
    }
  };

  const openEditModal = (product) => {
    setEditingProduct({ ...product }); 
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Actualizando producto...');
    try {
      const updateData = {
        nombre: editingProduct.nombre,
        cantidad: editingProduct.cantidad,
        categoria: editingProduct.categoria,
        stock_min: editingProduct.stock_min,
        notas: editingProduct.notas
      };
      
      await productsAPI.update(editingProduct._id, updateData);
      setShowEditModal(false);
      setEditingProduct(null);
      loadData();
      toast.success('Producto actualizado correctamente', { id: toastId });
    } catch (error) {
      toast.error('Error al actualizar el producto', { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este producto de forma permanente?')) {
      try {
        await productsAPI.delete(id);
        loadData();
        toast.success('Producto eliminado correctamente');
      } catch (error) {
        toast.error('No se pudo eliminar el producto');
      }
    }
  };

  const handleDecrease = async (id, nombre) => {
    try {
      await productsAPI.decreaseStock(id, 1);
      loadData();
      toast.success(`1 unidad de ${nombre} descontada`);
    } catch (error) {
      toast.error('Error al actualizar el stock');
    }
  };

  const toggleShoppingList = async (product) => {
    try {
      if (product.en_lista_compras) {
        await productsAPI.removeFromShoppingList(product._id);
        toast.success(`${product.nombre} quitado de la lista`);
      } else {
        await productsAPI.addToShoppingList(product._id);
        toast.success(`${product.nombre} agregado a las compras`);
      }
      loadData();
    } catch (error) {
      toast.error('Error al actualizar lista de compras');
    }
  };

  const getStockBadgeStyle = (cantidad, stock_min) => {
    if (cantidad === 0) return { backgroundColor: '#dc3545', color: 'white' };
    if (cantidad <= stock_min) return { backgroundColor: '#ffc107', color: '#2D2D2D' };
    if (cantidad <= stock_min * 2) return { backgroundColor: '#C7C8F4', color: '#2D2D2D' };
    return { backgroundColor: '#8C7AE6', color: 'white' };
  };

  const theme = darkMode ? darkTheme : lightTheme;

  // 1. Filtrar por Grupo
  let displayedProducts = products.filter(p => p.owner_id === activeGroup);
  const groupCategories = [...new Set(displayedProducts.map(p => p.categoria))].filter(Boolean).sort();

  // 2. Filtrar por Búsqueda
  if (searchTerm) {
    displayedProducts = displayedProducts.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.notas && p.notas.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // 3. Filtrar por Categoría
  if (activeCategory) {
    displayedProducts = displayedProducts.filter(p => p.categoria === activeCategory);
  }

  // 4. Ordenar Productos SÓLO CUMPLIENDO RF-PROD-09
  if (sortBy === 'name-asc') {
    displayedProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } else if (sortBy === 'name-desc') {
    displayedProducts.sort((a, b) => b.nombre.localeCompare(a.nombre));
  } else if (sortBy === 'stock-asc') {
    displayedProducts.sort((a, b) => a.cantidad - b.cantidad);
  } else if (sortBy === 'stock-desc') {
    displayedProducts.sort((a, b) => b.cantidad - a.cantidad);
  }

  if (loading) {
    return (
      <div style={{ ...styles.loadingContainer, backgroundColor: theme.background }}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, backgroundColor: theme.background }}>
      
      <style>
        {`
            .custom-input { width: 100%; padding: 10px 12px; border-radius: 8px; border-width: 1px; border-style: solid; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
            .custom-input:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2); }
            .custom-select { appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238b5cf6%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 12px top 50%; background-size: 12px auto; cursor: pointer; }
        `}
      </style>

      <nav style={{ ...styles.navbar, backgroundColor: theme.navbarBg, borderBottom: `1px solid ${theme.border}` }}>
        <div style={styles.navbarContent}>
          <div style={styles.navbarLeft}>
            <h1 style={{ ...styles.logo, color: theme.text }}>📦 Stock App</h1>
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

      <div style={styles.actionsContainer}>
        <div style={{ ...styles.actionsCard, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
          <button 
            onClick={() => {
              if (groups.length === 0) {
                toast.error("Primero debes crear un Grupo Familiar");
                navigate('/groups');
              } else {
                setFormData({...formData, owner_id: activeGroup});
                setShowModal(true);
              }
            }} 
            style={styles.primaryActionBtn}
          >
            <span style={styles.btnIcon}>➕</span> Nuevo Producto
          </button>
          <button onClick={() => navigate('/register-purchase')} style={{ ...styles.secondaryActionBtn, backgroundColor: theme.cardBg, color: theme.text, border: `2px solid ${theme.border}` }}>
            <span style={styles.btnIcon}>🛒</span> Registrar Compra
          </button>
          <button onClick={() => navigate('/groups')} style={{ ...styles.secondaryActionBtn, backgroundColor: theme.cardBg, color: theme.text, border: `2px solid ${theme.border}` }}>
            <span style={styles.btnIcon}>👥</span> Grupos Familiares
          </button>
          <button onClick={() => navigate('/shopping-list')} style={styles.successActionBtn}>
            <span style={styles.btnIcon}>📋</span> Lista de Compras
            <span style={styles.badge}>{products.filter(p => p.en_lista_compras && p.owner_id === activeGroup).length}</span>
          </button>
        </div>
      </div>

      {/* TÍTULO Y SELECTOR INTEGRADO */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 20px', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', padding: '0 15px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: theme.text }}>
            Inventario de
          </h2>
          <select
            value={activeGroup}
            onChange={(e) => setActiveGroup(e.target.value)}
            style={{ 
              ...styles.filterSelect, 
              width: 'auto', 
              padding: '4px 10px', 
              flex: 1, 
              backgroundColor: theme.inputBg, 
              color: theme.text, 
              borderColor: theme.border,
              margin: 0
            }}
          >
            <option value="">Todos los grupos</option>
            {groups.map(g => (
              <option key={g._id} value={g._id}>{g.nombre}</option>
            ))}
          </select>
        </div>

        {/* CONTROLES (Buscador y Categoría) */}
        {groups.length > 0 && products.filter(p => p.owner_id === activeGroup).length > 0 && (
        <div style={styles.controlsContainer}>
          <div style={styles.searchContainer}>
            <span style={{...styles.searchIcon, color: theme.textMuted}}>🔍</span>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...styles.searchInput, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
            />
        </div>

            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              style={{
                padding: '10px 16px', borderRadius: '10px', border: `2px solid ${theme.border}`,
                backgroundColor: theme.inputBg, color: theme.text, outline: 'none', cursor: 'pointer',
                minWidth: '200px', boxSizing: 'border-box'
              }}
            >
              <option value="">🏷️ Todas las categorías</option>
              {groupCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* NUEVO: Selector de Ordenamiento */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '10px 16px', borderRadius: '10px', border: `2px solid ${theme.border}`,
                backgroundColor: theme.inputBg, color: theme.text, outline: 'none', cursor: 'pointer',
                minWidth: '200px', boxSizing: 'border-box'
              }}
            >
              <option value="">↕️ Ordenar por...</option>
              <option value="name-asc">🔤 Nombre (A-Z)</option>
              <option value="name-desc">🔠 Nombre (Z-A)</option>
              <option value="stock-asc">📉 Stock (Menor a Mayor)</option>
              <option value="stock-desc">📈 Stock (Mayor a Menor)</option>
            </select>
          </div>
        )}
      </div>

      <div style={styles.productGrid}>
        {groups.length === 0 ? (
          <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
            <div style={styles.emptyIcon}>👥</div>
            <h3 style={{ ...styles.emptyTitle, color: theme.text }}>No tienes grupos familiares</h3>
            <p style={{ ...styles.emptyText, color: theme.textMuted }}>Para comenzar a agregar productos, primero debes crear un grupo (puedes estar tú solo en él).</p>
            <button onClick={() => navigate('/groups')} style={styles.emptyBtn}>
              Crear mi primer grupo
            </button>
          </div>
        ) : products.filter(p => p.owner_id === activeGroup).length === 0 ? (
          <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
            <div style={styles.emptyIcon}>📦</div>
            <h3 style={{ ...styles.emptyTitle, color: theme.text }}>Inventario vacío</h3>
            <p style={{ ...styles.emptyText, color: theme.textMuted }}>No hay productos registrados en este grupo.</p>
            <button onClick={() => setShowModal(true)} style={styles.emptyBtn}>
              Agregar Producto
            </button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
            <div style={styles.emptyIcon}>🔍</div>
            <h3 style={{ ...styles.emptyTitle, color: theme.text }}>Sin resultados</h3>
            <p style={{ ...styles.emptyText, color: theme.textMuted }}>No se encontraron productos con esos filtros.</p>
            <button onClick={() => { setSearchTerm(''); setActiveCategory(''); setSortBy(''); }} style={styles.emptyBtn}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          displayedProducts.map((product) => (
            <div key={product._id} style={{ ...styles.card, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }} className="product-card">
              
              {/* Lado izquierdo: Información compacta */}
              <div style={styles.cardInfo}>
                <div style={styles.cardHeaderRow}>
                  <h5 style={{ ...styles.cardHeaderTitle, color: theme.text }}>{product.nombre}</h5>
                  {product.cantidad <= product.stock_min && (
                    <span style={styles.alertDot}>{product.cantidad === 0 ? '🔴' : '🟡'}</span>
                  )}
                </div>
                
                <div style={styles.cardMetaRow}>
                  <span style={styles.categoryBadge}>{product.categoria}</span>
                  <span style={{ ...styles.stockBadge, ...getStockBadgeStyle(product.cantidad, product.stock_min) }}>
                    Stock: {product.cantidad}
                  </span>
                </div>

                {product.notas && (
                  <div style={{ ...styles.notes, color: theme.textMuted }}>{product.notas}</div>
                )}
              </div>

              {/* Lado derecho: Botones cuadrados nativos */}
              <div style={styles.cardActions}>
                <button onClick={() => handleDecrease(product._id, product.nombre)} disabled={product.cantidad === 0} style={{ ...styles.actionBtn, ...styles.actionBtnUse, opacity: product.cantidad === 0 ? 0.5 : 1 }}>
                  ➖
                </button>
                <button onClick={() => toggleShoppingList(product)} style={{ ...styles.actionBtn, ...(product.en_lista_compras ? styles.actionBtnInList : { backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.border}` }) }}>
                  {product.en_lista_compras ? '✓' : '🛒'}
                </button>
                <button onClick={() => openEditModal(product)} style={{ ...styles.actionBtn, backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.border}` }}>
                  ✏️
                </button>
                <button onClick={() => handleDelete(product._id)} style={{ ...styles.actionBtn, ...styles.actionBtnDelete }}>
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
    {/* Modal para CREAR producto */}
    {showModal && (
    <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
        <div style={{ ...styles.modal, backgroundColor: theme.cardBg, padding: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...styles.modalHeader, backgroundColor: '#8b5cf6', padding: '20px 24px', margin: 0, borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>📦</span>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Nuevo Producto</h2>
            </div>
            <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ ...styles.modalForm, padding: '24px' }}>
            <div style={{...styles.formGroup, marginBottom: '20px'}}>
              <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Nombre del producto</label>
              <input type="text" className="custom-input" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} placeholder="Ej: Jabón Dove" />
            </div>

            <div style={{...styles.formGroup, marginBottom: '20px'}}>
              <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Grupo asignado</label>
              <select className="custom-input custom-select" value={formData.owner_id || activeGroup} onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })} style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} required>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>👥 {group.nombre}</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.formRow, display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{...styles.formGroup, flex: 1}}>
                  <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Cantidad</label>
                  <input type="number" className="custom-input" value={formData.cantidad} onFocus={(e) => e.target.select()} onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })} required style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} placeholder="0" />
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                  <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Stock mínimo</label>
                  <input type="number" className="custom-input" value={formData.stock_min} onFocus={(e) => e.target.select()} onChange={(e) => setFormData({ ...formData, stock_min: parseInt(e.target.value) || 0 })} required style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} placeholder="0" />
              </div>
            </div>

            <div style={{...styles.formGroup, marginBottom: '20px'}}>
              <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Categoría</label>
              <input type="text" className="custom-input" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value.toLowerCase() })} required style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} placeholder="Ej: limpieza, alimentos" />
            </div>

            <div style={{...styles.formGroup, marginBottom: '24px'}}>
              <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Notas (opcional)</label>
              <textarea className="custom-input" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, minHeight: '80px', resize: 'vertical' }} placeholder="Detalles..." />
            </div>

            <div style={{ ...styles.modalActions, display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ ...styles.cancelBtn, backgroundColor: theme.cancelBtnBg, color: theme.text, border: `1px solid ${theme.border}` }}>Cancelar</button>
              <button type="submit" style={styles.submitBtn}>Guardar Producto</button>
            </div>
        </form>
        </div>
    </div>
    )}

    {/* Modal para EDITAR producto */}
    {showEditModal && editingProduct && (
    <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
        <div style={{ ...styles.modal, backgroundColor: theme.cardBg, padding: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...styles.modalHeader, backgroundColor: '#8b5cf6', padding: '20px 24px', margin: 0, borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>✏️</span>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Editar Producto</h2>
            </div>
            <button onClick={() => setShowEditModal(false)} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleEditSubmit} style={{ ...styles.modalForm, padding: '24px' }}>
            <div style={{...styles.formGroup, marginBottom: '20px'}}>
              <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Nombre del producto</label>
              <input type="text" className="custom-input" value={editingProduct.nombre} onChange={(e) => setEditingProduct({ ...editingProduct, nombre: e.target.value })} required style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} placeholder="Ej: Jabón Dove" />
            </div>

            <div style={{ ...styles.formRow, display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{...styles.formGroup, flex: 1}}>
                  <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Cantidad</label>
                  <input type="number" className="custom-input" value={editingProduct.cantidad} onChange={(e) => setEditingProduct({ ...editingProduct, cantidad: parseInt(e.target.value) || 0 })} required style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} placeholder="0" />
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                  <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Stock mínimo</label>
                  <input type="number" className="custom-input" value={editingProduct.stock_min} onChange={(e) => setEditingProduct({ ...editingProduct, stock_min: parseInt(e.target.value) || 0 })} required style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} placeholder="0" />
              </div>
            </div>

            <div style={{...styles.formGroup, marginBottom: '20px'}}>
              <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Categoría</label>
              <input type="text" className="custom-input" value={editingProduct.categoria} onChange={(e) => setEditingProduct({ ...editingProduct, categoria: e.target.value.toLowerCase() })} required style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} placeholder="Ej: limpieza, alimentos" />
            </div>

            <div style={{...styles.formGroup, marginBottom: '24px'}}>
              <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Notas (opcional)</label>
              <textarea className="custom-input" value={editingProduct.notas || ''} onChange={(e) => setEditingProduct({ ...editingProduct, notas: e.target.value })} style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, minHeight: '80px', resize: 'vertical' }} placeholder="Detalles..." />
            </div>

            <div style={{ ...styles.modalActions, display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ ...styles.cancelBtn, backgroundColor: theme.cancelBtnBg, color: theme.text, border: `1px solid ${theme.border}` }}>Cancelar</button>
              <button type="submit" style={styles.submitBtn}>Actualizar</button>
            </div>
        </form>
        </div>
    </div>
    )}
    </div>
  );
}

const lightTheme = { background: '#F7E7FA', text: '#2D2D2D', textMuted: '#7A7A85', navbarBg: '#FFFFFF', cardBg: '#FFFFFF', inputBg: '#FFFFFF', border: '#e8d9eb', cancelBtnBg: '#F7E7FA' };
const darkTheme = { background: '#1a1a1a', text: '#FFFFFF', textMuted: '#9a9a9a', navbarBg: '#2D2D2D', cardBg: '#2D2D2D', inputBg: '#3a3a3a', border: '#4a4a4a', cancelBtnBg: '#3a3a3a' };

const styles = {
  container: { minHeight: '100vh', paddingBottom: '40px', transition: 'background-color 0.3s ease' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
  spinner: { width: '50px', height: '50px', border: '4px solid #e8d9eb', borderTop: '4px solid #8C7AE6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '20px', fontSize: '18px' },
  // --- NAVBAR ---
  navbar: { padding: '15px 0', marginBottom: '15px', position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s ease' },
  navbarContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navbarLeft: { display: 'flex', alignItems: 'center' },
  logo: { margin: 0, fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navbarRight: { display: 'flex', gap: '8px', alignItems: 'center' },
  themeBtn: { width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' },
  username: { fontSize: '13px', fontWeight: '600', display: 'none' }, // Ocultamos tu nombre en el celular para hacer más espacio
  logoutBtn: { padding: '8px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.3s ease' },actionsContainer: { maxWidth: '1400px', margin: '0 auto 40px', padding: '0 20px' },
  // --- BOTONES PRINCIPALES ---
  actionsContainer: { maxWidth: '1400px', margin: '0 auto 20px', padding: '0 15px' },
  actionsCard: { padding: '15px', borderRadius: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)', transition: 'all 0.3s ease' },
  primaryActionBtn: { padding: '12px 6px', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)' },
  secondaryActionBtn: { padding: '12px 6px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  successActionBtn: { padding: '12px 6px', background: '#8C7AE6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)' },
  btnIcon: { fontSize: '16px' },
  badge: { backgroundColor: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', marginLeft: '4px' },
  productGrid: { maxWidth: '1400px', margin: '0 auto', padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { borderRadius: '16px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)', transition: 'all 0.3s ease' },
  cardInfo: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  cardHeaderRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  cardHeaderTitle: { margin: 0, fontSize: '16px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  alertDot: { fontSize: '12px' },
  cardMetaRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  categoryBadge: { backgroundColor: '#F7E7FA', color: '#8C7AE6', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' },
  stockBadge: { fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px' },
  notes: { fontSize: '12px', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardActions: { display: 'grid', gridTemplateColumns: 'repeat(2, 36px)', gap: '8px' },
  actionBtn: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s ease' },
  actionBtnUse: { background: '#8C7AE6', color: 'white' },
  actionBtnAddList: { backgroundColor: '#F7E7FA', color: '#2D2D2D' },
  actionBtnInList: { background: '#C7C8F4', color: '#2D2D2D' },
  actionBtnDelete: { background: '#ffebee', color: '#c62828' },
  emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' },
  emptyIcon: { fontSize: '80px', marginBottom: '20px' },
  emptyTitle: { fontSize: '24px', marginBottom: '10px', fontWeight: '600' },
  emptyText: { fontSize: '16px', marginBottom: '30px' },
  emptyBtn: { padding: '14px 28px', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(45, 45, 45, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { borderRadius: '20px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(140, 122, 230, 0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 30px' },
  modalTitle: { margin: 0, fontSize: '24px', fontWeight: '600' },
  closeBtn: { background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', padding: '0', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s ease' },
  modalForm: { padding: '0 30px 30px' },
  formGroup: { marginBottom: '20px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' },
  input: { width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid', borderRadius: '10px', outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '12px', marginTop: '30px' },
  cancelBtn: { flex: 1, padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', transition: 'all 0.3s ease' },
  submitBtn: { flex: 1, padding: '14px', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)' },
};

export default Dashboard;