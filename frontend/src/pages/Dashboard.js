import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad: 0,
    categoria: '',
    stock_min: 0,
    notas: '',
  });
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    loadProducts();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const loadProducts = async () => {
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.create(formData);
      setShowModal(false);
      setFormData({ nombre: '', cantidad: 0, categoria: '', stock_min: 0, notas: '' });
      loadProducts();
    } catch (error) {
      alert('Error al crear producto');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este producto?')) {
      try {
        await productsAPI.delete(id);
        loadProducts();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const handleDecrease = async (id) => {
    try {
      await productsAPI.decreaseStock(id, 1);
      loadProducts();
    } catch (error) {
      alert('Error al decrementar stock');
    }
  };

  const toggleShoppingList = async (product) => {
    try {
      if (product.en_lista_compras) {
        await productsAPI.removeFromShoppingList(product._id);
      } else {
        await productsAPI.addToShoppingList(product._id);
      }
      loadProducts();
    } catch (error) {
      alert('Error al actualizar lista de compras');
    }
  };

  const getStockBadgeStyle = (cantidad, stock_min) => {
    if (cantidad === 0) {
      return { backgroundColor: '#dc3545', color: 'white' };
    } else if (cantidad <= stock_min) {
      return { backgroundColor: '#ffc107', color: '#2D2D2D' };
    } else if (cantidad <= stock_min * 2) {
      return { backgroundColor: '#C7C8F4', color: '#2D2D2D' };
    } else {
      return { backgroundColor: '#8C7AE6', color: 'white' };
    }
  };

  const theme = darkMode ? darkTheme : lightTheme;

  if (loading) {
    return (
      <div style={{ ...styles.loadingContainer, backgroundColor: theme.background }}>
        <div style={styles.spinner}></div>
        <p style={{ ...styles.loadingText, color: theme.text }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, backgroundColor: theme.background }}>
      {/* Navbar */}
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
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Actions Card */}
      <div style={styles.actionsContainer}>
        <div style={{ ...styles.actionsCard, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
          <button onClick={() => setShowModal(true)} style={styles.primaryActionBtn}>
            <span style={styles.btnIcon}>➕</span>
            Nuevo Producto
          </button>
          <button onClick={() => navigate('/register-purchase')} style={{ ...styles.secondaryActionBtn, backgroundColor: theme.cardBg, color: theme.text, border: `2px solid ${theme.border}` }}>
            <span style={styles.btnIcon}>🛒</span>
            Registrar Compra
          </button>
          <button onClick={() => navigate('/shopping-list')} style={styles.successActionBtn}>
            <span style={styles.btnIcon}>📋</span>
            Lista de Compras
            <span style={styles.badge}>{products.filter(p => p.en_lista_compras).length}</span>
          </button>
        </div>
      </div>

      {/* Products Title */}
      <h4 style={{ ...styles.sectionTitle, color: theme.textMuted, borderBottom: `2px solid ${theme.border}` }}>
        Inventario Actual
      </h4>

      {/* Products Grid */}
      <div style={styles.productGrid}>
        {products.length === 0 ? (
          <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
            <div style={styles.emptyIcon}>📦</div>
            <h3 style={{ ...styles.emptyTitle, color: theme.text }}>No hay productos</h3>
            <p style={{ ...styles.emptyText, color: theme.textMuted }}>¡Agrega tu primer producto para comenzar!</p>
            <button onClick={() => setShowModal(true)} style={styles.emptyBtn}>
              Agregar Producto
            </button>
          </div>
        ) : (
          products.map((product) => (
            <div key={product._id} style={{ ...styles.card, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }} className="product-card">
              {/* Card Header */}
              <div style={styles.cardHeaderGradient}>
                <h5 style={styles.cardHeaderTitle}>{product.nombre}</h5>
                <span style={styles.categoryBadge}>{product.categoria}</span>
              </div>

            <div style={styles.cardBody}>
                {/* Stock Info */}
                <div style={styles.stockGrid}>
                  <div style={styles.stockItem}>
                    <span style={{ ...styles.stockLabel, color: theme.textMuted }}>Stock Actual</span>
                    <span 
                      style={{
                        ...styles.stockBadge,
                        ...getStockBadgeStyle(product.cantidad, product.stock_min)
                      }}
                    >
                      {product.cantidad}
                    </span>
                  </div>
                </div>

                {/* Alert Box */}
                {product.cantidad <= product.stock_min && (
                  <div style={{
                    ...styles.alertBox,
                    ...(product.cantidad === 0 ? styles.alertBoxDanger : {})
                  }}>
                    ⚠️ {product.cantidad === 0 ? 'Sin stock' : 'Stock bajo'}
                  </div>
                )}

                {/* Notes */}
                {product.notas && (
                  <div style={{ ...styles.notes, color: theme.textMuted }}>
                    <span style={{ ...styles.notesLabel, color: theme.text }}>Notas:</span> {product.notas}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={styles.cardActions}>
                <button
                  onClick={() => handleDecrease(product._id)}
                  disabled={product.cantidad === 0}
                  style={{
                    ...styles.actionBtn,
                    ...styles.actionBtnUse,
                    opacity: product.cantidad === 0 ? 0.5 : 1,
                    cursor: product.cantidad === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ➖ Usar
                </button>
                <button
                  onClick={() => toggleShoppingList(product)}
                  style={{
                    ...styles.actionBtn,
                    ...(product.en_lista_compras ? styles.actionBtnInList : { ...styles.actionBtnAddList, backgroundColor: theme.inputBg, color: theme.text, border: `2px solid ${theme.border}` })
                  }}
                >
                  {product.en_lista_compras ? '✓' : '🛒'}
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  style={{ ...styles.actionBtn, ...styles.actionBtnDelete }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
    {/* Modal */}
    {showModal && (
    <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
        <div 
        style={{ 
            ...styles.modal, 
            backgroundColor: theme.cardBg,
            padding: 0,
            overflow: 'hidden',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }} 
        onClick={(e) => e.stopPropagation()}
        >
        {/* Nueva Cabecera Violeta */}
        <div 
            style={{ 
            ...styles.modalHeader, 
            backgroundColor: '#8b5cf6',
            padding: '20px 24px',
            margin: 0,
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <h2 style={{ ...styles.modalTitle, color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                Nuevo Producto
            </h2>
            </div>
            <button 
            onClick={() => setShowModal(false)} 
            style={{ 
                ...styles.closeBtn, 
                color: 'rgba(255, 255, 255, 0.7)',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
            ✕
            </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} style={{ ...styles.modalForm, padding: '24px' }}>
            
            <style>
            {`
                .custom-input {
                width: 100%;
                padding: 10px 12px;
                border-radius: 8px;
                border-width: 1px;
                border-style: solid;
                font-size: 1rem;
                transition: border-color 0.2s, box-shadow 0.2s;
                box-sizing: border-box;
                }
                .custom-input:focus {
                outline: none;
                border-color: #8b5cf6;
                box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
                }
            `}
            </style>

            <div style={{...styles.formGroup, marginBottom: '20px'}}>
            <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Nombre del producto</label>
            <input
                type="text"
                className="custom-input"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                placeholder="Ej: Jabón Dove"
            />
            </div>

            <div style={{ ...styles.formRow, display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{...styles.formGroup, flex: 1}}>
                <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Cantidad</label>
                <input
                type="number"
                className="custom-input"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                required
                style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                placeholder="0"
                />
            </div>

            <div style={{...styles.formGroup, flex: 1}}>
                <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Stock mínimo</label>
                <input
                type="number"
                className="custom-input"
                value={formData.stock_min}
                onChange={(e) => setFormData({ ...formData, stock_min: parseInt(e.target.value) || 0 })}
                required
                style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                placeholder="0"
                />
            </div>
            </div>

            <div style={{...styles.formGroup, marginBottom: '20px'}}>
            <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Categoría</label>
            <input
                type="text"
                className="custom-input"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                required
                style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                placeholder="Ej: limpieza, alimentos, bebidas"
            />
            </div>

            <div style={{...styles.formGroup, marginBottom: '24px'}}>
            <label style={{ ...styles.label, color: theme.text, display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Notas (opcional)</label>
            <textarea
                className="custom-input"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, minHeight: '100px', resize: 'vertical' }}
                placeholder="Detalles adicionales..."
            />
            </div>

            <div style={{ ...styles.modalActions, display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
            <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ 
                ...styles.cancelBtn, 
                backgroundColor: theme.cancelBtnBg || 'transparent', 
                color: theme.text, 
                border: `1px solid ${theme.border}`,
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.cancelBtnBg || 'transparent'}
            >
                Cancelar
            </button>
            <button 
                type="submit" 
                style={{ 
                ...styles.submitBtn,
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)',
                transition: 'background-color 0.2s, transform 0.1s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                Guardar Producto
            </button>
            </div>
        </form>
        </div>
    </div>
    )}
    
    </div> /* <-- AQUÍ ESTÁ EL DIV QUE FALTABA CERRAR */
  );
}

const lightTheme = {
  background: '#F7E7FA',
  text: '#2D2D2D',
  textMuted: '#7A7A85',
  navbarBg: '#FFFFFF',
  cardBg: '#FFFFFF',
  inputBg: '#FFFFFF',
  border: '#e8d9eb',
  cancelBtnBg: '#F7E7FA',
};

const darkTheme = {
  background: '#1a1a1a',
  text: '#FFFFFF',
  textMuted: '#9a9a9a',
  navbarBg: '#2D2D2D',
  cardBg: '#2D2D2D',
  inputBg: '#3a3a3a',
  border: '#4a4a4a',
  cancelBtnBg: '#3a3a3a',
};

const styles = {
  container: {
    minHeight: '100vh',
    paddingBottom: '40px',
    transition: 'background-color 0.3s ease',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e8d9eb',
    borderTop: '4px solid #8C7AE6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    fontSize: '18px',
  },
  navbar: {
    padding: '15px 0',
    marginBottom: '30px',
    transition: 'all 0.3s ease',
  },
  navbarContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navbarLeft: {},
  logo: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
  },
  navbarRight: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  themeBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  username: {
    fontSize: '15px',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: '8px 20px',
    background: '#C7C8F4',
    color: '#2D2D2D',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(199, 200, 244, 0.3)',
  },
  actionsContainer: {
    maxWidth: '1400px',
    margin: '0 auto 40px',
    padding: '0 20px',
  },
  actionsCard: {
    padding: '20px',
    borderRadius: '16px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.3s ease',
  },
  primaryActionBtn: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)',
    transition: 'all 0.3s ease',
  },
  secondaryActionBtn: {
    padding: '12px 28px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  successActionBtn: {
    padding: '12px 28px',
    background: '#8C7AE6',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)',
    transition: 'all 0.3s ease',
  },
  btnIcon: {
    fontSize: '18px',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    marginLeft: '4px',
  },
  sectionTitle: {
    maxWidth: '1400px',
    margin: '0 auto 25px',
    padding: '0 20px 15px',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    fontWeight: '600',
  },
  productGrid: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.3s ease',
  },
  cardHeaderGradient: {
    background: 'linear-gradient(135deg, #8C7AE6 0%, #C7C8F4 100%)',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    margin: 0,
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
    backdropFilter: 'blur(10px)',
  },
  cardBody: {
    padding: '20px',
  },
  stockGrid: {
    display: 'flex',
    marginBottom: '15px',
  },
  stockItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  stockLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  stockBadge: {
    fontSize: '24px',
    fontWeight: '700',
    padding: '8px 16px',
    borderRadius: '10px',
    display: 'inline-block',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  stockValue: {
    fontSize: '24px',
    fontWeight: '700',
  },
  alertBox: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '10px 15px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '10px',
    border: '1px solid #ffeeba',
  },
  alertBoxDanger: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #ef9a9a',
  },
  notes: {
    fontSize: '13px',
    lineHeight: '1.6',
    marginTop: '10px',
  },
  notesLabel: {
    fontWeight: '600',
  },
  cardActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 60px 60px',
    gap: '10px',
    padding: '0 20px 20px',
  },
  actionBtn: {
    padding: '10px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  },
  actionBtnUse: {
    background: '#8C7AE6',
    color: 'white',
  },
  actionBtnAddList: {
    backgroundColor: '#F7E7FA',
    color: '#2D2D2D',
  },
  actionBtnInList: {
    background: '#C7C8F4',
    color: '#2D2D2D',
  },
  actionBtnDelete: {
    background: '#e74c3c',
    color: 'white',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px 20px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  },
  emptyIcon: {
    fontSize: '80px',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '24px',
    marginBottom: '10px',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: '16px',
    marginBottom: '30px',
  },
  emptyBtn: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(45, 45, 45, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    borderRadius: '20px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(140, 122, 230, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '25px 30px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  modalForm: {
    padding: '0 30px 30px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '30px',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  submitBtn: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)',
  },
};

export default Dashboard;