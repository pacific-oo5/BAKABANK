import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { TrendingUp, TrendingDown, X, BarChart3, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/invest.css';

export default function Invest() {
  const { user, setUser } = useTradingStore();
  const [market, setMarket] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [buyQty, setBuyQty] = useState(1);
  const [loading, setLoading] = useState(false);

  // Подгружаем данные рынка и портфеля
  const refreshData = async () => {
    try {
      const mRes = await fetch(`${API_BASE_URL}/api/invest/market`);
      const pRes = await fetch(`${API_BASE_URL}/api/invest/portfolio/${user.id}`);
      const uRes = await fetch(`${API_BASE_URL}/api/user/profile/${user.id}`);
      
      setMarket(await mRes.json());
      setPortfolio(await pRes.json());
      setUser(await uRes.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 3000); // Обновляем рынок каждые 3 сек
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
        toast.success(`Ква! Куплено ${buyQty} шт. ${selectedStock.symbol}`);
        refreshData();
        setSelectedStock(null);
      } else {
        const d = await res.json();
        toast.error(d.error);
      }
    } catch (e) {
      toast.error('Ошибка сети');
    }
    setLoading(false);
  };

  return (
    <div className="invest-container">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
        success: { iconTheme: { primary: 'var(--color-accent-success)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--color-accent-error)', secondary: '#fff' } }
      }} />

      {/* 1. ПОРТФЕЛЬ ИНВЕСТОРА */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="portfolio-summary"
      >
        <div>
          <span className="portfolio-label">Инвест-баланс</span>
          <h2 className="portfolio-value">
            <DollarSign size={24} />
            {user.investBalance?.toLocaleString()} <u>с</u>
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="portfolio-label">Прибыль за всё время</span>
          <h2 className="portfolio-value portfolio-profit">
            <TrendingUp size={20} />
            +14.20%
          </h2>
        </div>
      </motion.div>

      {/* 2. СПИСОК ДОСТУПНЫХ АКЦИЙ */}
      <h3 className="market-section-title">Рынок ценных бумаг</h3>
      <div className="market-grid">
        {market.map((stock, idx) => (
          <motion.div
            key={stock.symbol}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedStock(stock)}
            className={`stock-card ${selectedStock?.symbol === stock.symbol ? 'active' : ''}`}
          >
            <div className="stock-header">
              <span className="stock-symbol">{stock.symbol}</span>
              <span className={`stock-change ${stock.change > 0 ? 'positive' : 'negative'}`}>
                {stock.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stock.change)}%
              </span>
            </div>
            <div className="stock-price">{stock.price.toLocaleString()} с</div>
            <span className="stock-name">{stock.name}</span>
          </motion.div>
        ))}
      </div>

      {/* 3. ТОРГОВЫЙ ТЕРМИНАЛ (ОТКРЫВАЕТСЯ ПРИ ВЫБОРЕ) */}
      <AnimatePresence>
        {selectedStock && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="trading-terminal"
          >
            <div className="terminal-header">
              <h4 className="terminal-title">
                <BarChart3 size={20} />
                Торговля: {selectedStock.symbol}
              </h4>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedStock(null)}
                className="terminal-close-btn"
              >
                <X size={20} />
              </motion.button>
            </div>

            <div className="chart-placeholder">
              {/* Симуляция графика */}
              <div className="chart-bar" style={{ height: '40%' }} />
              <div className="chart-bar" style={{ height: '60%' }} />
              <div className="chart-bar" style={{ height: '50%' }} />
              <div className="chart-bar" style={{ height: '80%' }} />
            </div>

            <div className="trade-form">
              <div className="trade-input-group">
                <label className="portfolio-label">Количество</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={buyQty}
                  onChange={e => setBuyQty(e.target.value)}
                  className="trade-input"
                />
              </div>
              <div className="trade-total">
                <span className="trade-total-label">К оплате:</span>
                <div className="trade-total-value">{(selectedStock.price * buyQty).toLocaleString()} с</div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleBuy}
              disabled={loading}
              className="buy-button"
            >
              {loading ? 'Исполнение...' : `Купить ${selectedStock.symbol}`}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. МОИ АКТИВЫ */}
      <h3 className="market-section-title">Мои активы</h3>
      <div className="portfolio-list">
        {portfolio.length === 0 ? (
          <p className="empty-portfolio">У вас пока нет купленных ценных бумаг</p>
        ) : (
          portfolio.map((item, idx) => (
            <motion.div
              key={item.symbol}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="portfolio-item"
            >
              <div className="portfolio-item-left">
                <div className="portfolio-item-symbol">{item.symbol}</div>
                <div className="portfolio-item-qty">{item.totalQty} шт.</div>
              </div>
              <div className="portfolio-item-right">
                <div className="portfolio-item-value">{(item.totalQty * (market.find(s => s.symbol === item.symbol)?.price || 0)).toLocaleString()} с</div>
                <div className="portfolio-item-avg">Средняя: {item.avgPrice.toFixed(1)} с</div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}