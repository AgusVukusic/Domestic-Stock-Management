import React, { useState, useEffect } from 'react';
import { Package, X, ScanBarcode, Edit2 } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

const ProductFormModal = ({ isOpen, onClose, onSubmit, initialData, groups, activeGroup, isEditing }) => {
  const [formData, setFormData] = useState({
    nombre: '', cantidad: 0, categoria: '', stock_min: 0, notas: '', owner_id: activeGroup, codigo_barras: '', ultimo_precio: ''
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({ nombre: '', cantidad: 0, categoria: '', stock_min: 0, notas: '', owner_id: activeGroup, codigo_barras: '', ultimo_precio: '' });
    }
  }, [initialData, activeGroup, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  const groupCategories = []; // Passed as prop ideally, but left empty for simplicity unless passed

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? <><Edit2 size={24} /> Editar Producto</> : <><Package size={24} /> Nuevo Producto</>}</h2>
          <button onClick={onClose} className="modal-close"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Nombre del producto</label>
            <input type="text" className="form-input" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required placeholder="Ej: Jabón Dove" />
          </div>

          {!isEditing && groups && (
            <div className="form-group">
              <label className="form-label">Grupo asignado</label>
              <select className="form-input custom-select" value={formData.owner_id || activeGroup} onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })} required>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>{group.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{isEditing ? 'Stock actual' : 'Cantidad'}</label>
              <input type="number" min="0" className="form-input" value={formData.cantidad} onFocus={(e) => e.target.select()} onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })} required placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Stock mínimo</label>
              <input type="number" min="0" className="form-input" value={formData.stock_min} onFocus={(e) => e.target.select()} onChange={(e) => setFormData({ ...formData, stock_min: parseInt(e.target.value) || 0 })} required placeholder="0" />
            </div>
            {isEditing && (
              <div className="form-group">
                <label className="form-label">Precio Unit. ($)</label>
                <input type="number" step="0.01" min="0" className="form-input" value={formData.ultimo_precio || ''} onFocus={(e) => e.target.select()} onChange={(e) => setFormData({ ...formData, ultimo_precio: e.target.value })} placeholder="Opcional" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Categoría</label>
            <input type="text" className="form-input" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value.toLowerCase() })} required placeholder="Ej: limpieza, alimentos" />
          </div>

          <div className="form-group">
            <label className="form-label">Notas (opcional)</label>
            <textarea className="form-input" value={formData.notas || ''} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Detalles..." />
          </div>

          <div className="form-group">
            <label className="form-label">Código de Barras (opcional)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" className="form-input" value={formData.codigo_barras || ''} onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })} placeholder="Ej: 779123456789" />
              <button type="button" onClick={() => setShowBarcodeScanner(true)} className="btn btn-secondary">
                <ScanBarcode size={20} />
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar Producto')}
            </button>
          </div>
        </form>
      </div>

      {showBarcodeScanner && <BarcodeScanner onScan={(code) => { setFormData({...formData, codigo_barras: code}); setShowBarcodeScanner(false); }} onClose={() => setShowBarcodeScanner(false)} />}
    </div>
  );
};

export default ProductFormModal;
