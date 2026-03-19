import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

function RegisterPurchase() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Estados para el modal
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    loadAllProducts();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const loadAllProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error cargando productos:', error);
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

    try {
      await productsAPI.increaseStock(selectedProduct._id, purchaseQuantity);
      
      // Si por casualidad estaba en la lista de compras, lo quitamos también
      if (selectedProduct.en_lista_compras) {
        await productsAPI.removeFromShoppingList(selectedProduct._id);
      }

      setShowModal(false);
      setSelectedProduct(null);
      loadAllProducts(); // Recargar para ver el stock actualizado
      
      // Pequeño feedback visual (opcional)
      toast.success(`¡Se sumaron ${purchaseQuantity} unidades de ${selectedProduct.nombre}!`);
    } catch (error) {
      toast.error('Error al registrar la compra');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Filtrar productos por la búsqueda
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

  return (
    <div style={{ ...styles.container, backgroundColor: theme.background }}>
      {/* Navbar */}
      <nav style={{ ...styles.navbar, backgroundColor: theme.navbarBg, borderBottom: `1px solid ${theme.border}` }}>
        <div style={styles.navbarContent}>
          <div style={styles.navbarLeft}>
            <button onClick={() => navigate('/dashboard')} style={{ ...styles.backBtn, backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.border}` }}>
              ← Volver
            </button>
            <h1 style={{ ...styles.logo, color: theme.text }}>🛍️ Compra Rápida</h1>
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

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.headerSection}>
          <div>
            <h2 style={{ ...styles.pageTitle, color: theme.text }}>Registrar Compra</h2>
            <p style={{ color: theme.textMuted, marginTop: '5px' }}>Busca el producto que compraste y suma stock rápidamente.</p>
          </div>
          
          {/* Buscador */}
          <div style={styles.searchContainer}>
            <span style={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Buscar producto o categoría..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...styles.searchInput, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
            />
          </div>
        </div>

        <div style={styles.grid}>
          {filteredProducts.length === 0 ? (
            <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, gridColumn: '1 / -1', border: `1px solid ${theme.border}` }}>
              <p style={{ color: theme.textMuted, fontSize: '1.1rem' }}>No se encontraron productos con esa búsqueda.</p>
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

      {/* Modal de Registro de Compra */}
      {showModal && selectedProduct && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div 
            style={{ 
              ...styles.modal, 
              backgroundColor: theme.cardBg,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ ...styles.modalHeader, backgroundColor: '#8b5cf6' }}>
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
                  type="number"
                  min="1"
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)}
                  required
                  style={{ ...styles.qtyInput, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...styles.cancelBtn, color: theme.text, border: `1px solid ${theme.border}` }}>
                  Cancelar
                </button>
                <button type="submit" style={styles.submitBtn}>
                  Confirmar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos y Temas
const lightTheme = {
  background: '#F7E7FA', text: '#2D2D2D', textMuted: '#7A7A85',
  navbarBg: '#FFFFFF', cardBg: '#FFFFFF', inputBg: '#FFFFFF', border: '#e8d9eb',
};
const darkTheme = {
  background: '#1a1a1a', text: '#FFFFFF', textMuted: '#9a9a9a',
  navbarBg: '#2D2D2D', cardBg: '#2D2D2D', inputBg: '#3a3a3a', border: '#4a4a4a',
};

const styles = {
  container: { minHeight: '100vh', transition: 'background-color 0.3s' },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  spinner: { width: '50px', height: '50px', border: '4px solid #e8d9eb', borderTop: '4px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  navbar: { padding: '15px 0' },
  navbarContent: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navbarLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
  navbarRight: { display: 'flex', gap: '15px', alignItems: 'center' },
  logo: { margin: 0, fontSize: '22px', fontWeight: '700' },
  backBtn: { padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', border: 'none' },
  themeBtn: { width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', border: 'none' },
  logoutBtn: { padding: '8px 20px', background: '#C7C8F4', color: '#2D2D2D', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
  username: { fontWeight: '500' },
  content: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  pageTitle: { margin: 0, fontSize: '28px', fontWeight: '700' },
  searchContainer: { position: 'relative', width: '100%', maxWidth: '400px' },
  searchIcon: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' },
  searchInput: { width: '100%', padding: '12px 15px 12px 45px', borderRadius: '12px', border: '2px solid', fontSize: '16px', outline: 'none', boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  productCard: { padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px', transition: 'transform 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  productName: { margin: 0, fontSize: '18px', fontWeight: '600' },
  categoryBadge: { backgroundColor: '#F7E7FA', color: '#8b5cf6', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  addBtn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' },
  emptyState: { padding: '40px', textAlign: 'center', borderRadius: '16px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { width: '90%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden' },
  modalHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' },
  qtyInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid', fontSize: '18px', outline: 'none', boxSizing: 'border-box', textAlign: 'center' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', fontWeight: '600' },
  submitBtn: { flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', background: '#8b5cf6', color: 'white', border: 'none', fontWeight: '600' }
};

export default RegisterPurchase;