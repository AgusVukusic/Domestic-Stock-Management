import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsAPI, groupsAPI } from '../services/api';
import { Sun, Moon, ShoppingCart, Search, Plus, Package, LogOut, X } from 'lucide-react';
import './RegisterPurchase.css';

function RegisterPurchase() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState('');
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();

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
      
      const savedGroup = localStorage.getItem('lastActiveGroup');
      if (savedGroup && groupsRes.data.some(g => g._id === savedGroup)) {
        setActiveGroup(savedGroup);
      } else if (groupsRes.data.length > 0) {
        setActiveGroup(groupsRes.data[0]._id);
      }
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
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

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setPurchaseQuantity(1);
    setPurchasePrice('');
    setShowModal(true);
  };

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsPurchasing(true);
    const toastId = toast.loading('Registrando compra...');

    try {
      const priceToSend = parseFloat(purchasePrice) || 0;
      await productsAPI.increaseStock(selectedProduct._id, purchaseQuantity, priceToSend);
      
      if (selectedProduct.en_lista_compras) {
        await productsAPI.removeFromShoppingList(selectedProduct._id);
      }

      setShowModal(false);
      setSelectedProduct(null);
      loadData(); 
      toast.success(`¡Se sumaron ${purchaseQuantity} unidades de ${selectedProduct.nombre}!`, { id: toastId });
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  let displayedProducts = products.filter(p => p.owner_id === activeGroup);

  if (searchTerm) {
    displayedProducts = displayedProducts.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '25px', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Registrar Compra</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>Busca el producto y suma stock rápidamente.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShoppingCart size={18} /> Comprando para:
            </span>
            <select
              value={activeGroup}
              onChange={(e) => {
                setActiveGroup(e.target.value);
                localStorage.setItem('lastActiveGroup', e.target.value);
              }}
              style={{ 
                padding: '8px 12px', borderRadius: '10px', flex: 1,
                backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', 
                border: '2px solid var(--border-color)', outline: 'none' 
              }}
            >
              {groups.map(g => (
                <option key={g._id} value={g._id}>{g.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '45px' }}
            />
          </div>
        </div>

        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {displayedProducts.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No se encontraron productos.</p>
            </div>
          ) : (
            displayedProducts.map(product => (
              <div key={product._id} className="card card-hover product-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{product.nombre}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    <span className="category-badge">{product.categoria}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Stock actual: <strong>{product.cantidad}</strong></span>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenModal(product)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                >
                  <Plus size={18} strokeWidth={2.5} /> Agregar Stock
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Package size={24} /> Sumar al Inventario</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleConfirmPurchase} className="modal-body">
              <p style={{ margin: '0 0 20px 0', fontSize: '1.05rem', lineHeight: '1.5' }}>
                ¿Cuántas unidades de <strong style={{ color: 'var(--primary)' }}>{selectedProduct.nombre}</strong> compraste?
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
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isPurchasing}
                  className="btn btn-primary"
                >
                  {isPurchasing ? 'Confirmando...' : 'Confirmar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cierre de Sesión */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'var(--danger)' }}>
              <h2><LogOut size={24} /> Cerrar Sesión</h2>
              <button onClick={() => setShowLogoutConfirm(false)} className="modal-close">
                <X size={24} />
              </button>
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

export default RegisterPurchase;