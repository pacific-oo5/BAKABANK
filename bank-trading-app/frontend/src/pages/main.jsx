import React, { useState, useEffect, useRef } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { CreditCard, Send, TrendingUp, Banknote, Smartphone, Eye, EyeOff, PiggyBank, Plus, ArrowUpRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/dashboard.css';

export default function Main() {
  const { user, setUser, setActiveTab } = useTradingStore();
  const [balanceVisible, setBalanceVisible] = useState(true);

  // ====================================================================
  // СОСТОЯНИЯ ДЛЯ ИИ-ЖАБЫ
  // ====================================================================
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: `Ква! Я твой личный жабий финансовый консультант BakaBank. Спроси меня про баланс, кредиты или акции! 🐸`, isAi: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Автообновление данных с бэкенда раз в 5 секунд
  const fetchFreshData = async () => {
    if (!user?.id) return;
    try {
      const userResponse = await fetch(`http://localhost:3001/api/user/profile/${user.id}`);
      if (userResponse.ok) {
        const freshUserData = await userResponse.json();
        setUser(freshUserData);
      }
    } catch (err) {
      console.error('Ошибка автоматического обновления данных:', err);
    }
  };

  useEffect(() => {
    fetchFreshData();
    const interval = setInterval(fetchFreshData, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Автоскролл чата вниз
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isChatOpen]);

  // Отправка сообщений ИИ-Жабе
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, isAi: false }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userName: user.fullName,
          cardBalance: user.cardBalance
        })
      });
      const data = await response.json();
      
      let toadReply = data.reply;
      if (!toadReply.includes('Ква')) {
        toadReply = 'Ква! ' + toadReply;
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: toadReply, isAi: true }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: '⚠️ Ква... Ошибка сети. Жаба потеряла связь.', isAi: true }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Загрузка...</p>
      </div>
    );
  }

  const maskBalance = () => '••• •••';

  const quickActions = [
    { id: 'transfer', icon: Send, label: 'Перевод', color: '#0A84FF', tab: 'transfers' },
    { id: 'invest', icon: TrendingUp, label: 'Инвестиции', color: '#30D158', tab: 'invest' },
    { id: 'credit', icon: Banknote, label: 'Кредит', color: '#FFD60A', tab: 'credits' },
    { id: 'payment', icon: Smartphone, label: 'Оплата', color: '#FF453A', tab: 'transfers' }
  ];

  return (
    <div className="dashboard" style={{ position: 'relative' }}>
      {/* PREMIUM CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card"
        style={highlightedCardStyle}
      >
        <div className="card-noise" />
        <div className="card-gradient" style={cardGradientOverlay} />

        <div className="card-header">
          <div className="card-label" style={{ color: '#11bb77', fontWeight: '800' }}>Дебетовая карта PREMIUM</div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setBalanceVisible(!balanceVisible)}
            className="eye-button"
          >
            {balanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </motion.button>
        </div>

        <div className="card-balance">
          {balanceVisible ? (
            <>
              <span className="balance-amount">{user.cardBalance?.toLocaleString('ru-RU') || '0'}</span>
              <span className="balance-currency">сом</span>
            </>
          ) : (
            <span className="balance-hidden">{maskBalance()}</span>
          )}
        </div>

        <div className="card-footer">
          <div className="card-number">
            <CreditCard size={16} className="card-icon" />
            <span>{user.cardNumber || '•••• •••• •••• ••••'}</span>
          </div>
          <div className="card-chip" style={goldChipStyle}>⚡ ELKART</div>
        </div>
      </motion.div>

      {/* QUICK ACTIONS */}
      <div className="section">
        <h3 className="section-title">Быстрые действия</h3>
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(action.tab)}
              className="action-button"
              style={{ '--action-color': action.color }}
            >
              <div className="action-icon">
                <action.icon size={24} strokeWidth={2.5} />
              </div>
              <span className="action-label">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ACCOUNTS */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Другие счета</h3>
          <button className="section-action">
            <Plus size={18} />
          </button>
        </div>

        <div className="accounts-list">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('invest')}
            className="account-card"
          >
            <div className="account-icon" style={{ background: 'linear-gradient(135deg, #30D158 0%, #00C7BE 100%)' }}>
              <TrendingUp size={24} strokeWidth={2.5} />
            </div>
            <div className="account-info">
              <span className="account-label">M-Invest</span>
              <span className="account-sublabel">Брокерский счет</span>
            </div>
            <div className="account-balance">
              <span className="account-amount">{user.investBalance?.toLocaleString('ru-RU') || '0'}</span>
              <span className="account-currency">с</span>
            </div>
            <ArrowUpRight size={20} className="account-arrow" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            whileTap={{ scale: 0.98 }}
            className="account-card"
          >
            <div className="account-icon" style={{ background: 'linear-gradient(135deg, #FFD60A 0%, #FF9500 100%)' }}>
              <PiggyBank size={24} strokeWidth={2.5} />
            </div>
            <div className="account-info">
              <span className="account-label">Копилка</span>
              <span className="account-sublabel">Накопительный счет</span>
            </div>
            <div className="account-balance">
              <span className="account-amount">{user.piggyBalance?.toLocaleString('ru-RU') || '0'}</span>
              <span className="account-currency">с</span>
            </div>
            <ArrowUpRight size={20} className="account-arrow" />
          </motion.button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ПЛАВАЮЩАЯ ЖАБА (НАД НАВБАРОМ СПРАВА) — ЧИСТЫЙ HTML С ВЫСОКИМ Z-INDEX */}
      {/* ==================================================================== */}
      <div
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '100px', // Высота строго над твоим нижним навбаром
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: isChatOpen ? '#ff4d4f' : '#11bb77',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 9999, // Прожигает любые слои CSS, чтобы кнопка была видима
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(17, 187, 119, 0.3)',
          border: '2px solid rgba(255,255,255,0.1)',
          userSelect: 'none',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        {isChatOpen ? <X size={26} color="#000" strokeWidth={2.5} /> : <span style={{ fontSize: '32px' }}>🐸</span>}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ИИ-ЧАТА */}
      {isChatOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(5px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#14161a',
            width: '100%',
            maxWidth: '400px',
            height: '460px',
            borderRadius: '28px',
            border: '1px solid #202329',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '84px', // Чуть выше таб-бара
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
          }}>
            {/* Хедер модалки */}
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

            {/* Сообщения */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#0b0c0e' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isAi ? 'flex-start' : 'flex-end', width: '100%' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    background: msg.isAi ? '#1c1f26' : '#11bb77',
                    color: msg.isAi ? '#fff' : '#000',
                    borderTopLeftRadius: msg.isAi ? '4px' : '16px',
                    borderBottomRightRadius: msg.isAi ? '16px' : '4px',
                    textAlign: 'left',
                    border: msg.isAi ? '1px solid #202329' : 'none'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                  <div style={{ color: '#11bb77', fontStyle: 'italic', fontSize: '13px', padding: '4px 12px' }}>
                    Жаба квакает ответ... 🐸
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Форма ввода */}
            <form onSubmit={handleSendMessage} style={{ padding: '12px', display: 'flex', gap: '8px', background: '#1c1f26', borderTop: '1px solid #202329' }}>
              <input 
                type="text" 
                placeholder="Квакни вопрос (баланс, инвестиции)..." 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                style={{ flex: 1, background: '#0b0c0e', border: '1px solid #202329', borderRadius: '12px', color: '#fff', padding: '10px 14px', fontSize: '13px', outline: 'none' }} 
              />
              <button type="submit" style={{ background: '#11bb77', border: 'none', borderRadius: '12px', width: '38px', height: '38px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                <Send size={16} color="#000" strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ДОПОЛНИТЕЛЬНЫЕ СТИЛИ КАРТЫ
const highlightedCardStyle = {
  background: 'linear-gradient(135deg, #14161a 0%, #0b0c0e 100%)',
  border: '1px solid #11bb77',
  boxShadow: '0 0 20px rgba(17, 187, 119, 0.2)',
  position: 'relative',
  overflow: 'hidden'
};
const cardGradientOverlay = {
  background: 'radial-gradient(circle at top right, rgba(17, 187, 119, 0.12), transparent 60%)'
};
const goldChipStyle = {
  background: 'linear-gradient(135deg, #ffcc00 0%, #ff9500 100%)',
  color: '#000',
  padding: '4px 10px',
  borderRadius: '8px',
  fontSize: '10px',
  fontWeight: '800'
};