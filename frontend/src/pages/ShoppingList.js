import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';

function ShoppingList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    loadShoppingList();
    // Cargar preferencia de tema
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
      const response = await productsAPI.getShoppingList();
      setProducts(response.data);
    } catch (error) {
      console.error('Error cargando lista:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromList = async (productId) => {
    try {
      await productsAPI.removeFromShoppingList(productId);
      loadShoppingList();
    } catch (error) {
      alert('Error al actualizar la lista');
    }
  };

  const handleExport = () => {
    if (products.length === 0) {
      alert('No hay productos en la lista para exportar');
      return;
    }

    // Agrupar productos por categoría
    const groupedByCategory = products.reduce((acc, product) => {
      const category = product.categoria || 'Sin categoría';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    // Generar texto formateado
    let text = '🛒 LISTA DE COMPRAS\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';

    Object.keys(groupedByCategory).sort().forEach(category => {
      text += `📌 ${category.toUpperCase()}\n`;
      text += '─────────────────────\n';
      
      groupedByCategory[category].forEach(product => {
        text += `• ${product.nombre}\n`;
        text += `  Stock actual: ${product.cantidad} | Mínimo: ${product.stock_min}\n`;
        if (product.notas) {
          text += `  Nota: ${product.notas}\n`;
        }
        text += '\n';
      });
      
      text += '\n';
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Total: ${products.length} ${products.length === 1 ? 'producto' : 'productos'}\n`;
    text += `Generado: ${new Date().toLocaleDateString('es-AR')}\n`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(text).then(() => {
      alert('✓ Lista copiada al portapapeles!\nPuedes pegarla en WhatsApp, notas o donde quieras.');
    }).catch(() => {
      // Fallback: crear textarea temporal
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('✓ Lista copiada al portapapeles!');
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

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
      {/* Navbar */}
      <nav style={{ ...styles.navbar, backgroundColor: theme.navbarBg, borderBottom: `1px solid ${theme.border}` }}>
        <div style={styles.navbarContent}>
          <div style={styles.navbarLeft}>
            <button onClick={() => navigate('/dashboard')} style={{ ...styles.backBtn, backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.border}` }}>
              ← Volver
            </button>
            <h1 style={{ ...styles.logo, color: theme.text }}>🛒 Lista de Compras</h1>
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

      {/* Content */}
      <div style={styles.content}>
        {products.length === 0 ? (
          <div style={{ ...styles.emptyState, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
            <div style={styles.emptyIcon}>🛒</div>
            <h2 style={{ ...styles.emptyTitle, color: theme.text }}>Tu lista está vacía</h2>
            <p style={{ ...styles.emptyText, color: theme.textMuted }}>
              Agrega productos a tu lista de compras desde el dashboard
            </p>
            <button onClick={() => navigate('/dashboard')} style={styles.emptyBtn}>
              Ir al Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Header Info */}
            <div style={styles.headerInfo}>
              <h2 style={{ ...styles.listTitle, color: theme.text }}>Productos para comprar</h2>
              <div style={styles.badge}>{products.length} {products.length === 1 ? 'producto' : 'productos'}</div>
            </div>

            {/* Products List */}
            <div style={styles.productList}>
              {products.map((product) => (
                <div key={product._id} style={{ ...styles.productCard, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
                  <div style={styles.productInfo}>
                    <div style={styles.productHeader}>
                      <h3 style={{ ...styles.productName, color: theme.text }}>{product.nombre}</h3>
                      <span style={styles.categoryBadge}>{product.categoria}</span>
                    </div>
                    
                    <div style={styles.stockInfo}>
                      <div style={styles.stockItem}>
                        <span style={{ ...styles.stockLabel, color: theme.textMuted }}>Stock actual:</span>
                        <span style={{
                          ...styles.stockValue,
                          color: product.cantidad <= product.stock_min ? '#dc3545' : '#8C7AE6'
                        }}>
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
                    <button
                      onClick={() => handleRemoveFromList(product._id)}
                      style={styles.removeBtn}
                    >
                      ✓ Comprado
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Export Button */}
            <div style={styles.exportSection}>
              <button onClick={handleExport} style={styles.exportBtn}>
                📤 Exportar Lista
              </button>
              <p style={{ ...styles.exportHint, color: theme.textMuted }}>
                Copia la lista para enviarla por WhatsApp o guardarla en notas
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Temas
const lightTheme = {
  background: '#F7E7FA',
  text: '#2D2D2D',
  textMuted: '#7A7A85',
  navbarBg: '#FFFFFF',
  cardBg: '#FFFFFF',
  inputBg: '#F7E7FA',
  border: '#e8d9eb',
};

const darkTheme = {
  background: '#1a1a1a',
  text: '#FFFFFF',
  textMuted: '#9a9a9a',
  navbarBg: '#2D2D2D',
  cardBg: '#2D2D2D',
  inputBg: '#3a3a3a',
  border: '#4a4a4a',
};

const styles = {
  container: {
    minHeight: '100vh',
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
    transition: 'all 0.3s ease',
  },
  navbarContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  logo: {
    margin: 0,
    fontSize: '22px',
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
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  headerInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  listTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#8C7AE6',
    color: 'white',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(140, 122, 230, 0.3)',
  },
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  productCard: {
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.3s ease',
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px',
  },
  productName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#F7E7FA',
    color: '#8C7AE6',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  stockInfo: {
    display: 'flex',
    gap: '30px',
    marginBottom: '10px',
  },
  stockItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stockLabel: {
    fontSize: '14px',
    fontWeight: '500',
  },
  stockValue: {
    fontSize: '18px',
    fontWeight: '700',
  },
  notes: {
    fontSize: '13px',
    marginTop: '8px',
  },
  notesLabel: {
    fontWeight: '600',
  },
  productActions: {
    display: 'flex',
    alignItems: 'center',
  },
  removeBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)',
    whiteSpace: 'nowrap',
  },
  exportSection: {
    marginTop: '40px',
    textAlign: 'center',
  },
  exportBtn: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(140, 122, 230, 0.35)',
  },
  exportHint: {
    marginTop: '12px',
    fontSize: '13px',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  },
  emptyIcon: {
    fontSize: '80px',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '10px',
  },
  emptyText: {
    fontSize: '16px',
    marginBottom: '30px',
  },
  emptyBtn: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    boxShadow: '0 4px 16px rgba(140, 122, 230, 0.3)',
  },
};

export default ShoppingList;