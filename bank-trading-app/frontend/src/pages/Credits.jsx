import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { CreditCard, Calendar, CheckCircle, Percent, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/credits.css';

const springConfig = { type: "spring", stiffness: 400, damping: 30 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: springConfig }
};

export default function Credits() {
  const { user, setUser } = useTradingStore();
  
  if (!user || !user.id) {
    return (
      <div className="credits-loading">
        <div className="spinner-util" />
        <span>СИНХРОНИЗАЦИЯ СКОРИНГА...</span>
      </div>
    );
  }

  const [activeCredit, setActiveCredit] = useState(null);
  const [amount, setAmount] = useState(50000);
  const [term, setTerm] = useState(12);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/credit/take`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount, termMonths: term, rate })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('ЛИНИЯ ОДОБРЕНА');
        setUser(data.user);
        fetchActiveCredit();
      } else {
        toast.error(data.error || 'ОТКАЗ СКОРИНГА');
      }
    } catch (e) { toast.error('ОШИБКА СВЯЗИ'); }
    finally { setLoading(false); }
  };

  const handlePayCredit = async (sum) => {
    if (sum > user.cardBalance) {
      toast.error('НЕДОСТАТОЧНО СРЕДСТВ');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/credit/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, payAmount: sum })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('ТРАНЗАКЦИЯ УСПЕШНА');
        setUser(data.user);
        fetchActiveCredit();
      } else {
        toast.error(data.error);
      }
    } catch (e) { toast.error('ОШИБКА СВЯЗИ'); }
    finally { setLoading(false); }
  };

  return (
    <div className="credits-container">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1c1c1e', color: '#fff', border: '1px solid #333' } }} />

      <AnimatePresence mode="wait">
        {activeCredit ? (
          <motion.div key="active" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }} className="subscreen-wrapper">
            <motion.div variants={itemVariants} className="credits-header">
              <h2 className="credits-title">Ваш контракт</h2>
              <div className="status-badge">
                <CheckCircle size={14} /> АКТИВЕН
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="invoice-card">
              <div className="invoice-top">
                <span className="util-label">ТЕКУЩАЯ ЗАДОЛЖЕННОСТЬ</span>
                <h1 className="invoice-sum">
                  {Math.round(activeCredit.remainingAmount).toLocaleString('ru-RU')} <span>KGS</span>
                </h1>
              </div>

              <div className="invoice-grid">
                <div className="invoice-cell border-right border-bottom">
                  <span className="util-label">ПЛАНОВЫЙ ПЛАТЕЖ</span>
                  <div className="cell-value">{Math.round(activeCredit.monthlyPayment).toLocaleString('ru-RU')} <span>с</span></div>
                  <CreditCard size={16} className="cell-icon" />
                </div>
                <div className="invoice-cell border-bottom">
                  <span className="util-label">ДАТА СПИСАНИЯ</span>
                  <div className="cell-value danger">{activeCredit.nextPaymentDate}</div>
                  <Calendar size={16} className="cell-icon danger" />
                </div>
              </div>

              <div className="invoice-actions">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePayCredit(activeCredit.monthlyPayment)}
                  disabled={loading}
                  className="util-submit-btn"
                >
                  {loading ? 'ОБРАБОТКА...' : `ВНЕСТИ ПЛАТЕЖ (${Math.round(activeCredit.monthlyPayment).toLocaleString()} с)`}
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePayCredit(activeCredit.remainingAmount)}
                  disabled={loading}
                  className="util-ghost-btn danger-hover"
                >
                  ПОГАСИТЬ ПОЛНОСТЬЮ
                </motion.button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="warning-box">
              <ShieldAlert size={20} className="warning-icon" />
              <p>Внимание: Нарушение графика платежей приведет к блокировке счетов и передаче дела в бюро кредитных историй.</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="new" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }} className="subscreen-wrapper">
            <motion.div variants={itemVariants}>
              <h2 className="credits-title">Кредитная линия</h2>
              <p className="credits-subtitle">Моментальный скоринг и зачисление на BAKA BLACK</p>
            </motion.div>

            <motion.div variants={itemVariants} className="calculator-box">
              
              {/* Слайдер суммы */}
              <div className="calc-group">
                <div className="calc-header">
                  <span className="util-label">ОБЪЕМ ФИНАНСИРОВАНИЯ</span>
                  <span className="calc-value">{amount.toLocaleString('ru-RU')} <span>KGS</span></span>
                </div>
                <input
                  type="range"
                  min="5000" max="300000" step="5000"
                  value={amount}
                  onChange={e => setAmount(+e.target.value)}
                  className="util-slider"
                />
                <div className="slider-marks">
                  <span>5k</span>
                  <span>300k</span>
                </div>
              </div>

              {/* Табы сроков */}
              <div className="calc-group">
                <div className="calc-header">
                  <span className="util-label">ПЕРИОД ПОГАШЕНИЯ</span>
                  <span className="calc-value">{term} <span>МЕС</span></span>
                </div>
                <div className="util-tabs">
                  {[3, 6, 12, 24].map(m => (
                    <motion.button
                      key={m}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTerm(m)}
                      className={`util-tab-btn ${term === m ? 'active' : ''}`}
                    >
                      {m}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Расчетный лист */}
              <div className="calc-summary">
                <div className="summary-row">
                  <span className="summary-label">Базовая ставка (APR)</span>
                  <div className="summary-val-box">
                    <span>{rate}%</span>
                    <Percent size={14} className="val-icon" />
                  </div>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Плановый платеж</span>
                  <span className="summary-val">{Math.round(monthlyPayment).toLocaleString('ru-RU')} с / мес</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total">
                  <span className="summary-label">Сумма к возврату</span>
                  <span className="summary-val">{Math.round(totalToPay).toLocaleString('ru-RU')} с</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleTakeCredit}
                disabled={loading}
                className="util-submit-btn"
              >
                {loading ? 'СКОРИНГ...' : 'АКТИВИРОВАТЬ ЛИНИЮ'}
              </motion.button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}