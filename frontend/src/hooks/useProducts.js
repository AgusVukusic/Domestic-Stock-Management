import { useState, useCallback } from 'react';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll();
      setProducts(res.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = async (productData) => {
    try {
      await productsAPI.create(productData);
      await fetchProducts();
      return true;
    } catch (error) {
      throw error;
    }
  };

  const updateProduct = async (id, updateData) => {
    try {
      await productsAPI.update(id, updateData);
      await fetchProducts();
      return true;
    } catch (error) {
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productsAPI.delete(id);
      await fetchProducts();
      return true;
    } catch (error) {
      throw error;
    }
  };

  const decreaseStock = async (id, currentAmount) => {
    // Optimistic update
    setProducts(prev => prev.map(p => p._id === id ? { ...p, cantidad: Math.max(0, p.cantidad - 1) } : p));
    try {
      await productsAPI.decreaseStock(id, 1);
      // Silent sync
      productsAPI.getAll().then(res => setProducts(res.data)).catch(() => {});
    } catch (error) {
      // Revert on error
      toast.error('Error al descontar stock');
      fetchProducts();
    }
  };

  const toggleShoppingList = async (product) => {
    const isAdding = !product.en_lista_compras;
    // Optimistic update
    setProducts(prev => prev.map(p => p._id === product._id ? { ...p, en_lista_compras: isAdding } : p));
    
    try {
      if (isAdding) {
        await productsAPI.addToShoppingList(product._id);
        toast.success(`Agregado a la lista de compras`, { duration: 2000 });
      } else {
        await productsAPI.removeFromShoppingList(product._id);
      }
      productsAPI.getAll().then(res => setProducts(res.data)).catch(() => {});
    } catch (error) {
      toast.error('Error al actualizar la lista de compras');
      fetchProducts();
    }
  };

  return {
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    decreaseStock,
    toggleShoppingList
  };
};
