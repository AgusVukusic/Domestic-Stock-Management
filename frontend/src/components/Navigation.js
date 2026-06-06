import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Users, ClipboardList, Sun, Moon, LogOut } from 'lucide-react';
import './Navigation.css';

const Navigation = ({ darkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide nav on auth pages
  if (['/login', '/register', '/'].includes(location.pathname)) return null;

  const handleLogout = () => {
    if (window.confirm('¿Seguro que deseas cerrar sesión?')) {
      localStorage.clear();
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
      navigate('/login');
    }
  };

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

      <div className="spacer" style={{ flex: 1, display: window.innerWidth > 768 ? 'block' : 'none' }}></div>

      <button className="nav-item" onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
        <div className="nav-icon-container">{darkMode ? <Sun size={22} /> : <Moon size={22} />}</div>
        <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
      </button>

      <button className="nav-item" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--danger)' }}>
        <div className="nav-icon-container"><LogOut size={22} /></div>
        <span>Salir</span>
      </button>
    </nav>
  );
};

export default Navigation;
