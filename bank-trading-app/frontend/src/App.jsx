import React, { useState, useEffect, useRef } from 'react';
import { useTradingStore } from './store/useTradingStore';
import { API_BASE_URL } from './config';
import { Home, ArrowUpRight, User, Banknote, Bell, Clock, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import './styles/app.css';

// Импорт страниц твоего банковского приложения (строгое соответствие регистру)
import Main from './pages/Main';
import Transfers from './pages/Transfer';
import Invest from './pages/invest';
import Profile from './pages/Profile';
import Credits from './pages/Credits';
import Register from './pages/Register';
import History from './pages/History'; // Наша новая страница истории

export default function App() {
  const user = useTradingStore((state) => state.user);
  const setUser = useTradingStore((state) => state.setUser);
  const activeTab = useTradingStore((state) => state.activeTab || 'main');
  const storeSetActiveTab = useTradingStore((state) => state.setActiveTab);

  // Состояния для формы авторизации
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Состояния для сквозной ИИ-Жабы
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: `Ква! Я твой личный жабий финансовый консультант BakaBank. Спроси меня про баланс, кредиты или акции! 🐸`, isAi: true }
  ]);
  const [toadInput, setToadInput] = useState('');
  const [toadLoading, setToadLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Автоскролл чата Жабы
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, toadLoading, isChatOpen]);

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

  // Вход через бэкенд
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

  // Мгновенный демо-вход
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

  // Отправка сообщений ИИ-Жабе
  const handleSendToadMessage = async (e) => {
    e.preventDefault();
    if (!toadInput.trim() || toadLoading) return;

    const userMessage = toadInput.trim();
    setToadInput('');
    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, isAi: false }]);
    setToadLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userName: user.fullName,
          cardBalance: user.cardBalance
        })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply, isAi: true }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: '⚠️ Ква... Ошибка сети. Жаба потеряла связь.', isAi: true }]);
    } finally {
      setToadLoading(false);
    }
  };

  // Интерфейс авторизации
  if (!user) {
    if (showRegister) {
      return <Register onSwitchToAuth={() => setShowRegister(false)} />;
    }

    return (
      <div className="auth-container">
        <Toaster position="top-center" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="auth-card">
          <div className="auth-header">
            <h2 className="auth-logo">BakaBank</h2>
            <p className="auth-subtitle">Цифровой суперапп • Вход</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">Номер телефона</label>
              <input type="tel" inputMode="numeric" placeholder="0700 123 456" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className="auth-input" />
            </div>
            <div className="input-group">
              <label className="input-label">Пароль</label>
              <input type="password" placeholder="••••••••" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="auth-input" />
            </div>
            <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={authLoading} className="auth-button">
              {authLoading ? 'Проверка...' : 'Войти в кабинет'}
            </motion.button>
          </form>

          <div className="auth-divider">
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleDemoLogin} className="demo-button">
              ⚡ Быстрый демо-вход (Бекжан)
            </motion.button>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowRegister(true)} className="register-button" style={{ marginTop: 'var(--space-md)' }}>
              Создать новый аккаунт
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ position: 'relative', minHeight: '100vh' }}>
      <Toaster position="top-center" />

      {/* ХЕДЕР С ЛОГО */}
      <header className="app-header">
        <h1 className="app-logo">BakaBank</h1>
      </header>

      {/* КОНТЕНТ ВКЛАДОК */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === 'main' && <Main />}
            {activeTab === 'transfers' && <Transfers />}
            {activeTab === 'invest' && <Invest />}
            {activeTab === 'profile' && <Profile />}
            {activeTab === 'credits' && <Credits />}
            {activeTab === 'history' && <History />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* ПЛАВАЮЩАЯ ЖАБА (НАД НАВБАРОМ) */}
      <div className="zhaba-wrapper">
        <div
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`zhaba-btn ${isChatOpen ? 'open' : 'closed'}`}
        >
          {isChatOpen ? <X size={26} color="#000" strokeWidth={2.5} /> : <span style={{ fontSize: '32px' }}>🐸</span>}
        </div>
      </div>

      {/* МОДАЛКА ИИ-ЧАТА ЖАБЫ */}
      {isChatOpen && (
        <div className="zhaba-modal-overlay">
          <div className="zhaba-modal-content">
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1f26', borderBottom: '1px solid #202329' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🐸</span>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: '700' }}>Жаба Baka-AI</h4>
                  <span style={{ fontSize: '11px', color: '#11bb77', fontWeight: '600' }}>На связи • Финансовый ИИ</span>
                </div>
              </div>
              <X size={20} color="#666d75" onClick={() => setIsChatOpen(false)} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#0b0c0e' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isAi ? 'flex-start' : 'flex-end', width: '100%' }}>
                  <div style={{
                    maxWidth: '80%', padding: '12px 16px', borderRadius: '16px', fontSize: '13px', lineHeight: '1.4',
                    background: msg.isAi ? '#1c1f26' : '#11bb77', color: msg.isAi ? '#fff' : '#000',
                    borderTopLeftRadius: msg.isAi ? '4px' : '16px', borderBottomRightRadius: msg.isAi ? '16px' : '4px',
                    textAlign: 'left', border: msg.isAi ? '1px solid #202329' : 'none'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {toadLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                  <div style={{ color: '#11bb77', fontStyle: 'italic', fontSize: '13px', padding: '4px 12px' }}>Жаба квакает ответ... 🐸</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendToadMessage} style={{ padding: '12px', display: 'flex', gap: '8px', background: '#1c1f26', borderTop: '1px solid #202329' }}>
              <input type="text" placeholder="Квакни вопрос (баланс, инвестиции)..." value={toadInput} onChange={e => setToadInput(e.target.value)} style={{ flex: 1, background: '#0b0c0e', border: '1px solid #202329', borderRadius: '12px', color: '#fff', padding: '10px 14px', fontSize: '13px', outline: 'none' }} />
              <button type="submit" style={{ background: '#11bb77', border: 'none', borderRadius: '12px', width: '38px', height: '38px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                <Send size={16} color="#000" strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* НИЖНИЙ НАВБАР */}
      <footer className="tab-bar">
        <motion.div whileTap={{ scale: 0.9 }} onClick={() => setActiveTab('main')} className={`tab-item ${activeTab === 'main' ? 'active' : ''}`}>
          <Home size={24} strokeWidth={2.5} className="tab-icon" />
          <span>Главная</span>
        </motion.div>

        <motion.div whileTap={{ scale: 0.9 }} onClick={() => setActiveTab('transfers')} className={`tab-item ${activeTab === 'transfers' ? 'active' : ''}`}>
          <ArrowUpRight size={24} strokeWidth={2.5} className="tab-icon" />
          <span>Платежи</span>
        </motion.div>

        {/* Центральная FAB кнопка */}
        <motion.div whileTap={{ scale: 0.95 }} onClick={() => setActiveTab('credits')} className={`center-fab ${activeTab === 'credits' ? 'active' : ''}`}>
          <Banknote size={28} color="rgba(255, 255, 255, 0.9)" strokeWidth={2.5} />
        </motion.div>

        {/* Вкладка Истории */}
        <motion.div whileTap={{ scale: 0.9 }} onClick={() => setActiveTab('history')} className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}>
          <Clock size={24} strokeWidth={2.5} className="tab-icon" />
          <span>История</span>
        </motion.div>

        <motion.div whileTap={{ scale: 0.9 }} onClick={() => setActiveTab('profile')} className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}>
          <User size={24} strokeWidth={2.5} className="tab-icon" />
          <span>Профиль</span>
        </motion.div>
      </footer>
    </div>
  );
}