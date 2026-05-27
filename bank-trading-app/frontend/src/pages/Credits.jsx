import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';

export default function Credits() {
  const { user, setUser } = useTradingStore();
  
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Предотвращаем крах рендера, если Zustand еще не поднял сессию
  if (!user || !user.id) {
    return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Загрузка кредитного скоринга...</div>;
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
      const res = await fetch(`http://localhost:3001/api/credit/active/${user.id}`);
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
      const res = await fetch('http://localhost:3001/api/credit/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount, termMonths: term, rate })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setUser(data.user);
        fetchActiveCredit();
      } else {
        alert(data.error);
      }
    } catch (e) { alert('Ошибка сети'); }
  };

  const handlePayCredit = async (sum) => {
    try {
      const res = await fetch('http://localhost:3001/api/credit/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, payAmount: sum })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setUser(data.user);
        fetchActiveCredit();
      } else {
        alert(data.error);
      }
    } catch (e) { alert('Ошибка сети'); }
  };

  return (
    <div style={containerStyle}>
      {activeCredit ? (
        <div style={activeCardStyle}>
          <div style={badgeStyle}>Активный кредит</div>
          <span style={labelStyle}>Остаток долга к выплате</span>
          <h1 style={creditSumStyle}>{Math.round(activeCredit.remainingAmount).toLocaleString('ru-RU')} <u>с</u></h1>
          
          <div style={infoGridStyle}>
            <div style={infoBoxStyle}>
              <span style={labelStyle}>Ежемесячный платеж</span>
              <span style={infoValueStyle}>{Math.round(activeCredit.monthlyPayment).toLocaleString()} с</span>
            </div>
            <div style={infoBoxStyle}>
              <span style={labelStyle}>Дата списания</span>
              <span style={{...infoValueStyle, color: '#ff4d4f'}}>{activeCredit.nextPaymentDate}</span>
            </div>
          </div>

          <div style={actionBlockStyle}>
            <button onClick={() => handlePayCredit(activeCredit.monthlyPayment)} style={payBtnStyle}>
              Внести плановый платеж ({Math.round(activeCredit.monthlyPayment).toLocaleString()} с)
            </button>
            <button onClick={() => handlePayCredit(activeCredit.remainingAmount)} style={closeFullBtnStyle}>
              Погасить досрочно всю сумму
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 style={titleStyle}>Кредитный конвейер</h2>
          <p style={subtitleStyle}>Одобрение банком за 5 секунд без справок и поручителей</p>

          <div style={calculatorCardStyle}>
            <div style={rangeGroupStyle}>
              <div style={rangeHeaderStyle}>
                <span style={labelStyle}>Сумма кредита</span>
                <span style={rangeValueStyle}>{amount.toLocaleString()} сомов</span>
              </div>
              <input type="range" min="5000" max="300000" step="5000" value={amount} onChange={e => setAmount(+e.target.value)} style={sliderStyle} />
            </div>

            <div style={rangeGroupStyle}>
              <div style={rangeHeaderStyle}>
                <span style={labelStyle}>Срок кредитования</span>
                <span style={rangeValueStyle}>{term} месяцев</span>
              </div>
              <div style={tabsContainerStyle}>
                {[3, 6, 12, 24].map(m => (
                  <button key={m} onClick={() => setTerm(m)} style={tabItemStyle(term === m)}>
                    {m} мес
                  </button>
                ))}
              </div>
            </div>

            <div style={summaryPanelStyle}>
              <div style={summaryRowStyle}>
                <span>Ставка банка:</span>
                <span style={{ fontWeight: '700', color: '#11bb77' }}>{rate}% годовых</span>
              </div>
              <div style={summaryRowStyle}>
                <span>Ежемесячный платеж:</span>
                <span style={{ fontWeight: '700' }}>{Math.round(monthlyPayment).toLocaleString()} с/мес</span>
              </div>
              <div style={summaryRowStyle}>
                <span>Итого к выплате:</span>
                <span style={{ fontWeight: '800', color: '#fff', fontSize: '16px' }}>{Math.round(totalToPay).toLocaleString()} с</span>
              </div>
            </div>

            <button onClick={handleTakeCredit} style={takeBtnStyle}>
              Получить деньги наличными на карту
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const containerStyle = { color: '#fff', paddingBottom: '40px' };
const titleStyle = { fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', textAlign: 'left' };
const subtitleStyle = { fontSize: '13px', color: '#666d75', margin: '0 0 24px 0', textAlign: 'left' };
const calculatorCardStyle = { background: '#14161a', padding: '24px', borderRadius: '24px', border: '1px solid #202329' };
const rangeGroupStyle = { marginBottom: '24px', textAlign: 'left' };
const rangeHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const labelStyle = { fontSize: '12px', color: '#666d75' };
const rangeValueStyle = { fontSize: '16px', fontWeight: '700' };
const sliderStyle = { width: '100%', accentColor: '#11bb77', cursor: 'pointer' };
const tabsContainerStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginTop: '6px' };
const tabItemStyle = (active) => ({ padding: '12px', borderRadius: '12px', border: 'none', background: active ? '#11bb77' : '#1c1f26', color: active ? '#000' : '#fff', fontWeight: '700', cursor: 'pointer', transition: '0.2s' });
const summaryPanelStyle = { background: '#1c1f26', padding: '16px', borderRadius: '18px', marginBottom: '24px', border: '1px solid #202329' };
const summaryRowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#a0a5ad', marginBottom: '10px' };
const takeBtnStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#11bb77', color: '#000', fontWeight: '700', fontSize: '15px', cursor: 'pointer' };
const activeCardStyle = { background: 'linear-gradient(135deg, #1c1f26, #14161a)', padding: '24px', borderRadius: '24px', border: '1px solid #202329', textAlign: 'left' };
const badgeStyle = { background: 'rgba(17, 187, 119, 0.15)', color: '#11bb77', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', display: 'inline-block', marginBottom: '16px' };
const creditSumStyle = { fontSize: '32px', fontWeight: '800', margin: '6px 0 24px 0' };
const infoGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' };
const infoBoxStyle = { background: '#0b0c0e', padding: '14px', borderRadius: '14px', border: '1px solid #202329' };
const infoValueStyle = { display: 'block', fontSize: '16px', fontWeight: '700', marginTop: '4px' };
const actionBlockStyle = { display: 'flex', flexDirection: 'column', gap: '10px' };
const payBtnStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#11bb77', color: '#000', fontWeight: '700', cursor: 'pointer' };
const closeFullBtnStyle = { width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid #333', background: 'none', color: '#aaa', fontWeight: '600', cursor: 'pointer' };