import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { Send, TrendingUp, Banknote, Smartphone, Eye, EyeOff, Plus, ArrowUpRight, ShieldCheck, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/dashboard.css';

// Пружины Эмила Ковальски
const springConfig = { type: "spring", stiffness: 400, damping: 30 };

// Каскадная анимация появления (Stagger)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: springConfig }
};

export default function Main() {
  const { user, setUser, setActiveTab } = useTradingStore();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Автообновление данных
  useEffect(() => {
    const fetchFreshData = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`http://localhost:3001/api/user/profile/${user.id}`);
        if (res.ok) setUser(await res.json());
      } catch (err) {
        console.error('Ошибка синхронизации данных:', err);
      }
    };
    fetchFreshData();
    const interval = setInterval(fetchFreshData, 5000);
    return () => clearInterval(interval);
  }, [user?.id, setUser]);

  if (!user) {
    return (
      <div className="dashboard-loading">
        <Cpu size={32} className="animate-pulse text-[var(--accent-acid)]" />
        <p>Инициализация систем...</p>
      </div>
    );
  }

  // Утилитарный массив действий
  const quickActions = [
    { id: 'transfer', icon: Send, label: 'Перевод', tab: 'transfers' },
    { id: 'invest', icon: TrendingUp, label: 'Биржа', tab: 'invest' },
    { id: 'credit', icon: Banknote, label: 'Кредит', tab: 'credits' },
    { id: 'payment', icon: Smartphone, label: 'Оплата', tab: 'transfers' }
  ];

  // Получить последние 3 цифры номера карты
  const getLastDigits = (cardNumber) => {
    if (!cardNumber) return '•••';
    return cardNumber.replace(/\s/g, '').slice(-3);
  };

  // Генерация срока действия и CVC
  const cardExpiry = user.cardExpiry || '12/28';
  const cardCVC = user.cardCVC || '***';
  const fullCardNumber = user.cardNumber || '0000 0000 0000 0000';

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="dashboard"
    >
      {/* HEADER С ПРИВЕТСТВИЕМ */}
      <motion.div variants={itemVariants} className="dashboard-header">
        <div>
          <p className="greeting-label">С возвращением,</p>
          <h2 className="greeting-name">{user.fullName.split(' ')[0]}</h2>
        </div>
        <div className="security-badge">
          <ShieldCheck size={16} />
          <span>Защищено</span>
        </div>
      </motion.div>

      {/* 3D FLIPPABLE CARD */}
      <motion.div variants={itemVariants} className="card-container">
        <motion.div 
          className="card-flipper"
          animate={{ rotateY: isCardFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          onClick={() => setIsCardFlipped(!isCardFlipped)}
        >
          {/* ЛИЦЕВАЯ СТОРОНА */}
          <div className="premium-card card-front">
            <div className="card-noise" />
            <div className="card-glare" />

            {/* ИНДУСТРИАЛЬНЫЙ СТИКЕР (ЖАБА) */}
            <img 
              src="src/images/zhaba.png" 
              alt="Zhaba Sticker" 
              className="card-sticker" 
              draggable="false"
            />

            <div className="card-top">
              <div className="card-brand">BAKA <span>BLACK</span></div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setBalanceVisible(!balanceVisible);
                }}
                className="eye-button"
              >
                {balanceVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </motion.button>
            </div>

            <div className="card-balance-wrapper">
              <p className="balance-label">Доступный баланс</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={balanceVisible ? 'visible' : 'hidden'}
                  initial={{ opacity: 0, filter: "blur(4px)", y: 4 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  exit={{ opacity: 0, filter: "blur(4px)", y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="card-balance-content"
                >
                  {balanceVisible ? (
                    <>
                      <span className="balance-amount">{user.cardBalance?.toLocaleString('ru-RU') || '0'}</span>
                      <span className="balance-currency">KGS</span>
                    </>
                  ) : (
                    <span className="balance-hidden">*** ***</span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="card-bottom">
              <div className="card-number">
                <Cpu size={16} className="chip-icon" />
                <span>•••• •••• •••• {getLastDigits(user.cardNumber)}</span>
              </div>
              <div className="card-system">ELKART</div>
            </div>
          </div>

          {/* ОБРАТНАЯ СТОРОНА */}
          <div className="premium-card card-back">
            <div className="card-noise" />
            
            <div className="card-magnetic-stripe" />
            
            <div className="card-back-content">
              <div className="card-signature-panel">
                <div className="signature-strip" />
                <div className="cvc-wrapper">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={balanceVisible ? 'visible' : 'hidden'}
                      initial={{ opacity: 0, filter: "blur(4px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(4px)" }}
                      transition={{ duration: 0.2 }}
                      className="cvc-code"
                    >
                      {balanceVisible ? cardCVC : '***'}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              <div className="card-back-info">
                <div className="card-info-row">
                  <span className="info-label">Номер карты</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={balanceVisible ? 'visible' : 'hidden'}
                      initial={{ opacity: 0, filter: "blur(4px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(4px)" }}
                      transition={{ duration: 0.2 }}
                      className="info-value full-card-number"
                    >
                      {balanceVisible ? fullCardNumber : `•••• •••• •••• ${getLastDigits(user.cardNumber)}`}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <div className="card-info-row">
                  <span className="info-label">Действительна до</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={balanceVisible ? 'visible' : 'hidden'}
                      initial={{ opacity: 0, filter: "blur(4px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(4px)" }}
                      transition={{ duration: 0.2 }}
                      className="info-value"
                    >
                      {balanceVisible ? cardExpiry : '••/••'}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <div className="card-info-row">
                  <span className="info-label">Владелец</span>
                  <span className="info-value owner-name">{user.fullName.toUpperCase()}</span>
                </div>
              </div>

              <div className="card-back-footer">
                <span className="card-back-brand">BAKA BANK</span>
                <span className="card-back-system">ELKART</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* QUICK ACTIONS */}
      <motion.div variants={itemVariants} className="dashboard-section">
        <h3 className="section-title">Операции</h3>
        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <motion.button
              key={action.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(action.tab)}
              className="action-btn"
            >
              <div className="action-icon-wrapper">
                <action.icon className="action-icon" strokeWidth={2} />
              </div>
              <span>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ACCOUNTS */}
      <motion.div variants={itemVariants} className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Активы</h3>
          <motion.button whileTap={{ scale: 0.9 }} className="add-btn">
            <Plus size={18} />
          </motion.button>
        </div>

        <div className="accounts-list">
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('invest')} className="asset-row">
            <div className="asset-icon">
              <TrendingUp size={20} />
            </div>
            <div className="asset-info">
              <span className="asset-name">Брокерский счет</span>
              <span className="asset-type">M-Invest</span>
            </div>
            <div className="asset-values">
              <span className="asset-balance">{user.investBalance?.toLocaleString('ru-RU') || '0'} <span>с</span></span>
            </div>
            <ArrowUpRight size={18} className="asset-arrow" />
          </motion.div>

          <motion.div whileTap={{ scale: 0.98 }} className="asset-row">
            <div className="asset-icon">
              <Banknote size={20} />
            </div>
            <div className="asset-info">
              <span className="asset-name">Копилка</span>
              <span className="asset-type">Накопительный</span>
            </div>
            <div className="asset-values">
              <span className="asset-balance">{user.piggyBalance?.toLocaleString('ru-RU') || '0'} <span>с</span></span>
            </div>
            <ArrowUpRight size={18} className="asset-arrow" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}