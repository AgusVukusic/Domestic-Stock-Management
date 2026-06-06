import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, Users, ClipboardList } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  // Hide nav on auth pages
  if (['/login', '/register', '/'].includes(location.pathname)) return null;

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1 className="gradient-text" style={{ fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={28} /> StockApp
        </h1>
      </div>
      
      <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
        <div className="nav-icon-container"><Package size={22} /></div>
        <span>Inventario</span>
      </NavLink>
      
      <NavLink to="/register-purchase" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
        <div className="nav-icon-container"><ShoppingCart size={22} /></div>
        <span>Comprar</span>
      </NavLink>
      
      <NavLink to="/shopping-list" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
        <div className="nav-icon-container"><ClipboardList size={22} /></div>
        <span>Lista</span>
      </NavLink>
      
      <NavLink to="/groups" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
        <div className="nav-icon-container"><Users size={22} /></div>
        <span>Grupos</span>
      </NavLink>
    </nav>
  );
};

export default Navigation;
