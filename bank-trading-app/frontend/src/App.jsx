import React, { useState } from 'react';
import { useTradingStore } from './store/useTradingStore';

// Импорт страниц твоего банковского приложения (строгое соответствие регистру)
import Main from './pages/Main';
import Transfers from './pages/Transfer'; 
import Invest from './pages/invest';       
import Profile from './pages/Profile';
import Credits from './pages/Credits';

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
    if (!phoneInput || !passwordInput) return alert('Заполните все поля!');
    setAuthLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneInput, password: passwordInput })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data); 
      } else {
        alert(data.error || 'Ошибка входа');
      }
    } catch (err) {
      alert('Нет связи с сервером! Проверь, запущен ли node server.js');
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
    return (
      <div style={authFallbackStyle}>
        <div style={authCardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#11bb77', margin: '0 0 6px 0' }}>BakaBank</h2>
            <p style={{ color: '#666d75', fontSize: '13px', margin: 0 }}>Цифровой суперапп • Вход</p>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={inputLabelStyle}>Номер телефона</label>
              <input 
                type="text" 
                placeholder="0700 123 456" 
                value={phoneInput} 
                onChange={e => setPhoneInput(e.target.value)} 
                style={authInputStyle} 
              />
            </div>
            <div>
              <label style={inputLabelStyle}>Пароль</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
                style={authInputStyle} 
              />
            </div>

            <button type="submit" disabled={authLoading} style={loginBtnStyle}>
              {authLoading ? 'Проверка...' : 'Войти в кабинет'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid #202329', paddingTop: '16px' }}>
            <button onClick={handleDemoLogin} style={demoBtnStyle}>
              ⚡ Быстрый демо-вход (Бекжан)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================================
  // ОСНОВНОЙ ИНТЕРФЕЙС БАНКА (ПОСЛЕ ВХОДА)
  // ====================================================================
  return (
    <div style={appContainerStyle}>
      
      {/* СТАТУС-ХЕДЕР */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={avatarStyle}>👋</div>
          <div>
            <span style={greetingStyle}>Салам,</span>
            <h3 style={userNameStyle}>{user.fullName || 'Клиент BakaBank'}</h3>
          </div>
        </div>
        <div style={notificationBadgeStyle}>🔔</div>
      </header>

      {/* КОНТЕНТ ВКЛАДОК */}
      <main style={mainContentStyle}>
        {activeTab === 'main' && <Main />}
        {activeTab === 'transfers' && <Transfers />}
        {activeTab === 'invest' && <Invest />}
        {activeTab === 'profile' && <Profile />}
        {activeTab === 'credits' && <Credits />}
      </main>

      {/* НИЖНИЙ НАВБАР */}
      <footer style={navBarStyle}>
        <div onClick={() => setActiveTab('main')} style={navItemStyle(activeTab === 'main')}>
          <span style={navIconStyle}>🏠</span>
          <span>Главная</span>
        </div>
        
        <div onClick={() => setActiveTab('transfers')} style={navItemStyle(activeTab === 'transfers')}>
          <span style={navIconStyle}>↗️</span>
          <span>Платежи</span>
        </div>
        
        {/* Центральная неоновая кнопка Кредитов */}
        <div 
          onClick={() => setActiveTab('credits')}
          style={{
            ...qrButtonStyle, 
            background: activeTab === 'credits' ? '#11bb77' : '#ffcc00',
            boxShadow: activeTab === 'credits' ? '0 6px 20px rgba(17,187,119,0.4)' : '0 6px 20px rgba(255,204,0,0.3)'
          }} 
        >
          💸
        </div>

        <div onClick={() => setActiveTab('invest')} style={navItemStyle(activeTab === 'invest')}>
          <span style={navIconStyle}>📊</span>
          <span>M-Invest</span>
        </div>

        <div onClick={() => setActiveTab('profile')} style={navItemStyle(activeTab === 'profile')}>
          <span style={navIconStyle}>⚙️</span>
          <span>Еще</span>
        </div>
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
const avatarStyle = { width: '38px', height: '38px', borderRadius: '50%', background: '#14161a', border: '1px solid #202329', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px' };
const greetingStyle = { fontSize: '11px', color: '#525a64', display: 'block', textAlign: 'left' };
const userNameStyle = { margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff', textAlign: 'left' };
const notificationBadgeStyle = { width: '38px', height: '38px', borderRadius: '12px', background: '#14161a', border: '1px solid #202329', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', cursor: 'pointer' };

const navBarStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, height: '78px', background: 'rgba(20, 22, 26, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #202329', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000, paddingBottom: 'env(safe-area-inset-bottom)' };
const navItemStyle = (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: active ? '#11bb77' : '#525a64', fontSize: '10px', fontWeight: '700', cursor: 'pointer', width: '60px', transition: 'color 0.2s ease' });
const navIconStyle = { fontSize: '20px', marginBottom: '2px' };
const qrButtonStyle = { width: '54px', height: '54px', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', color: '#000', cursor: 'pointer', marginTop: '-32px', transition: 'all 0.2s ease-in-out', userSelect: 'none' };

const authFallbackStyle = { background: '#0b0c0e', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '16px' };
const authCardStyle = { background: '#14161a', width: '100%', maxWidth: '360px', padding: '30px 24px', borderRadius: '28px', border: '1px solid #202329', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' };
const inputLabelStyle = { fontSize: '11px', color: '#525a64', display: 'block', marginBottom: '6px', textAlign: 'left', fontWeight: '600' };
const authInputStyle = { width: '100%', boxSizing: 'border-box', padding: '14px 16px', background: '#0b0c0e', border: '1px solid #202329', borderRadius: '14px', color: '#fff', fontSize: '14px', outline: 'none', marginBottom: '4px' };
const loginBtnStyle = { width: '100%', padding: '16px', background: '#11bb77', color: '#000', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '10px' };
const demoBtnStyle = { width: '100%', padding: '12px', background: 'transparent', color: '#ffcc00', border: '1px dashed #ffcc00', borderRadius: '14px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' };