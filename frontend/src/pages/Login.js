import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

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

      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Error al ' + (isLogin ? 'iniciar sesión' : 'registrarse')
      );
    } finally {
      setLoading(false);
    }
  };

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <div style={{ ...styles.container, backgroundColor: theme.background }}>
      {/* Theme Toggle Button */}
      <button onClick={toggleTheme} style={{ ...styles.themeToggle, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Decorative Background Elements */}
      <div style={styles.bgCircle1}></div>
      <div style={styles.bgCircle2}></div>
      <div style={styles.bgCircle3}></div>

      <div style={{ ...styles.card, backgroundColor: theme.cardBg }}>
        {/* Logo/Header */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logo}>🏡</div>
          </div>
          <h1 style={styles.title}>Stock App</h1>
          <p style={{ ...styles.subtitle, color: theme.textMuted }}>Gestiona tu inventario de forma sencilla</p>
        </div>

        {/* Toggle Tabs */}
        <div style={styles.tabContainer}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              ...styles.tab,
              ...(isLogin ? styles.tabActive : { ...styles.tabInactive, color: theme.textMuted })
            }}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              ...styles.tab,
              ...(isLogin ? { ...styles.tabInactive, color: theme.textMuted } : styles.tabActive)
            }}
          >
            Registrarse
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={{ ...styles.label, color: theme.text }}>Usuario</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={{ ...styles.label, color: theme.text }}>Contraseña</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
              />
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <span style={styles.loadingSpinner}>⏳</span>
            ) : (
              isLogin ? 'Entrar' : 'Crear Cuenta'
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div style={styles.footer}>
          <p style={{ ...styles.footerText, color: theme.textMuted }}>
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <span
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={styles.footerLink}
            >
              {isLogin ? ' Regístrate aquí' : ' Inicia sesión'}
            </span>
          </p>
        </div>
      </div>

      {/* Bottom Info */}
      <div style={styles.bottomInfo}>
        <p style={{ ...styles.bottomText, color: theme.textMuted }}>
          🔒 Tus datos están seguros y encriptados
        </p>
      </div>
    </div>
  );
}

// Temas
const lightTheme = {
  background: '#F7E7FA',
  text: '#2D2D2D',
  textMuted: '#7A7A85',
  cardBg: '#FFFFFF',
  inputBg: '#FFFFFF',
  border: '#e8d9eb',
};

const darkTheme = {
  background: '#1a1a1a',
  text: '#FFFFFF',
  textMuted: '#9a9a9a',
  cardBg: '#2D2D2D',
  inputBg: '#3a3a3a',
  border: '#4a4a4a',
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'background-color 0.3s ease',
  },
  themeToggle: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(140, 122, 230, 0.15)',
    zIndex: 10,
  },
  bgCircle1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(140, 122, 230, 0.1) 0%, rgba(199, 200, 244, 0.1) 100%)',
    top: '-100px',
    right: '-100px',
    filter: 'blur(60px)',
  },
  bgCircle2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(199, 200, 244, 0.15) 0%, rgba(140, 122, 230, 0.15) 100%)',
    bottom: '-80px',
    left: '-80px',
    filter: 'blur(50px)',
  },
  bgCircle3: {
    position: 'absolute',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(140, 122, 230, 0.08) 0%, rgba(199, 200, 244, 0.08) 100%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    filter: 'blur(70px)',
  },
  card: {
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 10px 40px rgba(140, 122, 230, 0.15)',
    position: 'relative',
    zIndex: 1,
    transition: 'background-color 0.3s ease',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logoContainer: {
    display: 'inline-block',
    marginBottom: '15px',
  },
  logo: {
    fontSize: '48px',
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #8C7AE6 0%, #C7C8F4 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    boxShadow: '0 8px 24px rgba(140, 122, 230, 0.25)',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: '700',
    color: '#2D2D2D',
    background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '400',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#F7E7FA',
    padding: '6px',
    borderRadius: '12px',
    marginBottom: '30px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(140, 122, 230, 0.3)',
  },
  tabInactive: {
    backgroundColor: 'transparent',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    marginLeft: '4px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    fontSize: '18px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    fontSize: '15px',
    border: '2px solid',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  errorBox: {
    backgroundColor: '#FFF3F3',
    color: '#d32f2f',
    padding: '14px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #ffcdd2',
  },
  errorIcon: {
    fontSize: '18px',
  },
  submitBtn: {
    padding: '16px',
    background: 'linear-gradient(135deg, #8C7AE6 0%, #6B5BC9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(140, 122, 230, 0.35)',
    marginTop: '10px',
  },
  loadingSpinner: {
    display: 'inline-block',
    fontSize: '20px',
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    fontSize: '14px',
  },
  footerLink: {
    color: '#8C7AE6',
    fontWeight: '600',
    cursor: 'pointer',
    marginLeft: '4px',
    transition: 'all 0.2s ease',
  },
  bottomInfo: {
    marginTop: '24px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  bottomText: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '500',
  },
};

export default Login;