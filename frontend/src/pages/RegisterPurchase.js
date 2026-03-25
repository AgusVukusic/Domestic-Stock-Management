import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsAPI, groupsAPI } from '../services/api';

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
  // Estado para bloquear el botón mientras procesamos la compra
  const [isPurchasing, setIsPurchasing] = useState(false);
  
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
      // Obtenemos tanto los productos como los grupos en paralelo
      const [productsRes, groupsRes] = await Promise.all([
        productsAPI.getAll(),
        groupsAPI.getAll()
      ]);
      
      setProducts(productsRes.data);
      setGroups(groupsRes.data);
      
      // Leemos el mismo grupo que dejamos seleccionado en el Dashboard
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
  };

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setPurchaseQuantity(1);
    setShowModal(true);
  };

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // Bloqueamos el botón en la interfaz para evitar dobles clics
    setIsPurchasing(true);
    const toastId = toast.loading('Registrando compra...');

    try {
      // Enviamos la petición para sumar las unidades al inventario
      await productsAPI.increaseStock(selectedProduct._id, purchaseQuantity);
      
      // Verificamos si estaba en la lista de compras y, si es así, lo quitamos
      if (selectedProduct.en_lista_compras) {
        await productsAPI.removeFromShoppingList(selectedProduct._id);
      }

      // Cerramos el modal, limpiamos la selección y recargamos los datos
      setShowModal(false);
      setSelectedProduct(null);
      loadData(); 
      toast.success(`¡Se sumaron ${purchaseQuantity} unidades de ${selectedProduct.nombre}!`, { id: toastId });
    } catch (error) {
      toast.error('Error al registrar la compra', { id: toastId });
    } finally {
      // Liberamos el botón obligatoriamente, ya sea que la petición falló o tuvo éxito
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

  const filteredProducts = products.filter(product => 
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const theme = darkMode ? darkTheme : lightTheme;

  if (loading) {
    return (
      <div style={{ ...styles.loadingContainer, backgroundColor: theme.background }}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  // Filtramos los productos para mostrar solo los del grupo seleccionado
  const displayedProducts = products.filter(p => p.owner_id === activeGroup);

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
        <div style={styles.headerSection}>
          <div>
            <h2 style={{ ...styles.pageTitle, color: theme.text }}>Registrar Compra</h2>
            <p style={{ color: theme.textMuted, marginTop: '5px' }}>Busca el producto y suma stock rápidamente.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <span style={{ fontWeight: '600', color: theme.text }}>🛒 Comprando para:</span>
          <select
            value={activeGroup}
            onChange={(e) => {
              // Cambiamos el grupo actual y lo sincronizamos globalmente
              setActiveGroup(e.target.value);
              localStorage.setItem('lastActiveGroup', e.target.value);
            }}
            style={{ 
              padding: '8px 12px', borderRadius: '10px', flex: 1,
              backgroundColor: theme.inputBg, color: theme.text, 
              border: `2px solid ${theme.border}`, outline: 'none' 
            }}
          >
            {groups.map(g => (
              <option key={g._id} value={g._id}>{g.nombre}</option>
            ))}
          </select>
        </div>

          <div style={styles.searchContainer}>
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

        <div style={styles.grid}>
          {filteredProducts.length === 0 ? (
            <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, gridColumn: '1 / -1', border: `1px solid ${theme.border}` }}>
              <p style={{ color: theme.textMuted, fontSize: '1.1rem' }}>No se encontraron productos.</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product._id} style={{ ...styles.productCard, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
                <div>
                  <h3 style={{ ...styles.productName, color: theme.text }}>{product.nombre}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    <span style={styles.categoryBadge}>{product.categoria}</span>
                    <span style={{ color: theme.textMuted, fontSize: '0.9rem' }}>Stock actual: <strong>{product.cantidad}</strong></span>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenModal(product)}
                  style={styles.addBtn}
                >
                  ➕ Agregar Stock
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && selectedProduct && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={{ ...styles.modal, backgroundColor: theme.cardBg, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', backgroundColor: '#8b5cf6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📦</span>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Sumar al Inventario</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleConfirmPurchase} style={{ padding: '24px' }}>
              <p style={{ color: theme.text, marginBottom: '20px', fontSize: '1.05rem', lineHeight: '1.5' }}>
                ¿Cuántas unidades de <strong>{selectedProduct.nombre}</strong> compraste?
              </p>
              
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="number" min="1" value={purchaseQuantity} onFocus={(e) => e.target.select()} onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)} required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `2px solid ${theme.border}`, fontSize: '18px', outline: 'none', boxSizing: 'border-box', textAlign: 'center', backgroundColor: theme.inputBg, color: theme.text }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', fontWeight: '600', color: theme.text, border: `1px solid ${theme.border}` }}>Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isPurchasing}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '8px', 
                    cursor: isPurchasing ? 'not-allowed' : 'pointer', 
                    background: '#8b5cf6', 
                    color: 'white', 
                    border: 'none', 
                    fontWeight: '600',
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

const lightTheme = { background: '#F7E7FA', text: '#2D2D2D', textMuted: '#7A7A85', navbarBg: '#FFFFFF', cardBg: '#FFFFFF', inputBg: '#FFFFFF', border: '#e8d9eb', };
const darkTheme = { background: '#1a1a1a', text: '#FFFFFF', textMuted: '#9a9a9a', navbarBg: '#2D2D2D', cardBg: '#2D2D2D', inputBg: '#3a3a3a', border: '#4a4a4a', };

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
  searchContainer: { position: 'relative', width: '100%' },
  searchIcon: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' },
  searchInput: { width: '100%', padding: '12px 15px 12px 45px', borderRadius: '12px', border: '2px solid', fontSize: '16px', outline: 'none', boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
  productCard: { padding: '15px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px', transition: 'transform 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  productName: { margin: 0, fontSize: '18px', fontWeight: '600' },
  categoryBadge: { backgroundColor: '#F7E7FA', color: '#8b5cf6', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  addBtn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' },
  emptyState: { padding: '40px', textAlign: 'center', borderRadius: '16px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { width: '90%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden' },
  closeBtn: { background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' },
};

export default RegisterPurchase;