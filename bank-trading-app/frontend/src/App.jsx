import React, { useState } from 'react';
import { useTradingStore } from './store/useTradingStore';
import { API_BASE_URL } from './config';
import { Home, ArrowUpRight, User, Banknote, Bell, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import './styles/app.css';

// Импорт страниц твоего банковского приложения (строгое соответствие регистру)
import Main from './pages/Main';
import Transfers from './pages/Transfer';
import Invest from './pages/invest';
import Profile from './pages/Profile';
import Credits from './pages/Credits';
import ZhabaAssistant from './pages/ZhabaAssistant';
import Register from './pages/register';

export default function App() {
  // Вытаскиваем состояние из Zustand через селекторы, чтобы избежать багов деструктуризации
  const user = useTradingStore((state) => state.user);
  const setUser = useTradingStore((state) => state.setUser);
  const activeTab = useTradingStore((state) => state.activeTab || 'main');
  const storeSetActiveTab = useTradingStore((state) => state.setActiveTab);

  // Состояния для формы авторизации
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Безопасный фолбек для навигации
  const setActiveTab = storeSetActiveTab || ((tab) => {
    const raw = localStorage.getItem('bakabank-session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        parsed.state.activeTab = tab;
        localStorage.setItem('bakabank-session', JSON.stringify(parsed));
        window.location.reload();
      } catch(e) {}
    }
  });

  // Вход через бэкенд (Node.js + SQLite)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!phoneInput || !passwordInput) {
      toast.error('Заполните все поля!');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneInput, password: passwordInput })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        toast.success('Добро пожаловать в BakaBank!');
      } else {
        toast.error(data.error || 'Ошибка входа');
      }
    } catch (err) {
      toast.error('Нет связи с сервером! Проверь, запущен ли node server.js');
    } finally {
      setAuthLoading(false);
    }
  };

  // Мгновенный демо-вход для проверки верстки и навигации
  const handleDemoLogin = () => {
    setUser({
      id: 1,
      fullName: 'Шаршеналиев Бекжан',
      phoneNumber: '0700123456',
      cardNumber: '4000 7532 9912 0043',
      cardBalance: 50000,
      investBalance: 0,
      piggyBalance: 0
    });
  };

  // ====================================================================
  // ИНТЕРФЕЙС АВТОРИЗАЦИИ (ЕСЛИ USER === NULL)
  // ====================================================================
  if (!user) {
    if (showRegister) {
      return <Register onSwitchToAuth={() => setShowRegister(false)} />;
    }

    return (
      <div className="auth-container">
        <Toaster position="top-center" toastOptions={{
          style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
          success: { iconTheme: { primary: 'var(--color-accent-success)', secondary: '#fff' } },
          error: { iconTheme: { primary: 'var(--color-accent-error)', secondary: '#fff' } }
        }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="auth-card"
        >
          <div className="auth-header">
            <h2 className="auth-logo">BakaBank</h2>
            <p className="auth-subtitle">Цифровой суперапп • Вход</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">Номер телефона</label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="0700 123 456"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                className="auth-input"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Пароль</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="auth-input"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={authLoading}
              className="auth-button"
            >
              {authLoading ? 'Проверка...' : 'Войти в кабинет'}
            </motion.button>
          </form>

          <div className="auth-divider">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleDemoLogin}
              className="demo-button"
            >
              ⚡ Быстрый демо-вход (Бекжан)
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowRegister(true)}
              className="register-button"
              style={{ marginTop: 'var(--space-md)' }}
            >
              Создать новый аккаунт
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ====================================================================
  // ОСНОВНОЙ ИНТЕРФЕЙС БАНКА (ПОСЛЕ ВХОДА)
  // ====================================================================
  return (
    <div className="app-container">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
        success: { iconTheme: { primary: 'var(--color-accent-success)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--color-accent-error)', secondary: '#fff' } }
      }} />

      {/* СТАТУС-ХЕДЕР */}
      <header className="app-header">
        <div className="header-left">
          <div className="user-avatar">
            <User size={20} strokeWidth={2.5} />
          </div>
          <div className="user-info">
            <span className="greeting-text">Салам,</span>
            <h3 className="user-name">{user.fullName || 'Клиент BakaBank'}</h3>
          </div>
        </div>
        <motion.div whileTap={{ scale: 0.9 }} className="notification-badge">
          <Bell size={20} strokeWidth={2.5} />
        </motion.div>
      </header>

      {/* КОНТЕНТ ВКЛАДОК */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'main' && <Main />}
            {activeTab === 'transfers' && <Transfers />}
            {activeTab === 'invest' && <Invest />}
            {activeTab === 'profile' && <Profile />}
            {activeTab === 'credits' && <Credits />}
            {activeTab === 'zhaba' && <ZhabaAssistant />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* НИЖНИЙ НАВБАР */}
      <footer className="tab-bar">
        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('main')}
          className={`tab-item ${activeTab === 'main' ? 'active' : ''}`}
        >
          <Home size={24} strokeWidth={2.5} className="tab-icon" />
          <span>Главная</span>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('transfers')}
          className={`tab-item ${activeTab === 'transfers' ? 'active' : ''}`}
        >
          <ArrowUpRight size={24} strokeWidth={2.5} className="tab-icon" />
          <span>Платежи</span>
        </motion.div>

        {/* Центральная FAB кнопка */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('credits')}
          className={`center-fab ${activeTab === 'credits' ? 'active' : ''}`}
        >
          <Banknote size={28} color="rgba(255, 255, 255, 0.9)" strokeWidth={2.5} />
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('zhaba')}
          className={`tab-item ${activeTab === 'zhaba' ? 'active' : ''}`}
        >
          <Bot size={24} strokeWidth={2.5} className="tab-icon" />
          <span>ЖАБА</span>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('profile')}
          className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <User size={24} strokeWidth={2.5} className="tab-icon" />
          <span>Профиль</span>
        </motion.div>
      </footer>

    </div>
  );
}

// ====================================================================
// СТИЛИ (PREMIUM DARK SYSTEM)
// ====================================================================
const appContainerStyle = { background: '#0b0c0e', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif', position: 'relative' };
const mainContentStyle = { padding: '0 16px 120px 16px', maxWidth: '440px', margin: '0 auto' };

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 16px 16px 16px', maxWidth: '440px', margin: '0 auto' };
const avatarStyle = { width: '38px', height: '38px', borderRadius: '50%', background: '#14161a', border: '1px solid #202329', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const greetingStyle = { fontSize: '11px', color: '#525a64', display: 'block', textAlign: 'left' };
const userNameStyle = { margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff', textAlign: 'left' };
const notificationBadgeStyle = { width: '38px', height: '38px', borderRadius: '12px', background: '#14161a', border: '1px solid #202329', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' };

const navBarStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, height: '78px', background: 'rgba(20, 22, 26, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #202329', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000, paddingBottom: 'env(safe-area-inset-bottom)' };
const navItemStyle = (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: active ? '#11bb77' : '#525a64', fontSize: '10px', fontWeight: '700', cursor: 'pointer', width: '60px', transition: 'color 0.2s ease' });
const qrButtonStyle = { width: '54px', height: '54px', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', marginTop: '-32px', transition: 'all 0.2s ease-in-out', userSelect: 'none' };

const authFallbackStyle = { background: '#0b0c0e', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '16px' };
const authCardStyle = { background: '#14161a', width: '100%', maxWidth: '360px', padding: '30px 24px', borderRadius: '28px', border: '1px solid #202329', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' };
const inputLabelStyle = { fontSize: '11px', color: '#525a64', display: 'block', marginBottom: '6px', textAlign: 'left', fontWeight: '600' };
const authInputStyle = { width: '100%', boxSizing: 'border-box', padding: '14px 16px', background: '#0b0c0e', border: '1px solid #202329', borderRadius: '14px', color: '#fff', fontSize: '14px', outline: 'none', marginBottom: '4px' };
const loginBtnStyle = { width: '100%', padding: '16px', background: '#11bb77', color: '#000', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '10px' };
const demoBtnStyle = { width: '100%', padding: '12px', background: 'transparent', color: '#ffcc00', border: '1px dashed #ffcc00', borderRadius: '14px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' };