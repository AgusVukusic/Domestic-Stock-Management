import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ShoppingList from './pages/ShoppingList';
import RegisterPurchase from './pages/RegisterPurchase';
import FamilyGroups from './pages/FamilyGroups';
import AdminDashboard from './pages/AdminDashboard';
import Navigation from './components/Navigation';
import TopBar from './components/TopBar';
import { Toaster } from 'react-hot-toast';

import { GroupProvider } from './context/GroupContext';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const isAuthenticated = () => localStorage.getItem('token') !== null;

  const PrivateRoute = ({ children }) => {
    if (!isAuthenticated()) return <Navigate to="/login" />;
    if (localStorage.getItem('rol') === 'admin') return <Navigate to="/admin" />;
    return children;
  };

  const AdminRoute = ({ children }) => {
    if (!isAuthenticated()) return <Navigate to="/login" />;
    if (localStorage.getItem('rol') !== 'admin') return <Navigate to="/dashboard" />;
    return children;
  };

  return (
    <GroupProvider>
      <Router>
        <Toaster 
          position="bottom-right" 
          toastOptions={{ 
            style: { 
              borderRadius: '10px', 
              background: 'var(--card-bg)', 
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)'
            } 
          }} 
        />
        <div className="app-layout">
          <Navigation darkMode={darkMode} toggleTheme={toggleTheme} />
          <main className="main-content">
            <TopBar darkMode={darkMode} toggleTheme={toggleTheme} />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/shopping-list" element={<PrivateRoute><ShoppingList /></PrivateRoute>} />
              <Route path="/register-purchase" element={<PrivateRoute><RegisterPurchase /></PrivateRoute>} />
              <Route path="/groups" element={<PrivateRoute><FamilyGroups /></PrivateRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </GroupProvider>
  );
}


export default App;