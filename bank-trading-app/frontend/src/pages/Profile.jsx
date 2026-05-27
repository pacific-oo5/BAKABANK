import React, { useState } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { User, CreditCard, Phone, Eye, EyeOff, LogOut, ChevronRight, Wallet, TrendingUp, PiggyBank, Shield, Bell, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/profile.css';

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
      toast.error('Номер телефона не может быть пустым');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/update-phone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newPhoneNumber: newPhone.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Ошибка при обновлении номера');
        setLoading(false);
        return;
      }

      setUser(data.user);
      toast.success('Номер телефона успешно изменен!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Ошибка связи с сервером');
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
    <div className="profile-container" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
      <div className="spinner" />
      Загрузка профиля...
    </div>
  );

  return (
    <div className="profile-container">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
        success: { iconTheme: { primary: 'var(--color-accent-success)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--color-accent-error)', secondary: '#fff' } }
      }} />

      {/* HEADER ПРОФИЛЯ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-header"
      >
        <div className="profile-avatar-large">
          <User size={40} color="var(--color-accent-success)" strokeWidth={2.5} />
        </div>
        <h2 className="profile-name">{user.fullName}</h2>
        <div className="profile-id-badge">ID: {user.id}</div>
      </motion.div>

      {/* КАРТОЧКА С БАЛАНСАМИ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="profile-balance-card"
      >
        <div className="balance-card-header">
          <span className="balance-card-label">Основная карта</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setCardVisible(!cardVisible)}
            className="balance-eye-button"
          >
            {cardVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </motion.button>
        </div>

        <h1 className="balance-amount-large">
          {user.cardBalance?.toLocaleString('ru-RU')} <span>с</span>
        </h1>

        <div className="card-number-display">
          <CreditCard size={16} />
          <span>{cardVisible ? user.cardNumber : maskCardNumber(user.cardNumber)}</span>
        </div>
      </motion.div>

      {/* ДРУГИЕ СЧЕТА */}
      <div className="profile-accounts-grid">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mini-account-card"
        >
          <div className="mini-account-icon" style={{ background: 'rgba(48, 209, 88, 0.15)', color: 'var(--color-accent-success)' }}>
            <TrendingUp size={20} />
          </div>
          <span className="mini-account-label">M-Invest</span>
          <span className="mini-account-value">{user.investBalance?.toLocaleString('ru-RU')} с</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="mini-account-card"
        >
          <div className="mini-account-icon" style={{ background: 'rgba(255, 204, 0, 0.15)', color: 'var(--color-accent-warning)' }}>
            <PiggyBank size={20} />
          </div>
          <span className="mini-account-label">Копилка</span>
          <span className="mini-account-value">{user.piggyBalance?.toLocaleString('ru-RU')} с</span>
        </motion.div>
      </div>

      {/* ЛИЧНЫЕ ДАННЫЕ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="profile-section"
      >
        <h3 className="profile-section-title">Личные данные</h3>

        <div className="profile-data-card">
          <div className="data-row">
            <div className="data-row-header">
              <Phone size={18} color="var(--color-text-tertiary)" />
              <span className="data-label">Номер телефона</span>
            </div>
            {!isEditing ? (
              <div className="data-row-content">
                <span className="data-value">{user.phoneNumber}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditing(true)}
                  className="edit-button"
                >
                  Изменить
                </motion.button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePhone} className="inline-form">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="inline-input"
                  disabled={loading}
                  required
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="submit"
                  disabled={loading}
                  className="save-button"
                >
                  {loading ? '...' : 'Ок'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => { setIsEditing(false); setNewPhone(user.phoneNumber); }}
                  className="cancel-button"
                  disabled={loading}
                >
                  ✕
                </motion.button>
              </form>
            )}
          </div>
        </div>
      </motion.div>

      {/* НАСТРОЙКИ И ДЕЙСТВИЯ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="profile-section"
      >
        <h3 className="profile-section-title">Сервисы</h3>

        <div className="profile-menu-list">
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => useTradingStore.getState().setActiveTab('invest')}
            className="menu-item"
          >
            <div className="menu-item-left">
              <div className="menu-icon-wrapper">
                <TrendingUp size={20} color="var(--color-accent-success)" />
              </div>
              <span>M-Invest (Инвестиции)</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </motion.div>

          <motion.div whileTap={{ scale: 0.98 }} className="menu-item">
            <div className="menu-item-left">
              <div className="menu-icon-wrapper">
                <Shield size={20} color="var(--color-accent-success)" />
              </div>
              <span>Безопасность</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </motion.div>

          <motion.div whileTap={{ scale: 0.98 }} className="menu-item">
            <div className="menu-item-left">
              <div className="menu-icon-wrapper">
                <Bell size={20} color="var(--color-accent-warning)" />
              </div>
              <span>Уведомления</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </motion.div>

          <motion.div whileTap={{ scale: 0.98 }} className="menu-item">
            <div className="menu-item-left">
              <div className="menu-icon-wrapper">
                <HelpCircle size={20} color="var(--color-text-tertiary)" />
              </div>
              <span>Помощь и поддержка</span>
            </div>
            <ChevronRight size={20} className="menu-arrow" />
          </motion.div>
        </div>
      </motion.div>

      {/* КНОПКА ВЫХОДА */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => {
          toast.success('Вы вышли из аккаунта');
          setTimeout(() => logout(), 1000);
        }}
        className="logout-button"
      >
        <LogOut size={20} />
        Выйти из аккаунта
      </motion.button>
    </div>
  );
}