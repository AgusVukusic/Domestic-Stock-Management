import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { productsAPI, groupsAPI } from '../services/api';
import { Package, Plus, ScanBarcode, Camera, Search, Users, X } from 'lucide-react';
import './RegisterPurchase.css';
import BarcodeScanner from '../components/BarcodeScanner';

function RegisterPurchase() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState('');
  
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
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

  // Themes and Logout are handled by Navigation.js

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



  const handleBarcodeScan = async (decodedText) => {
    setShowBarcodeScanner(false);
    try {
      const res = await productsAPI.getByBarcode(decodedText);
      if (res.data) {
        handleOpenModal(res.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Producto no encontrado. Agrégalo desde el Dashboard primero.');
      } else {
        toast.error('Error al buscar código de barras');
      }
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Analizando ticket con IA...');
    setIsScanningReceipt(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await productsAPI.scanReceipt(formData);
      const items = res.data.items;
      
      if (items && items.length > 0) {
        toast.success(`Se detectaron ${items.length} productos!`, { id: toastId });
        console.log("Items detectados: ", items);
        // Implementación futura: Mostrar listado para confirmar.
      } else {
        toast.error('No se detectaron productos en el ticket.', { id: toastId });
      }
    } catch (error) {
      toast.error('Error al analizar el ticket. Revisa la foto o la API Key.', { id: toastId });
    } finally {
      setIsScanningReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    <div className="page-container animate-slide-up">
      <div className="content-wrapper animate-fade-in" style={{ maxWidth: '1200px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 'var(--spacing-xl)', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>Registrar Compra</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Busca el producto, escanea o toma una foto del ticket para sumar stock rápidamente.</p>
          </div>
          
          <div className="glass-panel" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Users size={16} /> Grupo:
                </span>
                <select
                  value={activeGroup}
                  onChange={(e) => {
                    setActiveGroup(e.target.value);
                    localStorage.setItem('lastActiveGroup', e.target.value);
                  }}
                  className="form-input"
                  style={{ borderRadius: 'var(--radius-full)', flex: 1, padding: '10px 14px', maxWidth: '65%' }}
                >
                  {groups.map(g => (
                    <option key={g._id} value={g._id}>{g.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                    <Search size={18} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Buscar producto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '40px', paddingRight: '40px', borderRadius: 'var(--radius-full)', width: '100%' }}
                  />
                  <button 
                    onClick={() => setShowBarcodeScanner(true)} 
                    style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'var(--card-bg)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                    title="Escanear Código"
                  >
                    <ScanBarcode size={18} />
                  </button>
                </div>
              </div>

              <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary" title="Escanear Ticket" disabled={isScanningReceipt} style={{ borderRadius: 'var(--radius-full)', width: '100%', padding: '14px' }}>
                <Camera size={20} /> <span style={{ marginLeft: '8px' }}>{isScanningReceipt ? 'Procesando...' : 'Escanear Ticket Inteligente'}</span>
                <input type="file" ref={fileInputRef} onChange={handleReceiptUpload} accept="image/*" style={{ display: 'none' }} />
              </button>
            </div>
          </div>
        </div>

        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {displayedProducts.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No se encontraron productos.</p>
            </div>
          ) : (
            displayedProducts.map(product => (
              <div key={product._id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{product.nombre}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span className="category-badge">{product.categoria}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Stock actual: <strong>{product.cantidad}</strong></span>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenModal(product)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px' }}
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



      {showBarcodeScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowBarcodeScanner(false)} />}
    </div>
  );
}

export default RegisterPurchase;