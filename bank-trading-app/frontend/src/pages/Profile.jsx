import React, { useState } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { User, CreditCard, Phone, Eye, EyeOff, LogOut, ChevronRight, TrendingUp, PiggyBank, Shield, Bell, HelpCircle, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/profile.css';

// Физика Эмила Ковальски
const springConfig = { type: "spring", stiffness: 400, damping: 30 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: springConfig }
};

export default function Profile() {
  const { user, setUser, logout } = useTradingStore();
  const [newPhone, setNewPhone] = useState(user?.phoneNumber || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!newPhone.trim()) {
      toast.error('Номер телефона пуст');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/update-phone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPhoneNumber: newPhone.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Ошибка обновления');
        setLoading(false);
        return;
      }

      setUser(data.user);
      toast.success('Телефон обновлен');
      setIsEditing(false);
    } catch (err) {
      toast.error('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  const maskCardNumber = (number) => {
    if (!number) return '•••• •••• •••• ••••';
    const parts = number.split(' ');
    return `${parts[0]} •••• •••• ${parts[3] || '••••'}`;
  };

  if (!user) return (
    <div className="profile-loading">
      <div className="spinner-util" />
      <span>Инициализация профиля...</span>
    </div>
  );

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="profile-container"
    >
      <Toaster position="top-center" toastOptions={{ style: { background: '#1c1c1e', color: '#fff', border: '1px solid #333' } }} />

      {/* HEADER ПРОФИЛЯ */}
      <motion.div variants={itemVariants} className="profile-header">
        <div className="profile-avatar-brutal">
          <span className="avatar-initial">{user.fullName.charAt(0)}</span>
        </div>
        <h2 className="profile-name">{user.fullName}</h2>
        <div className="profile-id-badge">ID_{user.id}</div>
      </motion.div>

      {/* КАРТОЧКА С БАЛАНСАМИ */}
      <motion.div variants={itemVariants} className="profile-balance-card">
        <div className="card-noise" />
        
        <div className="balance-card-header">
          <span className="balance-card-label">Основной актив</span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCardVisible(!cardVisible)} className="eye-button">
            {cardVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </motion.button>
        </div>

        <div className="balance-amount-wrapper">
          <AnimatePresence mode="wait">
            <motion.h1
              key={cardVisible ? 'visible' : 'hidden'}
              initial={{ opacity: 0, filter: "blur(4px)", y: 4 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(4px)", y: -4 }}
              transition={{ duration: 0.2 }}
              className="balance-amount-large"
            >
              {user.cardBalance?.toLocaleString('ru-RU')} <span>KGS</span>
            </motion.h1>
          </AnimatePresence>
        </div>

        <div className="card-number-display">
          <CreditCard size={16} className="card-icon-muted" />
          <span>{cardVisible ? user.cardNumber : maskCardNumber(user.cardNumber)}</span>
        </div>
      </motion.div>

      {/* ДРУГИЕ СЧЕТА (Утилитарная сетка) */}
      <motion.div variants={itemVariants} className="profile-accounts-grid">
        <motion.div whileTap={{ scale: 0.97 }} className="mini-account-card">
          <div className="mini-account-icon">
            <TrendingUp size={20} />
          </div>
          <div className="mini-account-info">
            <span className="mini-account-label">M-Invest</span>
            <span className="mini-account-value">{user.investBalance?.toLocaleString('ru-RU')} <span>с</span></span>
          </div>
        </motion.div>

        <motion.div whileTap={{ scale: 0.97 }} className="mini-account-card">
          <div className="mini-account-icon">
            <PiggyBank size={20} />
          </div>
          <div className="mini-account-info">
            <span className="mini-account-label">Копилка</span>
            <span className="mini-account-value">{user.piggyBalance?.toLocaleString('ru-RU')} <span>с</span></span>
          </div>
        </motion.div>
      </motion.div>

      {/* ЛИЧНЫЕ ДАННЫЕ (Терминальный инпут) */}
      <motion.div variants={itemVariants} className="profile-section">
        <h3 className="profile-section-title">Системные данные</h3>
        
        <div className="data-card">
          <div className="data-row">
            <div className="data-row-header">
              <Phone size={16} className="icon-muted" />
              <span className="data-label">ТЕЛЕФОН / ЛОГИН</span>
            </div>
            
            <div className="data-content-wrapper">
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div 
                    key="display"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)", position: "absolute" }}
                    className="data-display"
                  >
                    <span className="data-value">{user.phoneNumber}</span>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsEditing(true)} className="edit-btn">
                      Изменить
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="edit"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)", position: "absolute" }}
                    onSubmit={handleUpdatePhone} 
                    className="data-edit-form"
                  >
                    <div className="terminal-input-wrapper">
                      <span className="terminal-prefix">&gt;</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                        className="terminal-input"
                        disabled={loading}
                        autoFocus
                        required
                      />
                    </div>
                    <div className="edit-actions">
                      <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => { setIsEditing(false); setNewPhone(user.phoneNumber); }} className="action-btn cancel" disabled={loading}>
                        <X size={16} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} type="submit" className="action-btn save" disabled={loading}>
                        {loading ? <span className="spinner-mini" /> : <Check size={16} />}
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* НАСТРОЙКИ И ДЕЙСТВИЯ (Монохромное меню) */}
      <motion.div variants={itemVariants} className="profile-section">
        <h3 className="profile-section-title">Сервисы</h3>

        <div className="menu-list">
          {[
            { icon: TrendingUp, label: 'Инвестиции (M-Invest)', action: () => useTradingStore.getState().setActiveTab('invest') },
            { icon: Shield, label: 'Безопасность', action: () => {} },
            { icon: Bell, label: 'Уведомления', action: () => {} },
            { icon: HelpCircle, label: 'Поддержка', action: () => {} }
          ].map((item, idx) => (
            <motion.div key={idx} whileTap={{ scale: 0.98 }} onClick={item.action} className="menu-item">
              <div className="menu-item-left">
                <div className="menu-icon"><item.icon size={18} /></div>
                <span>{item.label}</span>
              </div>
              <ChevronRight size={18} className="menu-arrow" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* КНОПКА ВЫХОДА (Brutal Error) */}
      <motion.button
        variants={itemVariants}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          toast.success('Сессия завершена');
          setTimeout(() => logout(), 1000);
        }}
        className="logout-button"
      >
        <LogOut size={18} />
        ЗАВЕРШИТЬ СЕАНС
      </motion.button>
    </motion.div>
  );
}