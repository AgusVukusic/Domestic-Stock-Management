import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, groupsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Sun, Moon, LogOut, ShoppingCart, Share, DollarSign, BarChart2, X, Check } from 'lucide-react';
import './ShoppingList.css';

function ShoppingList() {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState('');
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadShoppingList();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

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

  const loadShoppingList = async () => {
    try {
      const [productsRes, groupsRes] = await Promise.all([
        productsAPI.getShoppingList(),
        groupsAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setGroups(groupsRes.data);
      
      const savedGroup = localStorage.getItem('lastActiveGroup');
      if (savedGroup && groupsRes.data.some(g => g._id === savedGroup)) {
        setActiveGroup(savedGroup);
      } else if (groupsRes.data.length > 0) {
        setActiveGroup(groupsRes.data[0]._id);
      }
    } catch (error) {
      console.error('Error cargando lista:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPurchaseModal = (product) => {
    setSelectedProduct(product);
    setPurchaseQuantity(1);
    setShowPurchaseModal(true);
    setPurchasePrice('');
  };

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsPurchasing(true);
    const toastId = toast.loading('Registrando compra...');

    try {
      const priceToSend = parseFloat(purchasePrice) || 0;
      await productsAPI.increaseStock(selectedProduct._id, purchaseQuantity, priceToSend);
      await productsAPI.removeFromShoppingList(selectedProduct._id);
      
      setShowPurchaseModal(false);
      setSelectedProduct(null);
      loadShoppingList();
      toast.success(`¡Compraste ${selectedProduct.nombre}!`, { id: toastId });
    } catch (error) {
      toast.error('Error al registrar la compra', { id: toastId });
    } finally {
      setIsPurchasing(false);
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

  const displayedProducts = products.filter(p => p.owner_id === activeGroup);

  const handleExport = () => {
    if (displayedProducts.length === 0) {
      toast.error('No hay productos en la lista para exportar');
      return;
    }

    const groupedByCategory = displayedProducts.reduce((acc, product) => {
      const category = product.categoria || 'Sin categoría';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});

    const groupName = groups.find(g => g._id === activeGroup)?.nombre || '';

    let text = `🛒 LISTA DE COMPRAS - ${groupName.toUpperCase()}\n`;
    text += '━━━━━━━━━━━━━━\n\n';

    Object.keys(groupedByCategory).sort().forEach(category => {
      text += `📌 ${category.toUpperCase()}\n`;
      text += '━━━━━━━━━━━━━━\n';
      
      groupedByCategory[category].forEach(product => {
        text += `• ${product.nombre}\n`;
        text += `  Stock actual: ${product.cantidad} | Mínimo: ${product.stock_min}\n`;
        if (product.notas) text += `  Nota: ${product.notas}\n`;
        text += '\n';
      });
      text += '\n';
    });

    text += `━━━━━━━━━━━━━━\n`;
    text += `Total: ${displayedProducts.length} ${displayedProducts.length === 1 ? 'producto' : 'productos'}\n`;

    navigator.clipboard.writeText(text).then(() => {
      toast.success('✓ Lista copiada al portapapeles!');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('✓ Lista copiada al portapapeles!');
    });
  };

  const estimatedTotal = displayedProducts.reduce((total, product) => {
    const cantidadFaltante = Math.max(1, product.stock_min - product.cantidad);
    return total + ((parseFloat(product.ultimo_precio) || 0) * cantidadFaltante);
  }, 0);

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
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginRight: '15px', padding: '6px 12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver
            </button>
            <h1 className="logo gradient-text">StockApp</h1>
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

      <div className="content-wrapper animate-fade-in" style={{ maxWidth: '1200px' }}>
        <div className="shopping-header">
          <div className="list-title-row">
            <h2 className="list-title">Lista de Compras</h2>
            <div className="badge">{displayedProducts.length} {displayedProducts.length === 1 ? 'ítem' : 'ítems'}</div>
          </div>
          
          {groups.length > 0 && (
            <div className="group-selector-row">
              <select
                value={activeGroup}
                onChange={(e) => {
                  setActiveGroup(e.target.value);
                  localStorage.setItem('lastActiveGroup', e.target.value);
                }}
                className="group-selector"
              >
                {groups.map(g => (
                  <option key={g._id} value={g._id}>Lista de: {g.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {displayedProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ color: 'var(--text-secondary)' }}>
              <ShoppingCart size={60} strokeWidth={1.5} />
            </div>
            <h2 className="empty-title">La lista está vacía</h2>
            <p className="empty-text">Agrega productos desde el dashboard</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Ir al Dashboard</button>
          </div>
        ) : (
          <>
            <div className="product-grid" style={{ gridTemplateColumns: '1fr' }}>
              {displayedProducts.map((product) => (
                <div key={product._id} className="card card-hover product-card">
                  <div className="card-info">
                    <div className="card-header-row">
                      <h3 className="card-header-title">{product.nombre}</h3>
                      <span className="category-badge">{product.categoria}</span>
                    </div>
                    
                    <div className="card-meta-row" style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Stock actual:</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: product.cantidad <= product.stock_min ? 'var(--danger)' : 'var(--primary)' }}>
                        {product.cantidad}
                      </span>
                      <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Stock mínimo:</span>
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>{product.stock_min}</span>
                    </div>

                    {product.notas && (
                      <div className="notes">
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Notas:</span> {product.notas}
                      </div>
                    )}
                  </div>

                  <div className="card-actions" style={{ gridTemplateColumns: '1fr' }}>
                    <button 
                      onClick={() => handleOpenPurchaseModal(product)} 
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                    >
                      <Check size={16} /> Comprado
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="estimated-cost-card">
              <div className="cost-info">
                <span className="cost-icon"><DollarSign size={32} /></span>
                <div>
                  <p className="cost-label">Costo Estimado</p>
                  <p className="cost-amount">${estimatedTotal.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="cost-actions">
                <button 
                  onClick={() => setShowPriceDetails(true)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <BarChart2 size={14} /> Ver Detalles
                </button>
              </div>
            </div>

            <div className="export-section">
              <button onClick={handleExport} className="btn btn-primary" style={{ padding: '14px 32px' }}>
                <Share size={18} /> Exportar Lista
              </button>
              <p className="export-hint">Copia la lista para enviarla por WhatsApp</p>
            </div>
          </>
        )}
      </div>

      {showPurchaseModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><ShoppingCart size={24} /> Registrar Compra</h2>
              <button onClick={() => setShowPurchaseModal(false)} className="modal-close"><X size={24} /></button>
            </div>

            <form onSubmit={handleConfirmPurchase} className="modal-body">
              <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
                ¿Cuántas unidades de <strong style={{ color: 'var(--primary)' }}>{selectedProduct.nombre}</strong> agregaste al inventario?
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cantidad</label>
                  <input
                    type="number" min="1" className="form-input" value={purchaseQuantity} onFocus={(e) => e.target.select()} onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)} required
                    style={{ textAlign: 'center', fontSize: '18px' }}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Precio Unit. ($)</label>
                  <input
                    type="number" min="0" step="0.01" className="form-input" placeholder="Opcional" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '18px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={isPurchasing} className="btn btn-primary">
                  {isPurchasing ? 'Confirmando...' : 'Confirmar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPriceDetails && (
        <div className="modal-overlay" onClick={() => setShowPriceDetails(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><BarChart2 size={24} /> Desglose de Precios</h2>
              <button onClick={() => setShowPriceDetails(false)} className="modal-close"><X size={24} /></button>
            </div>
            
            <div className="modal-body">
              <ul className="price-details-list">
                {displayedProducts.map(p => {
                  const cantidadFaltante = Math.max(1, p.stock_min - p.cantidad);
                  const precioUnidad = parseFloat(p.ultimo_precio) || 0;
                  const subtotal = cantidadFaltante * precioUnidad;
                  
                  return (
                    <li key={p._id} className="price-details-item">
                      <div>
                        <span className="price-details-name">{p.nombre}</span>
                        <span className="price-details-calc">
                          {cantidadFaltante} {cantidadFaltante === 1 ? 'unidad' : 'unidades'} a ${precioUnidad.toFixed(2)} c/u
                        </span>
                      </div>
                      <span className="price-details-subtotal">
                        ${subtotal.toFixed(2)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              
              <div className="price-details-total-row">
                <span style={{ fontWeight: '700', fontSize: '16px' }}>Total Estimado</span>
                <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '20px' }}>${estimatedTotal.toFixed(2)}</span>
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
              <h2><LogOut size={24} /> Cerrar Sesión</h2>
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

export default ShoppingList;