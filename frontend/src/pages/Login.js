import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Login.css';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    // Aplicar a nivel global
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await authAPI.login(username, password);
      } else {
        response = await authAPI.register(username, password);
      }

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_id', response.data.user_id);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('rol', response.data.rol); // Guardamos el rol

      // Redirección condicional según el rol
      if (response.data.rol === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Error al ' + (isLogin ? 'iniciar sesión' : 'registrarse')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container login-container">
      {/* Theme Toggle Button */}
      <button onClick={toggleTheme} className="theme-toggle">
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Decorative Background Elements */}
      <div className="bg-circle bg-circle-1"></div>
      <div className="bg-circle bg-circle-2"></div>
      <div className="bg-circle bg-circle-3"></div>

      <div className="card glass-panel login-card animate-fade-in">
        {/* Logo/Header */}
        <div className="login-header">
          <div className="login-logo">🏡</div>
          <h1 className="login-title gradient-text">Stock App</h1>
          <p className="login-subtitle">Gestiona tu inventario de forma sencilla</p>
        </div>

        {/* Toggle Tabs */}
        <div className="login-tabs">
          <button
            onClick={() => setIsLogin(true)}
            className={`login-tab ${isLogin ? 'active' : ''}`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`login-tab ${!isLogin ? 'active' : ''}`}
          >
            Registrarse
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label className="form-label">Usuario</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="text"
                className="form-input login-input"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                className="form-input login-input"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-box">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading} 
            style={{ marginTop: '10px', padding: '16px', fontSize: '16px' }}
          >
            {loading ? (
              <span className="loading-spinner" style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            ) : (
              isLogin ? 'Entrar' : 'Crear Cuenta'
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="login-footer">
          <p>
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <span
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="login-link"
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
            </span>
          </p>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="login-bottom-info">
        <p>🔒 Tus datos están seguros y encriptados</p>
      </div>
    </div>
  );
}

export default Login;