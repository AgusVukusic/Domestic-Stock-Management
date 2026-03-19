import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ShoppingList from './pages/ShoppingList';
import RegisterPurchase from './pages/RegisterPurchase';
import FamilyGroups from './pages/FamilyGroups';
import { Toaster } from 'react-hot-toast';

function App() {
  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  // Componente para rutas protegidas
  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      {/* Toaster para notificaciones */}
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }} 
      />

      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Ruta del Dashboard */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Ruta de la lista de compras */}
        <Route
          path="/shopping-list"
          element={
            <PrivateRoute>
              <ShoppingList />
            </PrivateRoute>
          }
        />

        {/* Ruta para registrar una compra extra que no este en la lista de compras */}
        <Route 
          path="/register-purchase"
          element={
            <PrivateRoute>
              <RegisterPurchase />
            </PrivateRoute>
          }
        />

        {/* Ruta de los grupos familiares */}
        <Route
          path="/groups"
          element={
            <PrivateRoute>
              <FamilyGroups />
            </PrivateRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;