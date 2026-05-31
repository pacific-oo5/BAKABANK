import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { TrendingUp, TrendingDown, X, BarChart3, Briefcase, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/invest.css';

// Пружины Эмила Ковальски
const springConfig = { type: "spring", stiffness: 400, damping: 30 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  exit: { opacity: 0, filter: "blur(4px)", transition: { duration: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: springConfig }
};

// ИНДУСТРИАЛЬНЫЙ КОМПОНЕНТ: Анимированный счетчик цифр
const AnimatedNumber = ({ value, className = "" }) => (
  <div className={`animated-num-wrapper ${className}`}>
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: 15, opacity: 0, filter: "blur(2px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        exit={{ y: -15, opacity: 0, filter: "blur(2px)" }}
        transition={springConfig}
        className="animated-num"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </div>
);

export default function Invest() {
  const { user, setUser } = useTradingStore();
  const [market, setMarket] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [buyQty, setBuyQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    try {
      const mRes = await fetch(`${API_BASE_URL}/api/invest/market`);
      const pRes = await fetch(`${API_BASE_URL}/api/invest/portfolio/${user.id}`);
      const uRes = await fetch(`${API_BASE_URL}/api/user/profile/${user.id}`);
      
      if (mRes.ok) setMarket(await mRes.json());
      if (pRes.ok) setPortfolio(await pRes.json());
      if (uRes.ok) setUser(await uRes.json());
    } catch (e) { console.error('Ошибка терминала:', e); }
  };

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 3000); // Тик маркета: 3 секунды
    return () => clearInterval(timer);
  }, []);

  const handleBuy = async () => {
    if (!selectedStock) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/invest/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          symbol: selectedStock.symbol,
          quantity: buyQty,
          price: selectedStock.price
        })
      });
      if (res.ok) {
        toast.success(`TX_SUCCESS: ${buyQty}x ${selectedStock.symbol}`);
        refreshData();
        setSelectedStock(null);
        setBuyQty(1);
      } else {
        const d = await res.json();
        toast.error(d.error || 'TX_REJECTED');
      }
    } catch (e) {
      toast.error('ERR_NETWORK');
    }
    setLoading(false);
  };

  if (!user) return <div className="invest-loading"><div className="spinner-util"/><span>СОЕДИНЕНИЕ С БИРЖЕЙ...</span></div>;

  return (
    <div className="invest-container">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1c1c1e', color: '#fff', border: '1px solid #333' } }} />

      <motion.div variants={containerVariants} initial="hidden" animate="show" exit="exit" className="subscreen-wrapper">
        
        <motion.div variants={itemVariants} className="invest-header">
          <h2 className="invest-title">M-Invest</h2>
          <div className="status-badge">
            <Activity size={12} className="animate-pulse" /> LIVE
          </div>
        </motion.div>

        {/* 1. БАЛАНС (Терминальный блок) */}
        <motion.div variants={itemVariants} className="invest-balance-card">
          <div className="card-noise" />
          <div className="invest-balance-top">
            <span className="util-label">СВОБОДНЫЕ СРЕДСТВА (ФИАТ)</span>
            <span className="profit-badge positive"><TrendingUp size={12} /> +14.2%</span>
          </div>
          <div className="invest-balance-bottom">
            <AnimatedNumber value={user.investBalance?.toLocaleString('ru-RU')} className="invest-amount" />
            <span className="invest-currency">KGS</span>
          </div>
        </motion.div>

        {/* 2. РЫНОК (LIVE TICKERS) */}
        <motion.div variants={itemVariants}>
          <h4 className="section-label">Котировки активов</h4>
          <div className="market-list">
            {market.map((stock) => {
              const isPositive = stock.change >= 0;
              return (
                <motion.div
                  key={stock.symbol}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedStock(stock); setBuyQty(1); }}
                  className="ticker-row"
                >
                  <div className="ticker-left">
                    <span className="ticker-symbol">{stock.symbol}</span>
                    <span className="ticker-name">{stock.name}</span>
                  </div>
                  
                  {/* Мини-график (декоративный пульс) */}
                  <div className="ticker-chart">
                    <svg viewBox="0 0 100 30" className={`sparkline ${isPositive ? 'positive' : 'negative'}`}>
                      <polyline points="0,15 20,20 40,10 60,25 80,5 100,10" fill="none" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="ticker-right">
                    <AnimatedNumber 
                      value={stock.price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} 
                      className="ticker-price" 
                    />
                    <span className={`ticker-change ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : ''}{stock.change}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 3. ПОРТФЕЛЬ ИНВЕСТОРА */}
        <motion.div variants={itemVariants}>
          <h4 className="section-label">Содержимое портфеля</h4>
          <div className="portfolio-list">
            {portfolio.length === 0 ? (
              <div className="history-empty-state" style={{ height: 'auto', padding: '24px' }}>
                <span>ПОРТФЕЛЬ ПУСТ. ТРАНЗАКЦИЙ НЕТ.</span>
              </div>
            ) : (
              portfolio.map((item) => {
                const currentPrice = market.find(s => s.symbol === item.symbol)?.price || item.avgPrice;
                const totalVal = item.totalQty * currentPrice;
                
                return (
                  <div key={item.symbol} className="portfolio-row">
                    <div className="portfolio-icon">
                      <Briefcase size={18} />
                    </div>
                    <div className="portfolio-info">
                      <span className="portfolio-symbol">{item.symbol}</span>
                      <span className="portfolio-qty">Объем: {item.totalQty} ед.</span>
                    </div>
                    <div className="portfolio-values">
                      <AnimatedNumber value={totalVal.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} className="portfolio-total" />
                      <span className="portfolio-avg">Ср. цена: {item.avgPrice.toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

      </motion.div>

      {/* 4. ТОРГОВЫЙ ТЕРМИНАЛ (МОДАЛКА) */}
      <AnimatePresence>
        {selectedStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="invest-terminal-overlay"
            onClick={() => setSelectedStock(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="invest-terminal-box"
            >
              <div className="terminal-top">
                <div className="terminal-title-box">
                  <BarChart3 size={20} className="accent-icon" />
                  <h3>ТЕРМИНАЛ: {selectedStock.symbol}</h3>
                </div>
                <button onClick={() => setSelectedStock(null)} className="terminal-close-btn">
                  <X size={20} />
                </button>
              </div>

              <div className="terminal-quote-box">
                <span className="util-label">РЫНОЧНАЯ КОТИРОВКА</span>
                <div className="quote-value-row">
                  <AnimatedNumber value={selectedStock.price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} className="quote-price" />
                  <span className={`quote-change ${selectedStock.change >= 0 ? 'positive' : 'negative'}`}>
                    {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change}%
                  </span>
                </div>
              </div>

              <div className="util-form" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
                <div className="form-group">
                  <label className="form-label">ОБЪЕМ ПОКУПКИ (ЛОТЫ)</label>
                  <div className="terminal-input-wrapper">
                    <span className="terminal-prefix">QTY&gt;</span>
                    <input
                      type="number"
                      min="1"
                      value={buyQty}
                      onChange={e => setBuyQty(e.target.value)}
                      className="terminal-input"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="terminal-summary">
                  <span className="util-label">ИТОГО К СПИСАНИЮ</span>
                  <AnimatedNumber 
                    value={(selectedStock.price * (buyQty || 0)).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} 
                    className="terminal-total" 
                  />
                  <span className="form-hint">Баланс M-Invest: {user.investBalance?.toLocaleString('ru-RU')} с</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuy}
                  disabled={loading || !buyQty || buyQty <= 0}
                  className="util-submit-btn"
                >
                  {loading ? 'ИСПОЛНЕНИЕ ОРДЕРА...' : 'АВТОРИЗОВАТЬ ПОКУПКУ'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}