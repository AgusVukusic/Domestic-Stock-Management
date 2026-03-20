import axios from 'axios';

// URL base de tu API
const API_URL = 'https://stock-app-backend-cg7w.onrender.com/';

// Crear instancia de axios con configuración
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token automáticamente a todas las peticiones ya que necesitan validar el usuario
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Funciones de autenticación para login y registro
export const authAPI = {
  register: (username, password) =>
    api.post('/auth/register', { username, password }),
  
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};

// Funciones para todo lo relacionado con los productos
export const productsAPI = {
  getAll: () => api.get('/products/'),
  
  create: (productData) => api.post('/products/', productData),
  
  update: (id, productData) => api.put(`/products/${id}`, productData),
  
  delete: (id) => api.delete(`/products/${id}`),
  
  decreaseStock: (id, cantidad = 1) =>
    api.put(`/products/${id}/decrease`, null, { params: { cantidad } }),

  increaseStock: (id, cantidad = 1) =>
    api.put(`/products/${id}/increase`, null, { params: { cantidad } }),
  
  addToShoppingList: (id) =>
    api.put(`/products/${id}/add-to-shopping-list`),
  
  removeFromShoppingList: (id) =>
    api.delete(`/products/${id}/remove-from-shopping-list`),
  
  getShoppingList: () => api.get('/products/shopping-list/view'),
  
};

export const groupsAPI = {
  getAll: () => api.get('/groups/'),
  
  create: (nombre) => api.post('/groups/', { nombre }),
  
  addMember: (groupId, username) => 
    api.post(`/groups/${groupId}/members`, { username }),
};

export default api;