import React, { useState } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { CreditCard, Send, TrendingUp, Banknote, Smartphone, Eye, EyeOff, Wallet, PiggyBank, Plus, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/dashboard.css';

export default function Main() {
  const { user, setActiveTab } = useTradingStore();
  const [balanceVisible, setBalanceVisible] = useState(true);

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
    <div className="dashboard">
      {/* PREMIUM CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card"
      >
        <div className="card-noise" />
        <div className="card-gradient" />

        <div className="card-header">
          <div className="card-label">Дебетовая карта</div>
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
          <div className="card-chip" />
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
    </div>
  );
}
