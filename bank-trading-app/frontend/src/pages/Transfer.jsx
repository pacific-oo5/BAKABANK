import React, { useState } from 'react';
import { useTradingStore } from '../store/useTradingStore';

export default function Transfers() {
  const { user, setUser } = useTradingStore();
  
  // Управление экранами: 'menu' (главная витрина), 'phone' (перевод по тел), 'invest' (биржа), 'mock' (заглушка для ЖКХ/коммуналки)
  const [activeSubScreen, setActiveSubScreen] = useState('menu');
  const [mockTitle, setMockTitle] = useState('');

  // Состояния для формы перевода по телефону
  const [targetPhone, setTargetPhone] = useState('');
  const [phoneAmount, setPhoneAmount] = useState('');
  
  // Состояния для формы пополнения инвест-счета
  const [investAmount, setInvestAmount] = useState('');

  // Состояния для кастомных платежей (ЖКХ, интернет и т.д.)
  const [mockAccount, setMockAccount] = useState('');
  const [mockAmount, setMockAmount] = useState('');

  // Статусы
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Сброс сообщений при смене экрана
  const changeScreen = (screen, title = '') => {
    setError('');
    success ? null : setSuccess('');
    setActiveSubScreen(screen);
    setMockTitle(title);
  };

  // ЛОГИКА 1: Перевод по номеру телефона
  const handlePhoneTransfer = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);

    if (parseFloat(phoneAmount) > user.cardBalance) {
      setError('Недостаточно средств на карте'); setLoading(false); return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/bank/transfer-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, targetPhone: targetPhone.trim(), amount: phoneAmount })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Ошибка перевода'); setLoading(false); return; }

      setUser(data.user);
      setSuccess(`Перевод выполнен! Отправлено ${phoneAmount} с. клиенту ${targetPhone}`);
      setTargetPhone(''); setPhoneAmount('');
      setActiveSubScreen('menu');
    } catch (err) { setError('Ошибка связи с сервером.'); } finally { setLoading(false); }
  };

  // ЛОГИКА 2: Пополнение биржевого счета
  const handleInvestFund = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);

    if (parseFloat(investAmount) > user.cardBalance) {
      setError('Недостаточно средств на карте'); setLoading(false); return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/bank/fund-invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: investAmount })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Ошибка пополнения'); setLoading(false); return; }

      setUser(data.user);
      setSuccess(`Инвест-счет успешно пополнен на +${investAmount} сомов!`);
      setInvestAmount('');
      setActiveSubScreen('menu');
    } catch (err) { setError('Ошибка связи с сервером.'); } finally { setLoading(false); }
  };

  // ЛОГИКА 3: Эмуляция оплаты коммуналки / интернета
  const handleMockPay = (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const amt = parseFloat(mockAmount);
    if (amt > user.cardBalance) { setError('Недостаточно денег на карте'); return; }

    // Списываем только локально для демонстрации коммуналки
    setUser({ ...user, cardBalance: user.cardBalance - amt });
    setSuccess(`Оплата по услуге "${mockTitle}" на сумму ${amt} с. успешно проведена!`);
    setMockAccount(''); setMockAmount('');
    setActiveSubScreen('menu');
  };

  return (
    <div style={containerStyle}>
      
      {/* ДИНАМИЧЕСКИЙ ВЫВОД ОШИБОК И УСПЕХОВ */}
      {error && <div style={errorStyle}>⚠️ {error}</div>}
      {success && <div style={successStyle}>✅ {success}</div>}

      {/* ==================================================================== */}
      {/* СЦЕНАРИЙ 1: ГЛАВНОЕ МЕНЮ ПЛАТЕЖЕЙ И КАТЕГОРИЙ */}
      {/* ==================================================================== */}
      {activeSubScreen === 'menu' && (
        <>
          <h2 style={titleStyle}>Платежи и переводы</h2>
          <p style={subtitleStyle}>Оплата услуг, штрафов и мгновенные переводы</p>

          {/* Строка поиска (как в MBank) */}
          <input type="text" placeholder="Название услуги, ИНН или кошелек..." style={searchStyle} />

          {/* БЛОК: ЧАСТЫЕ ПЛАТЕЖИ */}
          <h4 style={sectionTitleStyle}>Частые платежи</h4>
          <div style={horizontalScrollStyle}>
            <div style={favItemStyle} onClick={() => { changeScreen('phone'); setTargetPhone('+996777111222'); }}>
              <div style={favIconWrapperStyle('#202329')}>👤</div>
              <span style={favLabelStyle}>Мама</span>
            </div>
            <div style={favItemStyle} onClick={() => changeScreen('invest')}>
              <div style={favIconWrapperStyle('#11bb77', '#000')}>📈</div>
              <span style={favLabelStyle}>Жаба-Инвест</span>
            </div>
            <div style={favItemStyle} onClick={() => changeScreen('mock', 'Megacom (О!)')}>
              <div style={favIconWrapperStyle('#202329')}>📱</div>
              <span style={favLabelStyle}>Мой номер</span>
            </div>
            <div style={favItemStyle} onClick={() => changeScreen('mock', 'Акнет Интернет')}>
              <div style={favIconWrapperStyle('#202329')}>🌐</div>
              <span style={favLabelStyle}>Акнет Дом</span>
            </div>
          </div>

          {/* КАТЕГОРИИ ПЛАТЕЖЕЙ */}
          <h4 style={sectionTitleStyle}>Категории услуг</h4>
          <div style={categoryListStyle}>
            
            {/* Рабочий перевод по телефону */}
            <div style={categoryRowStyle} onClick={() => changeScreen('phone')}>
              <span style={catIconStyle}>📲</span>
              <div style={catTextContainerStyle}>
                <span style={catNameStyle}>Перевод по номеру телефона</span>
                <span style={catDescStyle}>Клиентам BakaBank без комиссии</span>
              </div>
              <span style={arrowStyle}>❯</span>
            </div>

            {/* Рабочее пополнение биржи */}
            <div style={categoryRowStyle} onClick={() => changeScreen('invest')}>
              <span style={{ ...catIconStyle, background: 'rgba(17,187,119,0.1)', color: '#11bb77' }}>📊</span>
              <div style={catTextContainerStyle}>
                <span style={catNameStyle}>Пополнение инвест-счета (M-Invest)</span>
                <span style={catDescStyle}>Мгновенный перевод на брокерский баланс</span>
              </div>
              <span style={arrowStyle}>❯</span>
            </div>

            {/* Коммуналка */}
            <div style={categoryRowStyle} onClick={() => changeScreen('mock', 'Коммунальные услуги (Бишкектеплосеть)')}>
              <span style={catIconStyle}>🏠</span>
              <div style={catTextContainerStyle}>
                <span style={catNameStyle}>Коммунальные услуги</span>
                <span style={catDescStyle}>Газ, свет, отопление, вывоз мусора</span>
              </div>
              <span style={arrowStyle}>❯</span>
            </div>

            {/* Интернет */}
            <div style={categoryRowStyle} onClick={() => changeScreen('mock', 'Интернет (Jet / Акнет / Мега-Лайн)')}>
              <span style={catIconStyle}>🌐</span>
              <div style={catTextContainerStyle}>
                <span style={catNameStyle}>Интернет и ТВ</span>
                <span style={catDescStyle}>Оплата провайдеров по лицевому счету</span>
              </div>
              <span style={arrowStyle}>❯</span>
            </div>

            {/* Игры */}
            <div style={categoryRowStyle} onClick={() => changeScreen('mock', 'Steam СНГ пополнение')}>
              <span style={catIconStyle}>🎮</span>
              <div style={catTextContainerStyle}>
                <span style={catNameStyle}>Игры и развлечения</span>
                <span style={catDescStyle}>Steam, PlayStation Store, Minecraft, Mobile Legends</span>
              </div>
              <span style={arrowStyle}>❯</span>
            </div>

          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* СЦЕНАРИЙ 2: ФОРМА ПЕРЕВОДА ПО ТЕЛЕФОНУ */}
      {/* ==================================================================== */}
      {activeSubScreen === 'phone' && (
        <div>
          <div style={backHeaderStyle} onClick={() => changeScreen('menu')}>⬅️ Назад в платежи</div>
          <h3 style={formTitleStyle}>Перевод по номеру телефона</h3>
          <form onSubmit={handlePhoneTransfer} style={formCardStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Номер телефона получателя</label>
              <input type="tel" placeholder="+996997555114" value={targetPhone} onChange={e => setTargetPhone(e.target.value)} style={inputStyle} required />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Сумма перевода (сомов)</label>
              <input type="number" placeholder="0.00" value={phoneAmount} onChange={e => setPhoneAmount(e.target.value)} style={inputStyle} required />
              <span style={balanceBadgeStyle}>Доступно: {user.cardBalance?.toLocaleString('ru-RU')} с</span>
            </div>
            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? 'Проведение транзакции...' : 'Подтвердить перевод'}
            </button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* СЦЕНАРИЙ 3: ФОРМА ПОПОЛНЕНИЯ БИРЖЕВОГО СЧЕТА */}
      {/* ==================================================================== */}
      {activeSubScreen === 'invest' && (
        <div>
          <div style={backHeaderStyle} onClick={() => changeScreen('menu')}>⬅️ Назад в платежи</div>
          <h3 style={formTitleStyle}>Пополнение счета M-Invest</h3>
          <p style={{ color: '#666d75', fontSize: '13px', marginTop: '-8px', marginBottom: '20px' }}>Перевод денег с основной дебетовой карты на ваш торговый брокерский баланс.</p>
          
          <form onSubmit={handleInvestFund} style={formCardStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Счет списания</label>
              <div style={staticAccountStyle}>💳 ЭЛКАРТ •••• {user.cardNumber?.slice(-4) || '0000'}</div>
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Сумма пополнения (сомов)</label>
              <input type="number" placeholder="Сумма" value={investAmount} onChange={e => setInvestAmount(e.target.value)} style={inputStyle} required />
              <span style={balanceBadgeStyle}>Доступно на карте: {user.cardBalance?.toLocaleString('ru-RU')} с</span>
            </div>
            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? 'Перевод на брокерский счет...' : 'Пополнить инвест-баланс'}
            </button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* СЦЕНАРИЙ 4: ОПЛАТА КОММУНАЛКИ / ИНТЕРНЕТА (MOCK СЕРВИСЫ) */}
      {/* ==================================================================== */}
      {activeSubScreen === 'mock' && (
        <div>
          <div style={backHeaderStyle} onClick={() => changeScreen('menu')}>⬅️ Назад в платежи</div>
          <h3 style={formTitleStyle}>{mockTitle}</h3>
          
          <form onSubmit={handleMockPay} style={formCardStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Лицевой счет / Номер договора / Код абонента</label>
              <input type="text" placeholder="Например: 10449582" value={mockAccount} onChange={e => setMockAccount(e.target.value)} style={inputStyle} required />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Сумма к оплате (сомов)</label>
              <input type="number" placeholder="0.00" value={mockAmount} onChange={e => setMockAmount(e.target.value)} style={inputStyle} required />
              <span style={balanceBadgeStyle}>Доступно на карте: {user.cardBalance?.toLocaleString('ru-RU')} с</span>
            </div>
            <button type="submit" style={buttonStyle(false)}>Оплатить услугу</button>
          </form>
        </div>
      )}

    </div>
  );
}

// ====================================================================
// СТИЛИ ПРЕМИАЛЬНОГО ДАШБОРДА ПЛАТЕЖЕЙ
// ====================================================================
const containerStyle = { width: '100%', maxWidth: '440px', margin: '0 auto', padding: '10px 2px' };
const titleStyle = { fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' };
const subtitleStyle = { color: '#666d75', fontSize: '13px', margin: '0 0 20px 0' };
const searchStyle = { width: '92%', padding: '14px 16px', borderRadius: '16px', background: '#14161a', border: '1px solid #202329', color: '#fff', fontSize: '14px', marginBottom: '24px', outline: 'none' };

const sectionTitleStyle = { margin: '0 0 14px 4px', fontSize: '14px', fontWeight: '700', color: '#8c8c8c', textAlign: 'left', letterSpacing: '0.2px' };

// Горизонтальный скролл частых платежей
const horizontalScrollStyle = { display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '24px', paddingLeft: '4px' };
const favItemStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: '70px' };
const favIconWrapperStyle = (bg, color = '#fff') => ({ width: '50px', height: '50px', borderRadius: '50%', background: bg, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', color: color, border: '1px solid #202329', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' });
const favLabelStyle = { fontSize: '11px', color: '#fff', marginTop: '8px', fontWeight: '500', maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

// Список категорий
const categoryListStyle = { display: 'flex', flexDirection: 'column', gap: '10px' };
const categoryRowStyle = { display: 'flex', alignItems: 'center', background: '#14161a', padding: '16px', borderRadius: '20px', border: '1px solid #202329', cursor: 'pointer', transition: '0.2s' };
const catIconStyle = { width: '42px', height: '42px', borderRadius: '12px', background: '#1c1f26', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', marginRight: '14px' };
const catTextContainerStyle = { flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '2px' };
const catNameStyle = { fontSize: '14px', fontWeight: '700', color: '#fff' };
const catDescStyle = { fontSize: '11px', color: '#666d75' };
const arrowStyle = { color: '#333842', fontSize: '14px', paddingRight: '4px' };

// Стили форм подстраниц
const backHeaderStyle = { color: '#11bb77', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left', marginBottom: '16px', display: 'inline-block' };
const formTitleStyle = { fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', textAlign: 'left' };
const formCardStyle = { background: '#14161a', padding: '24px', borderRadius: '24px', border: '1px solid #202329', display: 'flex', flexDirection: 'column', gap: '18px' };
const inputGroupStyle = { textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' };
const labelStyle = { color: '#8c8c8c', fontSize: '12px', paddingLeft: '4px' };
const inputStyle = { width: '90%', padding: '14px 16px', borderRadius: '14px', border: '1px solid #202329', background: '#1c1f26', color: '#fff', fontSize: '16px', outline: 'none' };
const staticAccountStyle = { padding: '14px 16px', borderRadius: '14px', background: '#1c1f26', border: '1px solid #202329', color: '#8c8c8c', fontSize: '15px', fontWeight: '600' };
const balanceBadgeStyle = { fontSize: '12px', color: '#666d75', marginTop: '4px', paddingLeft: '4px' };

const errorStyle = { background: 'rgba(255, 77, 79, 0.1)', border: '1px solid #ff4d4f', color: '#ff4d4f', padding: '12px', borderRadius: '14px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' };
const successStyle = { background: 'rgba(17, 187, 119, 0.1)', border: '1px solid #11bb77', color: '#11bb77', padding: '12px', borderRadius: '14px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' };
const buttonStyle = (loading) => ({ padding: '16px', borderRadius: '16px', border: 'none', background: loading ? '#0c6e47' : '#11bb77', color: '#000', fontWeight: '700', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(17,187,119,0.2)' });