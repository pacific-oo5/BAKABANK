import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { CreditCard, Calendar, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/credits.css';

export default function Credits() {
  const { user, setUser } = useTradingStore();
  
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Предотвращаем крах рендера, если Zustand еще не поднял сессию
  if (!user || !user.id) {
    return <div className="credits-container" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>Загрузка кредитного скоринга...</div>;
  }

  const [activeCredit, setActiveCredit] = useState(null);
  const [amount, setAmount] = useState(50000);
  const [term, setTerm] = useState(12);

  const getRate = (months) => {
    if (months <= 6) return 14;  
    if (months <= 12) return 18; 
    return 24;                   
  };

  const rate = getRate(term);
  const monthlyRate = rate / 100 / 12;
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
  const totalToPay = monthlyPayment * term;

  const fetchActiveCredit = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/credit/active/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveCredit(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchActiveCredit();
  }, [user.id]);

  const handleTakeCredit = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/credit/take`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount, termMonths: term, rate })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setUser(data.user);
        fetchActiveCredit();
      } else {
        toast.error(data.error);
      }
    } catch (e) { toast.error('Ошибка сети'); }
  };

  const handlePayCredit = async (sum) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/credit/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, payAmount: sum })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setUser(data.user);
        fetchActiveCredit();
      } else {
        toast.error(data.error);
      }
    } catch (e) { toast.error('Ошибка сети'); }
  };

  return (
    <div className="credits-container">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
        success: { iconTheme: { primary: 'var(--color-accent-success)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--color-accent-error)', secondary: '#fff' } }
      }} />

      {activeCredit ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="active-credit-card"
        >
          <div className="credit-badge">
            <CheckCircle size={14} />
            Активный кредит
          </div>
          <span className="credit-label">Остаток долга к выплате</span>
          <h1 className="credit-sum">
            <DollarSign size={28} />
            {Math.round(activeCredit.remainingAmount).toLocaleString('ru-RU')} <u>с</u>
          </h1>

          <div className="credit-info-grid">
            <div className="credit-info-box">
              <CreditCard size={18} color="var(--color-text-tertiary)" />
              <span className="credit-label">Ежемесячный платеж</span>
              <span className="credit-info-value">{Math.round(activeCredit.monthlyPayment).toLocaleString()} с</span>
            </div>
            <div className="credit-info-box">
              <Calendar size={18} color="var(--color-accent-error)" />
              <span className="credit-label">Дата списания</span>
              <span className="credit-info-value danger">{activeCredit.nextPaymentDate}</span>
            </div>
          </div>

          <div className="credit-actions">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePayCredit(activeCredit.monthlyPayment)}
              className="credit-pay-btn"
            >
              Внести плановый платеж ({Math.round(activeCredit.monthlyPayment).toLocaleString()} с)
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePayCredit(activeCredit.remainingAmount)}
              className="credit-close-btn"
            >
              Погасить досрочно всю сумму
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div>
          <h2 className="credits-title">Кредитный конвейер</h2>
          <p className="credits-subtitle">Одобрение банком за 5 секунд без справок и поручителей</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="calculator-card"
          >
            <div className="range-group">
              <div className="range-header">
                <span className="credit-label">Сумма кредита</span>
                <span className="range-value">{amount.toLocaleString()} сомов</span>
              </div>
              <input
                type="range"
                min="5000"
                max="300000"
                step="5000"
                value={amount}
                onChange={e => setAmount(+e.target.value)}
                className="range-slider"
              />
            </div>

            <div className="range-group">
              <div className="range-header">
                <span className="credit-label">Срок кредитования</span>
                <span className="range-value">{term} месяцев</span>
              </div>
              <div className="tabs-container">
                {[3, 6, 12, 24].map(m => (
                  <motion.button
                    key={m}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTerm(m)}
                    className={`tab-item ${term === m ? 'active' : ''}`}
                  >
                    {m} мес
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="summary-panel">
              <div className="summary-row success">
                <span>Ставка банка:</span>
                <span>{rate}% годовых</span>
              </div>
              <div className="summary-row">
                <span>Ежемесячный платеж:</span>
                <span>{Math.round(monthlyPayment).toLocaleString()} с/мес</span>
              </div>
              <div className="summary-row highlight">
                <span>Итого к выплате:</span>
                <span>{Math.round(totalToPay).toLocaleString()} с</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleTakeCredit}
              className="take-credit-btn"
            >
              Получить деньги наличными на карту
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
}