import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, groupsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  Package, Plus, ShoppingCart, 
  ClipboardList, Search, Edit2, Trash2, Minus, Check, X, ScanBarcode
} from 'lucide-react';
import './Dashboard.css';
import BarcodeScanner from '../components/BarcodeScanner';

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [processingListId, setProcessingListId] = useState(null);

  const [activeGroup, setActiveGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad: 0,
    categoria: '',
    stock_min: 0,
    notas: '',
    owner_type: 'group',
    owner_id: '',
    codigo_barras: '',
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanningFor, setScanningFor] = useState(null); // 'search', 'create', 'edit'
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, groupsRes] = await Promise.all([
        productsAPI.getAll(),
        groupsAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setGroups(groupsRes.data);
      
      const savedGroup = localStorage.getItem('lastActiveGroup');
      if (savedGroup && groupsRes.data.some(g => g._id === savedGroup)) {
        setActiveGroup(savedGroup);
      } else if (groupsRes.data.length > 0 && !activeGroup) {
        setActiveGroup(groupsRes.data[0]._id);
        localStorage.setItem('lastActiveGroup', groupsRes.data[0]._id);
      }
    } catch (error) {
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  // Themes and Logout are now handled by Navigation.js

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
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
    } finally {
      setIsCreating(false);
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
        notas: editingProduct.notas,
        ultimo_precio: parseFloat(editingProduct.ultimo_precio) || 0,
        codigo_barras: editingProduct.codigo_barras
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

  const handleBarcodeScan = async (decodedText) => {
    setShowBarcodeScanner(false);
    if (scanningFor === 'create') {
      setFormData({ ...formData, codigo_barras: decodedText });
      toast.success('Código escaneado: ' + decodedText);
    } else if (scanningFor === 'edit' && editingProduct) {
      setEditingProduct({ ...editingProduct, codigo_barras: decodedText });
      toast.success('Código escaneado: ' + decodedText);
    } else if (scanningFor === 'search') {
      try {
        const res = await productsAPI.getByBarcode(decodedText);
        if (res.data) {
          setSearchTerm(res.data.nombre);
        }
      } catch (error) {
        toast.error('Producto no encontrado');
      }
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
    setProcessingListId(product._id);
    const toastId = toast.loading('Actualizando lista...');
    try {
      if (product.en_lista_compras) {
        await productsAPI.removeFromShoppingList(product._id);
        toast.success(`${product.nombre} quitado de la lista`, { id: toastId });
      } else {
        await productsAPI.addToShoppingList(product._id);
        toast.success(`${product.nombre} agregado a las compras`, { id: toastId });
      }
      loadData();
    } catch (error) {
      toast.error('Error al actualizar lista de compras', { id: toastId });
    } finally {
      setProcessingListId(null);
    }
  };

  const getAlertClass = (cantidad, stock_min) => {
    if (cantidad === 0) return 'danger';
    if (cantidad <= stock_min) return 'warning';
    return '';
  };

  let displayedProducts = products.filter(p => p.owner_id === activeGroup);
  const groupCategories = [...new Set(displayedProducts.map(p => p.categoria))].filter(Boolean).sort();

  if (searchTerm) {
    displayedProducts = displayedProducts.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.notas && p.notas.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  if (activeCategory) {
    displayedProducts = displayedProducts.filter(p => p.categoria === activeCategory);
  }

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
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ paddingRight: '100px' }}>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>Inventario</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>Mantén tu hogar organizado y abastecido</p>
        </div>
        
        {groups.length > 0 && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--card-bg)', 
            padding: '8px 12px', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-sm)', 
            border: '1px solid var(--border-color)', width: 'fit-content' 
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>GRUPO:</span>
            <select
              value={activeGroup}
              onChange={(e) => {
                setActiveGroup(e.target.value);
                localStorage.setItem('lastActiveGroup', e.target.value);
              }}
              style={{ 
                background: 'transparent', color: 'var(--text-primary)', 
                border: 'none', outline: 'none',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                appearance: 'none', paddingRight: '10px'
              }}
            >
              {groups.map(g => (
                <option key={g._id} value={g._id}>{g.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: 'var(--spacing-xl)' }}>
        <button onClick={() => {
            if (groups.length === 0) {
              toast.error("Primero debes crear un Grupo Familiar");
              navigate('/groups');
            } else {
              setFormData({...formData, owner_id: activeGroup});
              setShowModal(true);
            }
          }} 
          className="btn btn-primary" style={{ padding: '12px 18px', borderRadius: 'var(--radius-full)', flex: '1 1 auto' }}
        >
          <Plus size={18} /> 
          <span style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Nuevo Producto</span>
        </button>
        
        <button onClick={() => navigate('/register-purchase')} className="btn btn-secondary" style={{ padding: '12px 18px', borderRadius: 'var(--radius-full)', flex: '1 1 auto' }}>
          <ShoppingCart size={18} /> 
          <span style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Ingresar Stock</span>
        </button>
        
        <button onClick={() => navigate('/shopping-list')} className="btn btn-secondary" style={{ padding: '12px 18px', borderRadius: 'var(--radius-full)', flex: '1 1 auto', position: 'relative' }}>
          <ClipboardList size={18} /> 
          <span style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Lista Compras</span>
          {products.filter(p => p.en_lista_compras && p.owner_id === activeGroup).length > 0 && (
            <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', border: '2px solid var(--bg-color)' }}>
              {products.filter(p => p.en_lista_compras && p.owner_id === activeGroup).length}
            </span>
          )}
        </button>
      </div>

        {groups.length > 0 && products.filter(p => p.owner_id === activeGroup).length > 0 && (
          <div className="glass-panel" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-xl)', display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><Search size={18} /></span>
                <input
                  type="text"
                  placeholder="Buscar productos por nombre o notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '45px', borderRadius: 'var(--radius-full)' }}
                />
              </div>
              <button onClick={() => { setScanningFor('search'); setShowBarcodeScanner(true); }} className="btn-icon" style={{ borderRadius: 'var(--radius-full)' }} title="Escanear Código">
                <ScanBarcode size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flex: '1 1 200px' }}>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="form-input"
                style={{ borderRadius: 'var(--radius-full)', flex: 1 }}
              >
                <option value="">Todas las categorías</option>
                {groupCategories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input"
                style={{ borderRadius: 'var(--radius-full)', flex: 1 }}
              >
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
                <option value="stock-asc">Stock (Menor a Mayor)</option>
                <option value="stock-desc">Stock (Mayor a Menor)</option>
              </select>
            </div>
          </div>
        )}

      <div className="product-grid animate-fade-in" style={{ marginTop: '20px' }}>
        {groups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3 className="empty-title">No tienes grupos familiares</h3>
            <p className="empty-text">Para comenzar a agregar productos, primero debes crear un grupo (puedes estar tú solo en él).</p>
            <button onClick={() => navigate('/groups')} className="btn btn-primary">
              Crear mi primer grupo
            </button>
          </div>
        ) : products.filter(p => p.owner_id === activeGroup).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3 className="empty-title">Inventario vacío</h3>
            <p className="empty-text">No hay productos registrados en este grupo.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              Agregar Producto
            </button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">Sin resultados</h3>
            <p className="empty-text">No se encontraron productos con esos filtros.</p>
            <button onClick={() => { setSearchTerm(''); setActiveCategory(''); setSortBy('name-asc'); }} className="btn btn-primary">
              Limpiar filtros
            </button>
          </div>
        ) : (
          displayedProducts.map((product) => (
            <div key={product._id} className="card card-hover product-card">
              <div className="card-info">
                <div className="card-header-row">
                  <h5 className="card-header-title">{product.nombre}</h5>
                  {product.cantidad <= product.stock_min && (
                    <div className={`alert-dot ${getAlertClass(product.cantidad, product.stock_min)}`} title={product.cantidad === 0 ? 'Sin stock' : 'Stock bajo'} />
                  )}
                </div>
                
                <div className="card-meta-row">
                  <span className="category-badge">{product.categoria}</span>
                  <span className="stock-badge" style={{ backgroundColor: product.cantidad === 0 ? 'var(--danger)' : product.cantidad <= product.stock_min ? 'var(--warning)' : 'var(--primary-light)', color: product.cantidad === 0 ? 'white' : 'inherit' }}>
                    Stock: {product.cantidad}
                  </span>
                </div>

                {product.notas && (
                  <div className="notes">{product.notas}</div>
                )}
              </div>

              <div className="card-actions">
                <button 
                  onClick={() => handleDecrease(product._id, product.nombre)} 
                  disabled={product.cantidad === 0} 
                  className="btn-icon"
                  style={{ background: 'var(--primary)', color: 'white', opacity: product.cantidad === 0 ? 0.5 : 1 }}
                >
                  <Minus size={16} />
                </button>
                <button 
                  onClick={() => toggleShoppingList(product)} 
                  disabled={processingListId === product._id}
                  className="btn-icon"
                  style={{ 
                    backgroundColor: product.en_lista_compras ? 'var(--primary-light)' : 'var(--input-bg)',
                    opacity: processingListId === product._id ? 0.5 : 1
                  }}
                >
                  {product.en_lista_compras ? <Check size={16} /> : <ShoppingCart size={16} />}
                </button>
                <button onClick={() => openEditModal(product)} className="btn-icon">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(product._id)} className="btn-icon" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
    {/* Modal para CREAR producto */}
    {showModal && (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
              <h2><Package size={24} /> Nuevo Producto</h2>
              <button onClick={() => setShowModal(false)} className="modal-close"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Nombre del producto</label>
                <input type="text" className="form-input" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required placeholder="Ej: Jabón Dove" />
              </div>

              <div className="form-group">
                <label className="form-label">Grupo asignado</label>
                <select className="form-input custom-select" value={formData.owner_id || activeGroup} onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })} required>
                  {groups.map(group => (
                    <option key={group._id} value={group._id}>{group.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Cantidad</label>
                    <input type="number" min="0" className="form-input" value={formData.cantidad} onFocus={(e) => e.target.select()} onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })} required placeholder="0" />
                </div>
                <div className="form-group">
                    <label className="form-label">Stock mínimo</label>
                    <input type="number" min="0" className="form-input" value={formData.stock_min} onFocus={(e) => e.target.select()} onChange={(e) => setFormData({ ...formData, stock_min: parseInt(e.target.value) || 0 })} required placeholder="0" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <div className="composite-input">
                  <input 
                    type="text" 
                    value={formData.categoria} 
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value.toLowerCase() })} 
                    required 
                    placeholder="Ej: limpieza, alimentos" 
                  />
                  <div className="composite-divider"></div>
                  <select 
                    value="" 
                    onChange={(e) => {
                      if (e.target.value) setFormData({ ...formData, categoria: e.target.value });
                    }} 
                  >
                    <option value="" disabled></option>
                    {groupCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas (opcional)</label>
                <textarea className="form-input" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Detalles..." />
              </div>

              <div className="form-group">
                <label className="form-label">Código de Barras (opcional)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" className="form-input" value={formData.codigo_barras || ''} onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })} placeholder="Ej: 779123456789" />
                  <button type="button" onClick={() => { setScanningFor('create'); setShowBarcodeScanner(true); }} className="btn btn-secondary">
                    <ScanBarcode size={20} />
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={isCreating} className="btn btn-primary">
                  {isCreating ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
          </form>
        </div>
    </div>
    )}

    {/* Modal para EDITAR producto */}
    {showEditModal && editingProduct && (
    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
        <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
              <h2><Edit2 size={24} /> Editar Producto</h2>
              <button onClick={() => setShowEditModal(false)} className="modal-close"><X size={24} /></button>
          </div>

          <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Nombre del producto</label>
                <input type="text" className="form-input" value={editingProduct.nombre} onChange={(e) => setEditingProduct({ ...editingProduct, nombre: e.target.value })} required placeholder="Ej: Jabón Dove" />
              </div>

              <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Stock mínimo</label>
                    <input type="number" step="1" min="0" className="form-input" value={editingProduct.stock_min} onFocus={(e) => e.target.select()} onChange={(e) => setEditingProduct({ ...editingProduct, stock_min: parseInt(e.target.value) || 0 })} required placeholder="0" />
                </div>
                <div className="form-group">
                    <label className="form-label">Precio Unit. ($)</label>
                    <input type="number" step="0.01" min="0" className="form-input" value={editingProduct.ultimo_precio || ''} onFocus={(e) => e.target.select()} onChange={(e) => setEditingProduct({ ...editingProduct, ultimo_precio: e.target.value })} placeholder="Opcional" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <div className="composite-input">
                  <input type="text" value={editingProduct.categoria} onChange={(e) => setEditingProduct({ ...editingProduct, categoria: e.target.value.toLowerCase() })} required placeholder="Ej: limpieza, alimentos" />
                  <div className="composite-divider"></div>
                  <select value="" onChange={(e) => { if (e.target.value) setEditingProduct({ ...editingProduct, categoria: e.target.value }); }} >
                    <option value="" disabled></option>
                    {groupCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas (opcional)</label>
                <textarea className="form-input" value={editingProduct.notas || ''} onChange={(e) => setEditingProduct({ ...editingProduct, notas: e.target.value })} style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Detalles..." />
              </div>

              <div className="form-group">
                <label className="form-label">Código de Barras (opcional)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" className="form-input" value={editingProduct.codigo_barras || ''} onChange={(e) => setEditingProduct({ ...editingProduct, codigo_barras: e.target.value })} placeholder="Ej: 779123456789" />
                  <button type="button" onClick={() => { setScanningFor('edit'); setShowBarcodeScanner(true); }} className="btn btn-secondary">
                    <ScanBarcode size={20} />
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Actualizar</button>
              </div>
          </form>
        </div>
    </div>
    )}



      {showBarcodeScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowBarcodeScanner(false)} />}
    </div>
  );
}

export default Dashboard;