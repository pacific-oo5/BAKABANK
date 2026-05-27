import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';

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
      const mRes = await fetch('http://localhost:3001/api/invest/market');
      const pRes = await fetch(`http://localhost:3001/api/invest/portfolio/${user.id}`);
      const uRes = await fetch(`http://localhost:3001/api/user/profile/${user.id}`);
      
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
      const res = await fetch('http://localhost:3001/api/invest/buy', {
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
        alert(`Ква! Куплено ${buyQty} шт. ${selectedStock.symbol}`);
        refreshData();
      } else {
        const d = await res.json(); alert(d.error);
      }
    } catch (e) { alert('Ошибка сети'); }
    setLoading(false);
  };

  return (
    <div style={containerStyle}>
      {/* 1. ПОРТФЕЛЬ ИНВЕСТОРА */}
      <div style={portfolioSummaryStyle}>
        <div>
          <span style={labelStyle}>Инвест-баланс</span>
          <h2 style={valueStyle}>{user.investBalance?.toLocaleString()} <u>с</u></h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={labelStyle}>Прибыль за всё время</span>
          <h2 style={{ ...valueStyle, color: '#11bb77' }}>+14.20%</h2>
        </div>
      </div>

      {/* 2. СПИСОК ДОСТУПНЫХ АКЦИЙ */}
      <h3 style={sectionTitleStyle}>Рынок ценных бумаг</h3>
      <div style={marketGridStyle}>
        {market.map(stock => (
          <div key={stock.symbol} 
               onClick={() => setSelectedStock(stock)}
               style={stockCardStyle(selectedStock?.symbol === stock.symbol)}>
            <div style={stockHeaderStyle}>
              <span style={symbolStyle}>{stock.symbol}</span>
              <span style={changeStyle(stock.change)}>{stock.change > 0 ? '▲' : '▼'} {Math.abs(stock.change)}%</span>
            </div>
            <div style={priceStyle}>{stock.price.toLocaleString()} с</div>
            <span style={nameStyle}>{stock.name}</span>
          </div>
        ))}
      </div>

      {/* 3. ТОРГОВЫЙ ТЕРМИНАЛ (ОТКРЫВАЕТСЯ ПРИ ВЫБОРЕ) */}
      {selectedStock && (
        <div style={terminalStyle}>
          <div style={terminalHeaderStyle}>
            <h4>Торговля: {selectedStock.symbol}</h4>
            <button onClick={() => setSelectedStock(null)} style={closeBtnStyle}>✕</button>
          </div>
          
          <div style={chartPlaceholderStyle}>
            {/* Симуляция графика */}
            <div style={chartBar(40)} /><div style={chartBar(60)} /><div style={chartBar(50)} /><div style={chartBar(80)} />
          </div>

          <div style={tradeFormStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Количество</label>
              <input type="number" value={buyQty} onChange={e => setBuyQty(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <span style={labelStyle}>К оплате:</span>
              <div style={totalStyle}>{(selectedStock.price * buyQty).toLocaleString()} с</div>
            </div>
          </div>

          <button onClick={handleBuy} disabled={loading} style={buyBtnStyle}>
            {loading ? 'Исполнение...' : `Купить ${selectedStock.symbol}`}
          </button>
        </div>
      )}

      {/* 4. МОИ АКТИВЫ */}
      <h3 style={sectionTitleStyle}>Мои активы</h3>
      <div style={portfolioListStyle}>
        {portfolio.length === 0 ? (
          <p style={emptyStyle}>У вас пока нет купленных ценных бумаг</p>
        ) : (
          portfolio.map(item => (
            <div key={item.symbol} style={portfolioItemStyle}>
              <div style={{ textAlign: 'left' }}>
                <div style={symbolStyle}>{item.symbol}</div>
                <div style={nameStyle}>{item.totalQty} шт.</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={priceStyle}>{(item.totalQty * (market.find(s => s.symbol === item.symbol)?.price || 0)).toLocaleString()} с</div>
                <div style={{ fontSize: '11px', color: '#11bb77' }}>Средняя: {item.avgPrice.toFixed(1)} с</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// СТИЛИ (Professional Dark Terminal)
const containerStyle = { color: '#fff' };
const portfolioSummaryStyle = { background: 'linear-gradient(135deg, #1c1f26, #14161a)', padding: '24px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px', border: '1px solid #202329' };
const labelStyle = { fontSize: '12px', color: '#666d75', display: 'block', marginBottom: '4px' };
const valueStyle = { margin: 0, fontSize: '24px', fontWeight: '800' };

const sectionTitleStyle = { fontSize: '16px', fontWeight: '700', marginBottom: '16px', textAlign: 'left' };
const marketGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' };
const stockCardStyle = (active) => ({ background: '#14161a', padding: '16px', borderRadius: '20px', border: active ? '1px solid #11bb77' : '1px solid #202329', textAlign: 'left', cursor: 'pointer' });
const stockHeaderStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' };
const symbolStyle = { fontWeight: '800', fontSize: '15px' };
const changeStyle = (c) => ({ fontSize: '11px', color: c > 0 ? '#11bb77' : '#ff4d4f', fontWeight: '700' });
const priceStyle = { fontSize: '18px', fontWeight: '700' };
const nameStyle = { fontSize: '11px', color: '#666d75' };

const terminalStyle = { background: '#1c1f26', borderRadius: '24px 24px 0 0', padding: '24px', position: 'fixed', bottom: 76, left: 0, right: 0, borderTop: '2px solid #11bb77', zIndex: 1000, boxShadow: '0 -10px 30px rgba(0,0,0,0.5)' };
const terminalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const closeBtnStyle = { background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' };
const chartPlaceholderStyle = { height: '60px', display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #202329', paddingBottom: '10px' };
const chartBar = (h) => ({ width: '100%', height: `${h}%`, background: '#11bb77', opacity: 0.3, borderRadius: '4px' });

const tradeFormStyle = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' };
const inputGroupStyle = { textAlign: 'left', flex: 1 };
const inputStyle = { width: '80%', padding: '12px', borderRadius: '12px', border: '1px solid #202329', background: '#0b0c0e', color: '#fff', outline: 'none' };
const totalStyle = { fontSize: '22px', fontWeight: '800', color: '#11bb77' };
const buyBtnStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#11bb77', color: '#000', fontWeight: '700', cursor: 'pointer' };

const portfolioListStyle = { display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '40px' };
const portfolioItemStyle = { display: 'flex', justifyContent: 'space-between', background: '#14161a', padding: '16px', borderRadius: '18px', border: '1px solid #202329' };
const emptyStyle = { color: '#525a64', fontSize: '14px', fontStyle: 'italic', padding: '20px' };