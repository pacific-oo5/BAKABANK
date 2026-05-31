import React, { useState, useRef, useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { QrCode, Camera, User, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import '../styles/qrpay.css';

const springConfig = { type: "spring", stiffness: 400, damping: 30 };

const containerVariants = {
  hidden: { opacity: 0, scale: 0.98, filter: "blur(4px)" },
  show: { opacity: 1, scale: 1, filter: "blur(0px)", transition: springConfig },
  exit: { opacity: 0, scale: 0.98, filter: "blur(4px)", transition: { duration: 0.15 } }
};

export default function QRPay() {
  const { user, setUser } = useTradingStore();
  const [mode, setMode] = useState('menu'); 
  const [scannedData, setScannedData] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const html5QrCodeRef = useRef(null);

  // 100% НАДЕЖНЫЙ ЗАПУСК: Ждем пока React и Framer Motion полностью отрисуют DOM
  useEffect(() => {
    let timer;
    if (mode === 'scan') {
      // 350ms - время, пока длится анимация появления окна
      timer = setTimeout(() => {
        startScanner();
      }, 350);
    }
    return () => {
      if (timer) clearTimeout(timer);
      stopScanner();
    };
  }, [mode]);

  const generateQRData = () => {
    return JSON.stringify({
      type: 'bakabank_payment',
      userId: user.id,
      userName: user.fullName,
      phone: user.phoneNumber
    });
  };

  const startScanner = async () => {
    if (html5QrCodeRef.current?.isScanning) return; // Защита от двойного запуска

    setScanning(true);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        // Вернули qrbox для стабильности движка (визуально скроем его в CSS)
        { fps: 10, qrbox: { width: 250, height: 250 } }, 
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.type === 'bakabank_payment') {
              setScannedData(data);
              setMode('confirm');
              stopScanner();
              toast.success('Идентификатор распознан');
            } else {
              toast.error('Неверный формат QR');
            }
          } catch (e) {
            toast.error('Ошибка чтения данных');
          }
        },
        () => {} // Игнорируем фоновые шумы сканера
      );
    } catch (err) {
      setScanning(false);
      setMode('menu'); // Экстренный возврат в меню
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        toast.error('Доступ к камере заблокирован в настройках');
      } else {
        toast.error('Ошибка инициализации оптики');
      }
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        setScanning(false);
        html5QrCodeRef.current.clear();
      }).catch(console.error);
    } else {
      setScanning(false);
    }
  };

  const handleQRTransfer = async (e) => {
    e.preventDefault();
    if (!scannedData || !amount) return;

    if (parseFloat(amount) > user.cardBalance) {
      toast.error('Недостаточно средств');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bank/transfer-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          recipientId: scannedData.userId,
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        toast.success(`Транзакция успешна: ${amount} с. -> ${scannedData.userName}`);
        setAmount('');
        setScannedData(null);
        setMode('menu');
      } else {
        toast.error(data.error || 'Ошибка сети');
      }
    } catch (err) {
      toast.error('Отказ соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qr-container">
      <AnimatePresence mode="wait">
        
        {mode === 'menu' && (
          <motion.div key="menu" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="subscreen-wrapper">
            <div>
              <h2 className="qr-heading">QR-Модуль</h2>
              <p className="qr-subheading">Оптическая маршрутизация платежей</p>
            </div>

            <div className="qr-menu-grid">
              <motion.div whileTap={{ scale: 0.95 }} onClick={() => setMode('generate')} className="qr-menu-card">
                <div className="qr-icon-box accent-acid">
                  <QrCode size={28} />
                </div>
                <h3 className="qr-card-title">Показать QR</h3>
                <p className="qr-card-desc">Сгенерировать код для получения средств</p>
              </motion.div>

              <motion.div 
                whileTap={{ scale: 0.95 }} 
                // Просто меняем стейт, useEffect сам запустит камеру в нужное время
                onClick={() => setMode('scan')} 
                className="qr-menu-card"
              >
                <div className="qr-icon-box accent-warn">
                  <Camera size={28} />
                </div>
                <h3 className="qr-card-title">Сканировать</h3>
                <p className="qr-card-desc">Отсканировать код отправителя</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {mode === 'generate' && (
          <motion.div key="generate" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="qr-display-box">
            <motion.div whileTap={{ scale: 0.9 }} onClick={() => setMode('menu')} className="back-link" style={{ alignSelf: 'flex-start', margin: '-10px 0 20px 0' }}>
              <ArrowLeft size={16} /> <span>НАЗАД</span>
            </motion.div>

            <h3 className="qr-heading" style={{ fontSize: '20px' }}>Идентификатор</h3>
            <p className="qr-subheading" style={{ marginBottom: '24px' }}>Предъявите для сканирования</p>

            <div className="qr-white-frame">
              <QRCodeSVG
                value={generateQRData()}
                size={220}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#0a0a0c"
                style={{ display: 'block' }}
              />
            </div>

            <div className="user-id-card">
              <div className="user-id-avatar">
                <User size={24} />
              </div>
              <div>
                <div className="user-id-name">{user.fullName}</div>
                <div className="user-id-phone">{user.phoneNumber}</div>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'scan' && (
          <motion.div key="scan" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="scanner-container">
            <div className="scanner-video-wrapper">
              <div id="qr-reader"></div>
              
              <div className="viewfinder-overlay">
                <div className="viewfinder-box"></div>
                <div className="scanning-text">{scanning ? 'Инициализация оптики...' : 'Подключение...'}</div>
              </div>
            </div>

            <div className="scanner-controls">
              <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => { stopScanner(); setMode('menu'); }} 
                className="util-submit-btn scanner-cancel-btn"
              >
                ОТМЕНИТЬ ОПЕРАЦИЮ
              </motion.button>
            </div>
          </motion.div>
        )}

        {mode === 'confirm' && scannedData && (
          <motion.div key="confirm" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="confirm-box">
            <motion.div whileTap={{ scale: 0.9 }} onClick={() => { setMode('menu'); setScannedData(null); setAmount(''); }} className="back-link">
              <ArrowLeft size={16} /> <span>ОТМЕНА</span>
            </motion.div>

            <div className="confirm-icon-wrapper">
              <CheckCircle size={48} color="var(--accent-acid)" />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h3 className="qr-heading" style={{ fontSize: '20px' }}>Цель подтверждена</h3>
            </div>

            <div className="user-id-card">
              <div className="user-id-avatar">
                <User size={24} />
              </div>
              <div>
                <div className="user-id-name">{scannedData.userName}</div>
                <div className="user-id-phone">{scannedData.phone}</div>
              </div>
            </div>

            <form onSubmit={handleQRTransfer} className="util-form" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
              <div className="form-group">
                <label className="form-label">СУММА ОПЕРАЦИИ (KGS)</label>
                <div className="terminal-input-wrapper">
                  <span className="terminal-prefix">AMT&gt;</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="terminal-input"
                    autoFocus
                    required
                  />
                </div>
                <span className="form-hint">Баланс: {user.cardBalance?.toLocaleString('ru-RU')} с</span>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading || !amount} className="util-submit-btn">
                {loading ? 'ОБРАБОТКА...' : 'ПОДТВЕРДИТЬ ТРАНЗАКЦИЮ'}
              </motion.button>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}