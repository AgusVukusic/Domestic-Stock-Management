import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, ShoppingCart, ClipboardList, Search, ScanBarcode } from 'lucide-react';
import './Dashboard.css';

import { useGroupContext } from '../context/GroupContext';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import ProductFormModal from '../components/ProductFormModal';
import BarcodeScanner from '../components/BarcodeScanner';

function Dashboard() {
  const navigate = useNavigate();
  const { groups, activeGroup, changeActiveGroup, loading: groupsLoading } = useGroupContext();
  const { products, loading: productsLoading, fetchProducts, createProduct, updateProduct, deleteProduct, decreaseStock, toggleShoppingList } = useProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [processingListId, setProcessingListId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateSubmit = async (formData) => {
    try {
      await createProduct({ ...formData, owner_type: 'group' });
      setShowModal(false);
      toast.success('¡Producto agregado al inventario!');
    } catch (error) {
      toast.error('Error al crear producto');
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      await updateProduct(formData._id, formData);
      setEditingProduct(null);
      toast.success('Producto actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el producto');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este producto de forma permanente?')) {
      try {
        await deleteProduct(id);
        toast.success('Producto eliminado correctamente');
      } catch (error) {
        toast.error('No se pudo eliminar el producto');
      }
    }
  };

  const handleBarcodeScan = async (decodedText) => {
    setShowBarcodeScanner(false);
    const foundProduct = products.find(p => p.codigo_barras === decodedText);
    if (foundProduct) {
      setSearchTerm(foundProduct.nombre);
      toast.success('Producto encontrado');
    } else {
      toast.error('Producto no encontrado');
    }
  };

  if (groupsLoading || productsLoading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

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

  displayedProducts.sort((a, b) => {
    if (sortBy === 'name-asc') return a.nombre.localeCompare(b.nombre);
    if (sortBy === 'name-desc') return b.nombre.localeCompare(a.nombre);
    if (sortBy === 'stock-asc') return a.cantidad - b.cantidad;
    if (sortBy === 'stock-desc') return b.cantidad - a.cantidad;
    return 0;
  });

  return (
    <div className="page-container">
      <div className="dashboard-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>Inventario</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>Mantén tu hogar organizado y abastecido</p>
        </div>
        
        {groups.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--card-bg)', padding: '8px 12px', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>GRUPO:</span>
            <select value={activeGroup} onChange={(e) => changeActiveGroup(e.target.value)} style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
              {groups.map(g => <option key={g._id} value={g._id}>{g.nombre}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: 'var(--spacing-xl)' }}>
        <button onClick={() => { groups.length === 0 ? navigate('/groups') : setShowModal(true); }} className="btn btn-primary" style={{ padding: '12px 18px', borderRadius: 'var(--radius-full)', flex: '1 1 auto' }}>
          <Plus size={18} /> <span>Nuevo Producto</span>
        </button>
        <button onClick={() => navigate('/register-purchase')} className="btn btn-secondary" style={{ padding: '12px 18px', borderRadius: 'var(--radius-full)', flex: '1 1 auto' }}>
          <ShoppingCart size={18} /> <span>Ingresar Stock</span>
        </button>
        <button onClick={() => navigate('/shopping-list')} className="btn btn-secondary" style={{ padding: '12px 18px', borderRadius: 'var(--radius-full)', flex: '1 1 auto' }}>
          <ClipboardList size={18} /> <span>Lista Compras</span>
        </button>
      </div>

      {groups.length > 0 && products.filter(p => p.owner_id === activeGroup).length > 0 && (
        <div className="glass-panel" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-xl)', display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><Search size={18} /></span>
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input" style={{ paddingLeft: '45px', borderRadius: 'var(--radius-full)' }} />
            </div>
            <button onClick={() => setShowBarcodeScanner(true)} className="btn-icon" style={{ borderRadius: 'var(--radius-full)' }}><ScanBarcode size={20} /></button>
          </div>

          <div style={{ display: 'flex', gap: '10px', flex: '1 1 200px' }}>
            <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="form-input" style={{ borderRadius: 'var(--radius-full)', flex: 1 }}>
              <option value="">Todas las categorías</option>
              {groupCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-input" style={{ borderRadius: 'var(--radius-full)', flex: 1 }}>
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
            <h3 className="empty-title">No tienes grupos familiares</h3>
            <button onClick={() => navigate('/groups')} className="btn btn-primary">Crear mi primer grupo</button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-title">Inventario vacío o sin resultados</h3>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">Agregar Producto</button>
          </div>
        ) : (
          displayedProducts.map((product) => (
            <ProductCard 
              key={product._id} 
              product={product} 
              onDecrease={decreaseStock} 
              onToggleShoppingList={toggleShoppingList} 
              onEdit={setEditingProduct} 
              onDelete={handleDelete} 
              processingListId={processingListId} 
            />
          ))
        )}
      </div>
      
      {showModal && <ProductFormModal isOpen={true} onClose={() => setShowModal(false)} onSubmit={handleCreateSubmit} groups={groups} activeGroup={activeGroup} isEditing={false} />}
      {editingProduct && <ProductFormModal isOpen={true} onClose={() => setEditingProduct(null)} onSubmit={handleEditSubmit} initialData={editingProduct} groups={groups} activeGroup={activeGroup} isEditing={true} />}
      {showBarcodeScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowBarcodeScanner(false)} />}
    </div>
  );
}

export default Dashboard;