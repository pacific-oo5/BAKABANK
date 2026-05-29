import React, { useState } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { PiggyBank, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/piggy.css';

export default function Piggy() {
  const { user, setUser } = useTradingStore();

  if (!user || !user.id) {
    return <div className="piggy-container" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>Загрузка...</div>;
  }

  const [activeMode, setActiveMode] = useState('deposit'); // 'deposit' или 'withdraw'
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Укажите корректную сумму');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/piggy/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: amt })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setUser(data.user);
        setAmount('');
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Укажите корректную сумму');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/piggy/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: amt })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setUser(data.user);
        setAmount('');
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 20000];

  return (
    <div className="piggy-container">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
        success: { iconTheme: { primary: 'var(--color-accent-success)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--color-accent-error)', secondary: '#fff' } }
      }} />

      <h2 className="piggy-title">Копилка</h2>
      <p className="piggy-subtitle">Накопительный счет без процентов</p>

      {/* БАЛАНС КОПИЛКИ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="piggy-balance-card"
      >
        <div className="piggy-icon-wrapper">
          <PiggyBank size={32} strokeWidth={2.5} />
        </div>
        <span className="piggy-label">Накоплено в копилке</span>
        <h1 className="piggy-amount">
          {user.piggyBalance?.toLocaleString('ru-RU') || '0'} <span className="piggy-currency">сом</span>
        </h1>
      </motion.div>

      {/* ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМА */}
      <div className="mode-tabs">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveMode('deposit')}
          className={`mode-tab ${activeMode === 'deposit' ? 'active' : ''}`}
        >
          <ArrowDownToLine size={20} />
          Пополнить
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveMode('withdraw')}
          className={`mode-tab ${activeMode === 'withdraw' ? 'active' : ''}`}
        >
          <ArrowUpFromLine size={20} />
          Снять
        </motion.button>
      </div>

      {/* ФОРМА ПОПОЛНЕНИЯ */}
      {activeMode === 'deposit' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="piggy-form-card"
        >
          <div className="balance-info">
            <Wallet size={18} />
            <span>Доступно на карте: {user.cardBalance?.toLocaleString('ru-RU')} с</span>
          </div>

          <form onSubmit={handleDeposit}>
            <div className="input-group">
              <label className="input-label">Сумма пополнения</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="piggy-input"
                required
              />
            </div>

            <div className="quick-amounts">
              {quickAmounts.map(amt => (
                <motion.button
                  key={amt}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAmount(amt.toString())}
                  className="quick-amount-btn"
                >
                  {amt.toLocaleString()} с
                </motion.button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="piggy-submit-btn deposit"
            >
              {loading ? 'Пополнение...' : 'Пополнить копилку'}
            </motion.button>
          </form>
        </motion.div>
      )}

      {/* ФОРМА СНЯТИЯ */}
      {activeMode === 'withdraw' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="piggy-form-card"
        >
          <div className="balance-info">
            <PiggyBank size={18} />
            <span>В копилке: {user.piggyBalance?.toLocaleString('ru-RU')} с</span>
          </div>

          <form onSubmit={handleWithdraw}>
            <div className="input-group">
              <label className="input-label">Сумма снятия</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="piggy-input"
                required
              />
            </div>

            <div className="quick-amounts">
              {quickAmounts.map(amt => (
                <motion.button
                  key={amt}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAmount(amt.toString())}
                  className="quick-amount-btn"
                >
                  {amt.toLocaleString()} с
                </motion.button>
              ))}
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setAmount(user.piggyBalance?.toString() || '0')}
                className="quick-amount-btn all"
              >
                Всё
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="piggy-submit-btn withdraw"
            >
              {loading ? 'Снятие...' : 'Снять на карту'}
            </motion.button>
          </form>
        </motion.div>
      )}

      {/* ИНФОРМАЦИОННЫЙ БЛОК */}
      <div className="piggy-info-block">
        <h4 className="info-title">О копилке</h4>
        <ul className="info-list">
          <li>Безопасное хранение накоплений отдельно от основной карты</li>
          <li>Мгновенное пополнение и снятие без комиссий</li>
          <li>Защита от импульсивных трат</li>
        </ul>
      </div>
    </div>
  );
}
