import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, groupsAPI } from '../services/api';
import toast from 'react-hot-toast';

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
  };

  const loadShoppingList = async () => {
    try {
      const [productsRes, groupsRes] = await Promise.all([
        productsAPI.getShoppingList(),
        groupsAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setGroups(groupsRes.data);
      
      // Leemos el grupo guardado en el Dashboard
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
      // Parseamos el precio enviado
      const priceToSend = parseFloat(purchasePrice) || 0;

      // Enviamos cantidad y precio a la base de datos
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

  //Calculamos el costo estimado total
  //Por cada producto vemos cuantos faltan para llegar al minimo y lo multiplicamos por su precio
  const estimatedTotal = displayedProducts.reduce((total, product) => {
    const cantidadFaltante = Math.max(1, product.stock_min - product.cantidad);
    return total + ((parseFloat(product.ultimo_precio) || 0) * cantidadFaltante);
  }, 0);

  const theme = darkMode ? darkTheme : lightTheme;

  if (loading) {
    return (
      <div style={{ ...styles.loadingContainer, backgroundColor: theme.background }}>
        <div style={styles.spinner}></div>
        <p style={{ ...styles.loadingText, color: theme.text }}>Cargando lista...</p>
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
            <button onClick={handleLogoutClick} style={styles.logoutBtn}>Salir</button>
          </div>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ ...styles.listTitle, color: theme.text }}>Lista de Compras</h2>
            <div style={styles.badge}>{displayedProducts.length} {displayedProducts.length === 1 ? 'ítem' : 'ítems'}</div>
          </div>
          
          {groups.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={activeGroup}
                onChange={(e) => {
                  setActiveGroup(e.target.value);
                  localStorage.setItem('lastActiveGroup', e.target.value); // Guardamos la elección
                }}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: '10px', border: `2px solid ${theme.border}`,
                  backgroundColor: theme.cardBg, color: theme.text, fontWeight: '600', fontSize: '15px',
                  outline: 'none', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', boxSizing: 'border-box'
                }}
              >
                {groups.map(g => (
                  <option key={g._id} value={g._id}>👥 Lista de: {g.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {displayedProducts.length === 0 ? (
          <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
            <div style={styles.emptyIcon}>🛒</div>
            <h2 style={{ ...styles.emptyTitle, color: theme.text }}>La lista está vacía</h2>
            <p style={{ ...styles.emptyText, color: theme.textMuted }}>Agrega productos desde el dashboard</p>
            <button onClick={() => navigate('/dashboard')} style={styles.emptyBtn}>Ir al Dashboard</button>
          </div>
        ) : (
          <>
            <div style={styles.productList}>
              {displayedProducts.map((product) => (
                <div key={product._id} style={{ ...styles.productCard, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
                  <div style={styles.productInfo}>
                    <div style={styles.productHeader}>
                      <h3 style={{ ...styles.productName, color: theme.text }}>{product.nombre}</h3>
                      <span style={styles.categoryBadge}>{product.categoria}</span>
                    </div>
                    
                    <div style={styles.stockInfo}>
                      <div style={styles.stockItem}>
                        <span style={{ ...styles.stockLabel, color: theme.textMuted }}>Stock actual:</span>
                        <span style={{ ...styles.stockValue, color: product.cantidad <= product.stock_min ? '#dc3545' : '#8C7AE6' }}>
                          {product.cantidad}
                        </span>
                      </div>
                      <div style={styles.stockItem}>
                        <span style={{ ...styles.stockLabel, color: theme.textMuted }}>Stock mínimo:</span>
                        <span style={{ ...styles.stockValue, color: theme.text }}>{product.stock_min}</span>
                      </div>
                    </div>

                    {product.notas && (
                      <div style={{ ...styles.notes, color: theme.textMuted }}>
                        <span style={{ ...styles.notesLabel, color: theme.text }}>Notas:</span> {product.notas}
                      </div>
                    )}
                  </div>

                  <div style={styles.productActions}>
                    <button onClick={() => handleOpenPurchaseModal(product)} style={styles.removeBtn}>
                      ✓ Comprado
                    </button>
                  </div>
                </div>
              ))}
            </div>

          {/* TARJETA DE COSTO ESTIMADO */}
          {displayedProducts.length > 0 && (
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, padding: '20px 25px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '20px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '28px' }}>💰</span>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Costo Estimado</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: theme.text }}>${estimatedTotal.toFixed(2)}</p>
                </div>
              </div>
              
              {/* Nueva sección derecha con el botón */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => setShowPriceDetails(true)}
                  style={{ padding: '6px 12px', backgroundColor: 'transparent', color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          )}

            <div style={styles.exportSection}>
              <button onClick={handleExport} style={styles.exportBtn}>📤 Exportar Lista</button>
              <p style={{ ...styles.exportHint, color: theme.textMuted }}>Copia la lista para enviarla por WhatsApp</p>
            </div>
          </>
        )}
      </div>

      {showPurchaseModal && selectedProduct && (
        <div style={styles.modalOverlay} onClick={() => setShowPurchaseModal(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg, padding: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, backgroundColor: '#8b5cf6', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🛒</span>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Registrar Compra</h2>
              </div>
              <button onClick={() => setShowPurchaseModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleConfirmPurchase} style={{ padding: '24px' }}>
              <p style={{ color: theme.text, marginBottom: '20px', fontSize: '1.05rem', lineHeight: '1.5' }}>
                ¿Cuántas unidades de <strong>{selectedProduct.nombre}</strong> agregaste al inventario?
              </p>

              {/* Dividimos el espacio en dos columnas para cantidad y precio */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: theme.text, marginBottom: '8px', fontWeight: '500' }}>
                    Cantidad
                  </label>
                  <input
                    type="number" min="1" value={purchaseQuantity} onFocus={(e) => e.target.select()} onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)} required
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '18px', outline: 'none', boxSizing: 'border-box', textAlign: 'center', backgroundColor: theme.inputBg, color: theme.text }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: theme.text, marginBottom: '8px', fontWeight: '500' }}>
                    Precio Unit. ($)
                  </label>
                  <input
                    type="number" min="0" step="0.01" placeholder="Opcional" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '18px', outline: 'none', boxSizing: 'border-box', textAlign: 'center', backgroundColor: theme.inputBg, color: theme.text }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
                <button type="button" onClick={() => setShowPurchaseModal(false)} style={{ flex: 1, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', backgroundColor: 'transparent', color: theme.text, border: `1px solid ${theme.border}` }}>Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isPurchasing}
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#8b5cf6', 
                    color: 'white', 
                    border: 'none', 
                    padding: '10px 24px', 
                    borderRadius: '8px', 
                    fontWeight: '500', 
                    cursor: isPurchasing ? 'not-allowed' : 'pointer',
                    opacity: isPurchasing ? 0.7 : 1
                  }}
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
        <div style={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, maxWidth: '400px', padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, background: '#e74c3c', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* Modal de Detalles de Precios */}
      {showPriceDetails && (
        <div style={styles.modalOverlay} onClick={() => setShowPriceDetails(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', background: '#8C7AE6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📊</span>
                <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: '600' }}>Desglose de Precios</h2>
              </div>
              <button onClick={() => setShowPriceDetails(false)} style={styles.closeBtn}>✕</button>
            </div>
            
            <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {displayedProducts.map(p => {
                  const cantidadFaltante = Math.max(1, p.stock_min - p.cantidad);
                  const precioUnidad = parseFloat(p.ultimo_precio) || 0;
                  const subtotal = cantidadFaltante * precioUnidad;
                  
                  return (
                    <li key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
                      <div>
                        <span style={{ color: theme.text, fontWeight: '600', fontSize: '15px', display: 'block', marginBottom: '4px' }}>{p.nombre}</span>
                        <span style={{ color: theme.textMuted, fontSize: '13px' }}>
                          {cantidadFaltante} {cantidadFaltante === 1 ? 'unidad' : 'unidades'} a ${precioUnidad.toFixed(2)} c/u
                        </span>
                      </div>
                      <span style={{ color: theme.text, fontWeight: '700', fontSize: '15px' }}>
                        ${subtotal.toFixed(2)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: `2px dashed ${theme.border}` }}>
                <span style={{ color: theme.text, fontWeight: '700', fontSize: '16px' }}>Total Estimado</span>
                <span style={{ color: '#8C7AE6', fontWeight: '800', fontSize: '20px' }}>${estimatedTotal.toFixed(2)}</span>
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
  container: { minHeight: '100vh', transition: 'background-color 0.3s ease' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
  spinner: { width: '50px', height: '50px', border: '4px solid #e8d9eb', borderTop: '4px solid #8C7AE6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '20px', fontSize: '18px' },
  navbar: { padding: 'calc(15px + env(safe-area-inset-top)) 0 15px 0', marginBottom: '15px', position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s ease' },
  navbarContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navbarLeft: { display: 'flex', alignItems: 'center' },
  backBtn: { background: 'transparent', border: '2px solid #8C7AE6', color: '#8C7AE6', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '15px', transition: 'all 0.2s ease' },
  logo: { margin: 0, fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navbarRight: { display: 'flex', gap: '8px', alignItems: 'center' },
  themeBtn: { width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', background: 'transparent', border: 'none' },
  logoutBtn: { padding: '8px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.3s ease' },
  content: { maxWidth: '1200px', margin: '0 auto', padding: '20px 15px 40px' },
  listTitle: { margin: 0, fontSize: '24px', fontWeight: '700' },
  badge: { backgroundColor: '#8C7AE6', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 8px rgba(140, 122, 230, 0.3)' },
  productList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  productCard: { borderRadius: '16px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)' },
  productInfo: { flex: 1, minWidth: 0 },
  productHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  productName: { margin: 0, fontSize: '16px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  categoryBadge: { backgroundColor: '#F7E7FA', color: '#8C7AE6', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' },
  stockInfo: { display: 'flex', gap: '15px', marginBottom: '4px' },
  stockItem: { display: 'flex', alignItems: 'center', gap: '6px' },
  stockLabel: { fontSize: '12px', fontWeight: '500' },
  stockValue: { fontSize: '14px', fontWeight: '700' },
  notes: { fontSize: '12px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  productActions: { display: 'flex', alignItems: 'center' },
  removeBtn: { padding: '10px 14px', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' },
  exportSection: { marginTop: '40px', textAlign: 'center' },
  exportBtn: { padding: '14px 32px', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', transition: 'all 0.3s ease', boxShadow: '0 4px 16px rgba(140, 122, 230, 0.35)' },
  exportHint: { marginTop: '12px', fontSize: '13px', fontWeight: '500' },
  emptyState: { textAlign: 'center', padding: '60px 20px', borderRadius: '20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' },
  emptyIcon: { fontSize: '80px', marginBottom: '20px' },
  emptyTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '10px' },
  emptyText: { fontSize: '16px', marginBottom: '30px' },
  emptyBtn: { padding: '14px 32px', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', boxShadow: '0 4px 16px rgba(140, 122, 230, 0.3)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(45, 45, 45, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { borderRadius: '20px', width: '90%', maxWidth: '450px', maxHeight: '90vh', overflow: 'auto' },
  closeBtn: { background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.5rem', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background-color 0.2s' },
};

export default ShoppingList;