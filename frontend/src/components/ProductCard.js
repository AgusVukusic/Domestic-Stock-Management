import React from 'react';
import { Edit2, Trash2, Minus, Check, ShoppingCart } from 'lucide-react';

const ProductCard = ({ product, onDecrease, onToggleShoppingList, onEdit, onDelete, processingListId }) => {
  const getAlertClass = (cantidad, stock_min) => {
    if (cantidad === 0) return 'danger';
    if (cantidad <= stock_min) return 'warning';
    return '';
  };

  return (
    <div className="card card-hover product-card">
      <div className="card-info">
        <div className="card-header-row">
          <h5 className="card-header-title">{product.nombre}</h5>
          {product.cantidad <= product.stock_min && (
            <div className={`alert-dot ${getAlertClass(product.cantidad, product.stock_min)}`} title={product.cantidad === 0 ? 'Sin stock' : 'Stock bajo'} />
          )}
        </div>
        
        <div className="card-meta-row">
          <span className="category-badge">{product.categoria}</span>
          <span className="stock-badge" style={{ backgroundColor: product.cantidad === 0 ? 'var(--danger)' : product.cantidad <= product.stock_min ? 'var(--warning)' : 'var(--primary-light)', color: product.cantidad === 0 ? 'white' : 'inherit' }}>
            Stock: {product.cantidad}
          </span>
        </div>

        {product.notas && (
          <div className="notes">{product.notas}</div>
        )}
      </div>

      <div className="card-actions">
        <button 
          onClick={() => onDecrease(product._id, product.nombre)} 
          disabled={product.cantidad === 0} 
          className="btn-icon"
          style={{ background: 'var(--primary)', color: 'white', opacity: product.cantidad === 0 ? 0.5 : 1 }}
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={() => onToggleShoppingList(product)} 
          disabled={processingListId === product._id}
          className="btn-icon"
          style={{ 
            backgroundColor: product.en_lista_compras ? 'var(--primary-light)' : 'var(--input-bg)',
            opacity: processingListId === product._id ? 0.5 : 1
          }}
        >
          {product.en_lista_compras ? <Check size={16} /> : <ShoppingCart size={16} />}
        </button>
        <button onClick={() => onEdit(product)} className="btn-icon">
          <Edit2 size={16} />
        </button>
        <button onClick={() => onDelete(product._id)} className="btn-icon" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
