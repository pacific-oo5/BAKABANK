import React, { useState } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { Phone, TrendingUp, Home, Wifi, Gamepad2, Search, ChevronRight, ArrowLeft, User, CreditCard, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import QRPay from './QRPay';
import '../styles/transfers.css';

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

export default function Transfers() {
  const { user, setUser } = useTradingStore();
  
  const [activeSubScreen, setActiveSubScreen] = useState('menu');
  const [mockTitle, setMockTitle] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [phoneAmount, setPhoneAmount] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const [mockAccount, setMockAccount] = useState('');
  const [mockAmount, setMockAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const changeScreen = (screen, title = '') => {
    setActiveSubScreen(screen);
    setMockTitle(title);
  };

  const handlePhoneTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (parseFloat(phoneAmount) > user.cardBalance) {
      toast.error('ERR_INSUFFICIENT_FUNDS');
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
        toast.error(data.error || 'ERR_TRANSACTION_FAILED');
        setLoading(false);
        return;
      }

      setUser(data.user);
      toast.success(`TX_SUCCESS: ${phoneAmount} KGS -> ${targetPhone}`);
      setTargetPhone(''); setPhoneAmount('');
      setActiveSubScreen('menu');
    } catch (err) {
      toast.error('ERR_CONNECTION_REFUSED');
    } finally {
      setLoading(false);
    }
  };

  const handleInvestFund = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (parseFloat(investAmount) > user.cardBalance) {
      toast.error('ERR_INSUFFICIENT_FUNDS');
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
        toast.error(data.error || 'ERR_FUNDING_FAILED');
        setLoading(false);
        return;
      }

      setUser(data.user);
      toast.success(`FUND_SUCCESS: +${investAmount} KGS -> M-Invest`);
      setInvestAmount('');
      setActiveSubScreen('menu');
    } catch (err) {
      toast.error('ERR_CONNECTION_REFUSED');
    } finally {
      setLoading(false);
    }
  };

  const handleMockPay = (e) => {
    e.preventDefault();
    const amt = parseFloat(mockAmount);
    if (amt > user.cardBalance) {
      toast.error('ERR_INSUFFICIENT_FUNDS');
      return;
    }

    setUser({ ...user, cardBalance: user.cardBalance - amt });
    toast.success(`PAY_SUCCESS: ${mockTitle} | ${amt} KGS`);
    setMockAccount(''); setMockAmount('');
    setActiveSubScreen('menu');
  };

  // Компонент утилитарной кнопки возврата
  const BackButton = () => (
    <motion.div whileTap={{ scale: 0.95 }} className="back-link" onClick={() => changeScreen('menu')}>
      <ArrowLeft size={16} />
      <span>[ ESC ] ВОЗВРАТ</span>
    </motion.div>
  );

  return (
    <div className="transfers-container">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1c1c1e', color: '#fff', border: '1px solid #333' } }} />

      <AnimatePresence mode="wait">
        {/* === СЦЕНАРИЙ 1: ГЛАВНОЕ МЕНЮ === */}
        {activeSubScreen === 'menu' && (
          <motion.div key="menu" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="subscreen-wrapper">
            <motion.div variants={itemVariants}>
              <h2 className="transfers-title">Транзакции</h2>
              <p className="transfers-subtitle">Операционный хаб переводов и платежей</p>
            </motion.div>

            {/* Терминальный поиск */}
            <motion.div variants={itemVariants} className="terminal-search-wrapper">
              <span className="terminal-prefix">&gt;</span>
              <input type="text" placeholder="Поиск операции / ИНН..." className="terminal-search-input" />
              <Search size={16} className="search-icon-muted" />
            </motion.div>

            {/* ЧАСТЫЕ ПЛАТЕЖИ (Брутальный скролл) */}
            <motion.div variants={itemVariants}>
              <h4 className="section-label">Избранные узлы</h4>
              <div className="favorites-grid-scroll">
                {[
                  { icon: User, label: 'Мама', action: () => { changeScreen('phone'); setTargetPhone('+996777111222'); } },
                  { icon: TrendingUp, label: 'Инвест', action: () => changeScreen('invest'), accent: true },
                  { icon: QrCode, label: 'QR-Pay', action: () => changeScreen('qr') },
                  { icon: Phone, label: 'Мой номер', action: () => changeScreen('mock', 'Megacom (О!)') },
                  { icon: Wifi, label: 'Акнет', action: () => changeScreen('mock', 'Акнет Интернет') }
                ].map((fav, idx) => (
                  <motion.div key={idx} whileTap={{ scale: 0.92 }} className="fav-node" onClick={fav.action}>
                    <div className={`fav-icon-box ${fav.accent ? 'accented' : ''}`}>
                      <fav.icon size={20} strokeWidth={fav.accent ? 2.5 : 2} />
                    </div>
                    <span className="fav-label">{fav.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* КАТЕГОРИИ ПЛАТЕЖЕЙ */}
            <motion.div variants={itemVariants}>
              <h4 className="section-label">Директория услуг</h4>
              <div className="categories-list">
                {[
                  { icon: QrCode, title: 'QR-Сканер', desc: 'Оплата и переводы по штрихкоду', action: () => changeScreen('qr') },
                  { icon: Phone, title: 'Перевод по телефону', desc: 'Внутри сети BakaBank (0% комиссии)', action: () => changeScreen('phone') },
                  { icon: TrendingUp, title: 'M-Invest', desc: 'Фондирование брокерского счета', action: () => changeScreen('invest') },
                  { icon: Home, title: 'Коммунальные сети', desc: 'ЖКХ, электричество, вода', action: () => changeScreen('mock', 'Коммунальные услуги') },
                  { icon: Wifi, title: 'Провайдеры связи', desc: 'Интернет и кабельное ТВ', action: () => changeScreen('mock', 'Интернет Провайдеры') },
                  { icon: Gamepad2, title: 'Цифровые товары', desc: 'Игровые сервисы и подписки', action: () => changeScreen('mock', 'Игры и развлечения') }
                ].map((cat, idx) => (
                  <motion.div key={idx} whileTap={{ scale: 0.98 }} className="cat-row" onClick={cat.action}>
                    <div className="cat-icon-container"><cat.icon size={18} /></div>
                    <div className="cat-text-group">
                      <span className="cat-title">{cat.title}</span>
                      <span className="cat-desc">{cat.desc}</span>
                    </div>
                    <ChevronRight size={18} className="cat-arrow" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* === СЦЕНАРИЙ 2: ПЕРЕВОД ПО ТЕЛЕФОНУ === */}
        {activeSubScreen === 'phone' && (
          <motion.div key="phone" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="subscreen-wrapper">
            <BackButton />
            <motion.h3 variants={itemVariants} className="form-heading">Перевод P2P</motion.h3>
            <motion.form variants={itemVariants} onSubmit={handlePhoneTransfer} className="util-form">
              <div className="form-group">
                <label className="form-label">ИДЕНТИФИКАТОР (ТЕЛЕФОН)</label>
                <div className="terminal-input-wrapper">
                  <span className="terminal-prefix">TEL&gt;</span>
                  <input type="tel" placeholder="+996 997 555 114" value={targetPhone} onChange={e => setTargetPhone(e.target.value)} className="terminal-input" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ОБЪЕМ (KGS)</label>
                <div className="terminal-input-wrapper">
                  <span className="terminal-prefix">AMT&gt;</span>
                  <input type="number" step="0.01" placeholder="0.00" value={phoneAmount} onChange={e => setPhoneAmount(e.target.value)} className="terminal-input" required />
                </div>
                <span className="form-hint">Лимит: {user.cardBalance?.toLocaleString('ru-RU')}</span>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="util-submit-btn">
                {loading ? 'ИНИЦИАЛИЗАЦИЯ...' : 'ВЫПОЛНИТЬ ПЕРЕВОД'}
              </motion.button>
            </motion.form>
          </motion.div>
        )}

        {/* === СЦЕНАРИЙ 3: ИНВЕСТ СЧЕТ === */}
        {activeSubScreen === 'invest' && (
          <motion.div key="invest" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="subscreen-wrapper">
            <BackButton />
            <motion.h3 variants={itemVariants} className="form-heading">Фондирование M-Invest</motion.h3>
            <motion.form variants={itemVariants} onSubmit={handleInvestFund} className="util-form">
              <div className="form-group">
                <label className="form-label">ИСТОЧНИК СПИСАНИЯ</label>
                <div className="static-data-box">
                  <CreditCard size={18} />
                  <span>BAKA BLACK •••• {user.cardNumber?.slice(-4) || '0000'}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ОБЪЕМ ПОПОЛНЕНИЯ (KGS)</label>
                <div className="terminal-input-wrapper">
                  <span className="terminal-prefix">AMT&gt;</span>
                  <input type="number" step="0.01" placeholder="0.00" value={investAmount} onChange={e => setInvestAmount(e.target.value)} className="terminal-input" required />
                </div>
                <span className="form-hint">Баланс: {user.cardBalance?.toLocaleString('ru-RU')}</span>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="util-submit-btn">
                {loading ? 'ОБРАБОТКА ШЛЮЗОМ...' : 'АВТОРИЗОВАТЬ ТРАНЗАКЦИЮ'}
              </motion.button>
            </motion.form>
          </motion.div>
        )}

        {/* === СЦЕНАРИЙ 4: MOCK (Услуги) === */}
        {activeSubScreen === 'mock' && (
          <motion.div key="mock" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="subscreen-wrapper">
            <BackButton />
            <motion.h3 variants={itemVariants} className="form-heading">{mockTitle}</motion.h3>
            <motion.form variants={itemVariants} onSubmit={handleMockPay} className="util-form">
              <div className="form-group">
                <label className="form-label">РЕКВИЗИТ / ЛИЦЕВОЙ СЧЕТ</label>
                <div className="terminal-input-wrapper">
                  <span className="terminal-prefix">ID&gt;</span>
                  <input type="text" inputMode="numeric" placeholder="Например: 10449582" value={mockAccount} onChange={e => setMockAccount(e.target.value)} className="terminal-input" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">СУММА ОПЛАТЫ (KGS)</label>
                <div className="terminal-input-wrapper">
                  <span className="terminal-prefix">AMT&gt;</span>
                  <input type="number" step="0.01" placeholder="0.00" value={mockAmount} onChange={e => setMockAmount(e.target.value)} className="terminal-input" required />
                </div>
                <span className="form-hint">Баланс: {user.cardBalance?.toLocaleString('ru-RU')}</span>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} type="submit" className="util-submit-btn">
                ПОДТВЕРДИТЬ ОПЛАТУ
              </motion.button>
            </motion.form>
          </motion.div>
        )}

        {/* === СЦЕНАРИЙ 5: QR === */}
        {activeSubScreen === 'qr' && (
          <motion.div key="qr" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="subscreen-wrapper">
            <BackButton />
            <QRPay />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}