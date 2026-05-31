import React, { useState, useEffect, useRef } from 'react';
import { useTradingStore } from './store/useTradingStore';
import { API_BASE_URL } from './config';
import { Home, ArrowUpRight, User, Banknote, Clock, Send, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import './styles/app.css';

// Импорт страниц
import Main from './pages/main';
import Transfers from './pages/Transfer';
import Invest from './pages/invest';
import Profile from './pages/Profile';
import Credits from './pages/Credits';
import Register from './pages/Register';
import History from './pages/History';

// Философия Эмила Ковальски: Естественные пружины, мгновенный отклик
const springConfig = { type: "spring", stiffness: 400, damping: 30 };
const fastSpring = { 
  type: "spring", 
  stiffness: 500, // Высокая скорость старта
  damping: 35,    // Минимальные колебания
  mass: 1 
};

export default function App() {
  const user = useTradingStore((state) => state.user);
  const setUser = useTradingStore((state) => state.setUser);
  const activeTab = useTradingStore((state) => state.activeTab || 'main');
  const storeSetActiveTab = useTradingStore((state) => state.setActiveTab);

  // Auth States
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // AI Жаба States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: `Ква! Я твой индустриальный ИИ-ассистент BakaBank. Запрашивай баланс или аналитику. 🐸`, isAi: true }
  ]);
  const [toadInput, setToadInput] = useState('');
  const [toadLoading, setToadLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, toadLoading, isChatOpen]);

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
        toast.success('Авторизация успешна');
      } else {
        toast.error(data.error || 'Ошибка доступа');
      }
    } catch (err) {
      toast.error('Сервер недоступен (node server.js)');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setUser({
      id: 1,
      fullName: 'Бекжан Ш.',
      phoneNumber: '0700123456',
      cardNumber: '4000 7532 9912 0043',
      cardBalance: 128450,
      investBalance: 0,
      piggyBalance: 0
    });
  };

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
      setMessages(prev => [...prev, { id: Date.now() + 1, text: 'Ошибка соединения с ИИ-модулем.', isAi: true }]);
    } finally {
      setToadLoading(false);
    }
  };

  // === AUTH SCREEN ===
  if (!user) {
    if (showRegister) return <Register onSwitchToAuth={() => setShowRegister(false)} />;

    return (
      <div className="auth-container">
        <Toaster position="top-center" toastOptions={{ style: { background: '#1c1c1e', color: '#fff', border: '1px solid #333' } }} />
        
        <motion.div 
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }} 
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
          transition={springConfig}
          className="auth-card"
        >
          <div className="auth-header">
            <h2 className="auth-logo-text">BAKABANK</h2>
            <p className="auth-subtitle">Terminal // Авторизация</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">ID / Телефон</label>
              <input type="tel" inputMode="numeric" placeholder="0700 123 456" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className="auth-input" />
            </div>
            <div className="input-group">
              <label className="input-label">ПИН-код</label>
              <input type="password" placeholder="••••••••" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="auth-input" />
            </div>
            <motion.button whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }} type="submit" disabled={authLoading} className="auth-button">
              {authLoading ? 'Соединение...' : 'Войти'}
            </motion.button>
          </form>

          <div className="auth-divider">
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleDemoLogin} className="demo-button">
              [ DEMO ACCESS ]
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowRegister(true)} className="register-button">
              Регистрация профиля
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Навигационные данные
  const TABS = [
    { id: 'main', icon: Home },
    { id: 'transfers', icon: ArrowUpRight },
    { id: 'history', icon: Clock },
    { id: 'profile', icon: User }
  ];

  return (
    <div className="app-container">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1c1c1e', color: '#fff', border: '1px solid #333' } }} />

      <header className="app-header">
        <h1 className="app-logo">BakaBank</h1>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} 
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }} 
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'main' && <Main />}
            {activeTab === 'transfers' && <Transfers />}
            {activeTab === 'invest' && <Invest />}
            {activeTab === 'profile' && <Profile />}
            {activeTab === 'credits' && <Credits />}
            {activeTab === 'history' && <History />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* ПЛАВАЮЩАЯ ИИ-ЖАБА */}
      <div className="zhaba-wrapper">
        <motion.div
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`zhaba-btn ${isChatOpen ? 'open' : 'closed'}`}
        >
          {isChatOpen ? <X size={24} color="#fff" /> : <MessageSquare size={24} color="#fff" />}
        </motion.div>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="zhaba-modal-overlay"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95, filter: "blur(8px)" }}
              animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ y: 20, scale: 0.95, opacity: 0, filter: "blur(4px)" }}
              transition={springConfig}
              className="zhaba-modal-content"
            >
              <div className="zhaba-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🐸</span>
                  <div>
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-display)', color: '#fff' }}>Baka-AI</h4>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-acid)' }}>Онлайн</span>
                  </div>
                </div>
                <X size={20} color="#666" onClick={() => setIsChatOpen(false)} style={{ cursor: 'pointer' }} />
              </div>

              <div className="zhaba-chat-area">
                {messages.map(msg => (
                  <div key={msg.id} className={`msg-bubble ${msg.isAi ? 'msg-ai' : 'msg-user'}`}>
                    {msg.text}
                  </div>
                ))}
                {toadLoading && (
                  <div className="msg-bubble msg-ai" style={{ opacity: 0.6 }}>
                    <span className="animate-pulse">Обработка...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendToadMessage} className="zhaba-input-area">
                <input type="text" placeholder="Запрос к ИИ..." value={toadInput} onChange={e => setToadInput(e.target.value)} className="zhaba-input" />
                <motion.button whileTap={{ scale: 0.9 }} type="submit" className="zhaba-send-btn">
                  <Send size={18} strokeWidth={2.5} />
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* НИЖНИЙ НАВБАР С FLIP АНИМАЦИЕЙ */}
      <footer className="tab-bar">
  {TABS.slice(0, 2).map((tab) => (
    <div 
      key={tab.id} 
      onClick={() => setActiveTab(tab.id)} 
      className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
    >
      <AnimatePresence>
        {activeTab === tab.id && (
          <motion.div 
            layoutId="tab-active"
            className="tab-active-bg"
            transition={fastSpring}
            initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
          />
        )}
      </AnimatePresence>
      <div className="tab-icon-wrapper">
        <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
        <span>{tab.label}</span>
      </div>
    </div>
  ))}

  {/* FAB с тактильным откликом (Cookbook §10) */}
  <motion.div 
    whileTap={{ scale: 0.94 }} 
    onClick={() => setActiveTab('credits')} 
    className="center-fab"
  >
    <Banknote size={24} strokeWidth={2.5} />
  </motion.div>

  {TABS.slice(2).map((tab) => (
    <div 
      key={tab.id} 
      onClick={() => setActiveTab(tab.id)} 
      className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
    >
      <AnimatePresence>
        {activeTab === tab.id && (
          <motion.div 
            layoutId="tab-active"
            className="tab-active-bg"
            transition={fastSpring}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          />
        )}
      </AnimatePresence>
      <div className="tab-icon-wrapper">
        <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
        <span>{tab.label}</span>
      </div>
    </div>
  ))}
</footer>
    </div>
  );
}