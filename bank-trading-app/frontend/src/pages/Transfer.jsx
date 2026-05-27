import React, { useState } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { Phone, TrendingUp, Home, Wifi, Gamepad2, Search, ChevronRight, ArrowLeft, User, CreditCard, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import QRPay from './QRPay';
import '../styles/transfers.css';

export default function Transfers() {
  const { user, setUser } = useTradingStore();
  
  // Управление экранами: 'menu' (главная витрина), 'phone' (перевод по тел), 'invest' (биржа), 'mock' (заглушка для ЖКХ/коммуналки), 'qr' (QR-переводы)
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
      toast.error('Недостаточно средств на карте');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bank/transfer-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, targetPhone: targetPhone.trim(), amount: phoneAmount })
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Ошибка перевода');
        setLoading(false);
        return;
      }

      setUser(data.user);
      toast.success(`Перевод выполнен! Отправлено ${phoneAmount} с. клиенту ${targetPhone}`);
      setTargetPhone(''); setPhoneAmount('');
      setActiveSubScreen('menu');
    } catch (err) {
      toast.error('Ошибка связи с сервером.');
    } finally {
      setLoading(false);
    }
  };

  // ЛОГИКА 2: Пополнение биржевого счета
  const handleInvestFund = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);

    if (parseFloat(investAmount) > user.cardBalance) {
      toast.error('Недостаточно средств на карте');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bank/fund-invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: investAmount })
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Ошибка пополнения');
        setLoading(false);
        return;
      }

      setUser(data.user);
      toast.success(`Инвест-счет успешно пополнен на +${investAmount} сомов!`);
      setInvestAmount('');
      setActiveSubScreen('menu');
    } catch (err) {
      toast.error('Ошибка связи с сервером.');
    } finally {
      setLoading(false);
    }
  };

  // ЛОГИКА 3: Эмуляция оплаты коммуналки / интернета
  const handleMockPay = (e) => {
    e.preventDefault();
    const amt = parseFloat(mockAmount);
    if (amt > user.cardBalance) {
      toast.error('Недостаточно денег на карте');
      return;
    }

    // Списываем только локально для демонстрации коммуналки
    setUser({ ...user, cardBalance: user.cardBalance - amt });
    toast.success(`Оплата по услуге "${mockTitle}" на сумму ${amt} с. успешно проведена!`);
    setMockAccount(''); setMockAmount('');
    setActiveSubScreen('menu');
  };

  return (
    <div className="transfers-container">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
        success: { iconTheme: { primary: 'var(--color-accent-success)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--color-accent-error)', secondary: '#fff' } }
      }} />

      {/* ДИНАМИЧЕСКИЙ ВЫВОД ОШИБОК И УСПЕХОВ */}
      {error && <div className="alert-error">⚠️ {error}</div>}
      {success && <div className="alert-success">✅ {success}</div>}

      {/* ==================================================================== */}
      {/* СЦЕНАРИЙ 1: ГЛАВНОЕ МЕНЮ ПЛАТЕЖЕЙ И КАТЕГОРИЙ */}
      {/* ==================================================================== */}
      {activeSubScreen === 'menu' && (
        <>
          <h2 className="transfers-title">Платежи и переводы</h2>
          <p className="transfers-subtitle">Оплата услуг, штрафов и мгновенные переводы</p>

          {/* Строка поиска (как в MBank) */}
          <div className="transfers-search-wrapper">
            <Search size={18} className="transfers-search-icon" />
            <input type="text" placeholder="Название услуги, ИНН или кошелек..." className="transfers-search" />
          </div>

          {/* БЛОК: ЧАСТЫЕ ПЛАТЕЖИ */}
          <h4 className="transfers-section-title">Частые платежи</h4>
          <div className="favorites-scroll">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="favorite-item"
              onClick={() => { changeScreen('phone'); setTargetPhone('+996777111222'); }}
            >
              <div className="favorite-icon-wrapper" style={{ background: 'var(--color-surface)' }}>
                <User size={20} color="var(--color-text-primary)" />
              </div>
              <span className="favorite-label">Мама</span>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.95 }}
              className="favorite-item"
              onClick={() => changeScreen('invest')}
            >
              <div className="favorite-icon-wrapper" style={{ background: 'var(--color-accent-success)', color: '#000' }}>
                <TrendingUp size={20} />
              </div>
              <span className="favorite-label">Жаба-Инвест</span>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.95 }}
              className="favorite-item"
              onClick={() => changeScreen('qr')}
            >
              <div className="favorite-icon-wrapper" style={{ background: 'var(--color-accent-warning)', color: '#000' }}>
                <QrCode size={20} />
              </div>
              <span className="favorite-label">QR-перевод</span>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.95 }}
              className="favorite-item"
              onClick={() => changeScreen('mock', 'Megacom (О!)')}
            >
              <div className="favorite-icon-wrapper" style={{ background: 'var(--color-surface)' }}>
                <Phone size={20} color="var(--color-text-primary)" />
              </div>
              <span className="favorite-label">Мой номер</span>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.95 }}
              className="favorite-item"
              onClick={() => changeScreen('mock', 'Акнет Интернет')}
            >
              <div className="favorite-icon-wrapper" style={{ background: 'var(--color-surface)' }}>
                <Wifi size={20} color="var(--color-text-primary)" />
              </div>
              <span className="favorite-label">Акнет Дом</span>
            </motion.div>
          </div>

          {/* КАТЕГОРИИ ПЛАТЕЖЕЙ */}
          <h4 className="transfers-section-title">Категории услуг</h4>
          <div className="categories-list">

            {/* QR-переводы */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="category-row"
              onClick={() => changeScreen('qr')}
            >
              <span className="category-icon" style={{ background: 'rgba(255,204,0,0.1)', color: 'var(--color-accent-warning)' }}>
                <QrCode size={20} />
              </span>
              <div className="category-text-container">
                <span className="category-name">QR-переводы</span>
                <span className="category-desc">Мгновенные переводы по QR-коду без ввода номера</span>
              </div>
              <ChevronRight size={20} className="category-arrow" />
            </motion.div>

            {/* Рабочий перевод по телефону */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="category-row"
              onClick={() => changeScreen('phone')}
            >
              <span className="category-icon">
                <Phone size={20} />
              </span>
              <div className="category-text-container">
                <span className="category-name">Перевод по номеру телефона</span>
                <span className="category-desc">Клиентам BakaBank без комиссии</span>
              </div>
              <ChevronRight size={20} className="category-arrow" />
            </motion.div>

            {/* Рабочее пополнение биржи */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="category-row"
              onClick={() => changeScreen('invest')}
            >
              <span className="category-icon" style={{ background: 'rgba(48, 209, 88, 0.1)', color: 'var(--color-accent-success)' }}>
                <TrendingUp size={20} />
              </span>
              <div className="category-text-container">
                <span className="category-name">Пополнение инвест-счета (M-Invest)</span>
                <span className="category-desc">Мгновенный перевод на брокерский баланс</span>
              </div>
              <ChevronRight size={20} className="category-arrow" />
            </motion.div>

            {/* Коммуналка */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="category-row"
              onClick={() => changeScreen('mock', 'Коммунальные услуги (Бишкектеплосеть)')}
            >
              <span className="category-icon">
                <Home size={20} />
              </span>
              <div className="category-text-container">
                <span className="category-name">Коммунальные услуги</span>
                <span className="category-desc">Газ, свет, отопление, вывоз мусора</span>
              </div>
              <ChevronRight size={20} className="category-arrow" />
            </motion.div>

            {/* Интернет */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="category-row"
              onClick={() => changeScreen('mock', 'Интернет (Jet / Акнет / Мега-Лайн)')}
            >
              <span className="category-icon">
                <Wifi size={20} />
              </span>
              <div className="category-text-container">
                <span className="category-name">Интернет и ТВ</span>
                <span className="category-desc">Оплата провайдеров по лицевому счету</span>
              </div>
              <ChevronRight size={20} className="category-arrow" />
            </motion.div>

            {/* Игры */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="category-row"
              onClick={() => changeScreen('mock', 'Steam СНГ пополнение')}
            >
              <span className="category-icon">
                <Gamepad2 size={20} />
              </span>
              <div className="category-text-container">
                <span className="category-name">Игры и развлечения</span>
                <span className="category-desc">Steam, PlayStation Store, Minecraft, Mobile Legends</span>
              </div>
              <ChevronRight size={20} className="category-arrow" />
            </motion.div>

          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* СЦЕНАРИЙ 2: ФОРМА ПЕРЕВОДА ПО ТЕЛЕФОНУ */}
      {/* ==================================================================== */}
      {activeSubScreen === 'phone' && (
        <div>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="back-header"
            onClick={() => changeScreen('menu')}
          >
            <ArrowLeft size={18} />
            Назад в платежи
          </motion.div>
          <h3 className="form-title">Перевод по номеру телефона</h3>
          <form onSubmit={handlePhoneTransfer} className="form-card">
            <div className="input-group">
              <label className="input-label">Номер телефона получателя</label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="+996997555114"
                value={targetPhone}
                onChange={e => setTargetPhone(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Сумма перевода (сомов)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={phoneAmount}
                onChange={e => setPhoneAmount(e.target.value)}
                className="form-input"
                required
              />
              <span className="balance-badge">Доступно: {user.cardBalance?.toLocaleString('ru-RU')} с</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="form-button"
            >
              {loading ? 'Проведение транзакции...' : 'Подтвердить перевод'}
            </motion.button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* СЦЕНАРИЙ 3: ФОРМА ПОПОЛНЕНИЯ БИРЖЕВОГО СЧЕТА */}
      {/* ==================================================================== */}
      {activeSubScreen === 'invest' && (
        <div>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="back-header"
            onClick={() => changeScreen('menu')}
          >
            <ArrowLeft size={18} />
            Назад в платежи
          </motion.div>
          <h3 className="form-title">Пополнение счета M-Invest</h3>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', marginTop: 'calc(-1 * var(--space-sm))', marginBottom: 'var(--space-lg)' }}>Перевод денег с основной дебетовой карты на ваш торговый брокерский баланс.</p>

          <form onSubmit={handleInvestFund} className="form-card">
            <div className="input-group">
              <label className="input-label">Счет списания</label>
              <div className="static-account">
                <CreditCard size={18} />
                ЭЛКАРТ •••• {user.cardNumber?.slice(-4) || '0000'}
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Сумма пополнения (сомов)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Сумма"
                value={investAmount}
                onChange={e => setInvestAmount(e.target.value)}
                className="form-input"
                required
              />
              <span className="balance-badge">Доступно на карте: {user.cardBalance?.toLocaleString('ru-RU')} с</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="form-button"
            >
              {loading ? 'Перевод на брокерский счет...' : 'Пополнить инвест-баланс'}
            </motion.button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* СЦЕНАРИЙ 4: ОПЛАТА КОММУНАЛКИ / ИНТЕРНЕТА (MOCK СЕРВИСЫ) */}
      {/* ==================================================================== */}
      {activeSubScreen === 'mock' && (
        <div>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="back-header"
            onClick={() => changeScreen('menu')}
          >
            <ArrowLeft size={18} />
            Назад в платежи
          </motion.div>
          <h3 className="form-title">{mockTitle}</h3>

          <form onSubmit={handleMockPay} className="form-card">
            <div className="input-group">
              <label className="input-label">Лицевой счет / Номер договора / Код абонента</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Например: 10449582"
                value={mockAccount}
                onChange={e => setMockAccount(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Сумма к оплате (сомов)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={mockAmount}
                onChange={e => setMockAmount(e.target.value)}
                className="form-input"
                required
              />
              <span className="balance-badge">Доступно на карте: {user.cardBalance?.toLocaleString('ru-RU')} с</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="form-button"
            >
              Оплатить услугу
            </motion.button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* СЦЕНАРИЙ 5: QR-ПЕРЕВОДЫ */}
      {/* ==================================================================== */}
      {activeSubScreen === 'qr' && (
        <div>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="back-header"
            onClick={() => changeScreen('menu')}
          >
            <ArrowLeft size={18} />
            Назад в платежи
          </motion.div>
          <QRPay />
        </div>
      )}

    </div>
  );
}