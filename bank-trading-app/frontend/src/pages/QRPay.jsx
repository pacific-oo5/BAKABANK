import React, { useState, useRef } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { QrCode, Camera, Upload, X, User, DollarSign, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRPay() {
  const { user, setUser } = useTradingStore();
  const [mode, setMode] = useState('menu'); // 'menu', 'generate', 'scan', 'confirm'
  const [scannedData, setScannedData] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Генерация QR-кода с данными пользователя
  const generateQRData = () => {
    return JSON.stringify({
      type: 'bakabank_payment',
      userId: user.id,
      userName: user.fullName,
      phone: user.phoneNumber
    });
  };

  // Запуск сканера QR
  const startScanner = async () => {
    setScanning(true);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.type === 'bakabank_payment') {
              setScannedData(data);
              setMode('confirm');
              stopScanner();
              toast.success('QR-код успешно отсканирован!');
            } else {
              toast.error('Неверный формат QR-кода');
            }
          } catch (e) {
            toast.error('Ошибка чтения QR-кода');
          }
        },
        (errorMessage) => {
          // Игнорируем ошибки сканирования (нормально для процесса)
        }
      );
    } catch (err) {
      toast.error('Не удалось запустить камеру');
      setScanning(false);
    }
  };

  // Остановка сканера
  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        setScanning(false);
      }).catch(() => {
        setScanning(false);
      });
    }
  };

  // Обработка перевода по QR
  const handleQRTransfer = async () => {
    if (!scannedData || !amount) {
      toast.error('Заполните сумму перевода');
      return;
    }

    if (parseFloat(amount) > user.cardBalance) {
      toast.error('Недостаточно средств на карте');
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
        toast.success(`Перевод выполнен! Отправлено ${amount} с. пользователю ${scannedData.userName}`);
        setAmount('');
        setScannedData(null);
        setMode('menu');
      } else {
        toast.error(data.error || 'Ошибка перевода');
      }
    } catch (err) {
      toast.error('Ошибка связи с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <Toaster position="top-center" toastOptions={{
        style: { background: '#14161a', color: '#fff', border: '1px solid #202329' },
        success: { iconTheme: { primary: '#11bb77', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ff4d4f', secondary: '#fff' } }
      }} />

      {/* ГЛАВНОЕ МЕНЮ */}
      {mode === 'menu' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 style={titleStyle}>QR-переводы</h2>
          <p style={subtitleStyle}>Мгновенные переводы по QR-коду без ввода номера</p>

          <div style={menuGridStyle}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode('generate')}
              style={menuCardStyle}
            >
              <div style={menuIconStyle('#11bb77')}>
                <QrCode size={32} />
              </div>
              <h3 style={menuTitleStyle}>Показать мой QR</h3>
              <p style={menuDescStyle}>Получить деньги от другого пользователя</p>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setMode('scan');
                setTimeout(() => startScanner(), 100);
              }}
              style={menuCardStyle}
            >
              <div style={menuIconStyle('#ffcc00')}>
                <Camera size={32} />
              </div>
              <h3 style={menuTitleStyle}>Сканировать QR</h3>
              <p style={menuDescStyle}>Отправить деньги по QR-коду</p>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ГЕНЕРАЦИЯ QR-КОДА */}
      {mode === 'generate' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={qrDisplayStyle}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMode('menu')}
            style={closeButtonStyle}
          >
            <X size={24} />
          </motion.button>

          <h3 style={qrTitleStyle}>Мой QR-код для получения</h3>
          <p style={qrSubtitleStyle}>Покажите этот код отправителю</p>

          <div style={qrCodeWrapperStyle}>
            <QRCodeSVG
              value={generateQRData()}
              size={220}
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
              style={{ borderRadius: '16px' }}
            />
          </div>

          <div style={userInfoCardStyle}>
            <div style={userAvatarStyle}>
              <User size={24} color="#11bb77" />
            </div>
            <div>
              <div style={userNameTextStyle}>{user.fullName}</div>
              <div style={userPhoneTextStyle}>{user.phoneNumber}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* СКАНИРОВАНИЕ QR-КОДА */}
      {mode === 'scan' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={scannerContainerStyle}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              stopScanner();
              setMode('menu');
            }}
            style={closeButtonStyle}
          >
            <X size={24} />
          </motion.button>

          <h3 style={scanTitleStyle}>Наведите камеру на QR-код</h3>

          <div id="qr-reader" style={qrReaderStyle}></div>

          {scanning && (
            <div style={scanningIndicatorStyle}>
              <div className="scanning-line" />
              <p style={{ color: '#11bb77', fontSize: '14px', marginTop: '16px' }}>Сканирование...</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ПОДТВЕРЖДЕНИЕ ПЕРЕВОДА */}
      {mode === 'confirm' && scannedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={confirmContainerStyle}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setMode('menu');
              setScannedData(null);
              setAmount('');
            }}
            style={closeButtonStyle}
          >
            <X size={24} />
          </motion.button>

          <div style={confirmHeaderStyle}>
            <CheckCircle size={48} color="#11bb77" />
            <h3 style={confirmTitleStyle}>Подтверждение перевода</h3>
          </div>

          <div style={recipientCardStyle}>
            <div style={recipientAvatarStyle}>
              <User size={28} color="#11bb77" />
            </div>
            <div>
              <div style={recipientNameStyle}>{scannedData.userName}</div>
              <div style={recipientPhoneStyle}>{scannedData.phone}</div>
            </div>
          </div>

          <div style={amountInputGroupStyle}>
            <label style={labelStyle}>Сумма перевода (сомов)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={amountInputStyle}
              autoFocus
            />
            <span style={balanceTextStyle}>Доступно: {user.cardBalance?.toLocaleString('ru-RU')} с</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleQRTransfer}
            disabled={loading || !amount}
            style={confirmButtonStyle(loading || !amount)}
          >
            {loading ? 'Отправка...' : 'Подтвердить перевод'}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

// СТИЛИ
const containerStyle = { padding: '20px 16px', minHeight: '100vh', color: '#fff' };
const titleStyle = { fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0' };
const subtitleStyle = { fontSize: '14px', color: '#666d75', margin: '0 0 32px 0' };

const menuGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const menuCardStyle = { background: '#14161a', border: '1px solid #202329', borderRadius: '20px', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' };
const menuIconStyle = (color) => ({ width: '64px', height: '64px', borderRadius: '16px', background: `${color}15`, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px auto', color: color });
const menuTitleStyle = { fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0' };
const menuDescStyle = { fontSize: '12px', color: '#666d75', margin: 0, lineHeight: '1.4' };

const qrDisplayStyle = { background: '#14161a', border: '1px solid #202329', borderRadius: '24px', padding: '32px 24px', textAlign: 'center', position: 'relative' };
const closeButtonStyle = { position: 'absolute', top: '16px', right: '16px', background: '#1c1f26', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' };
const qrTitleStyle = { fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' };
const qrSubtitleStyle = { fontSize: '13px', color: '#666d75', margin: '0 0 24px 0' };
const qrCodeWrapperStyle = { background: '#fff', padding: '20px', borderRadius: '20px', display: 'inline-block', marginBottom: '24px' };
const userInfoCardStyle = { background: '#1c1f26', border: '1px solid #202329', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' };
const userAvatarStyle = { width: '48px', height: '48px', borderRadius: '12px', background: '#14161a', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const userNameTextStyle = { fontSize: '16px', fontWeight: '700', color: '#fff', textAlign: 'left' };
const userPhoneTextStyle = { fontSize: '13px', color: '#666d75', textAlign: 'left' };

const scannerContainerStyle = { position: 'relative', minHeight: '80vh' };
const scanTitleStyle = { fontSize: '18px', fontWeight: '700', textAlign: 'center', marginBottom: '24px' };
const qrReaderStyle = { maxWidth: '400px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden' };
const scanningIndicatorStyle = { textAlign: 'center', marginTop: '24px' };

const confirmContainerStyle = { background: '#14161a', border: '1px solid #202329', borderRadius: '24px', padding: '32px 24px', position: 'relative' };
const confirmHeaderStyle = { textAlign: 'center', marginBottom: '24px' };
const confirmTitleStyle = { fontSize: '20px', fontWeight: '700', margin: '12px 0 0 0' };
const recipientCardStyle = { background: '#1c1f26', border: '1px solid #202329', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' };
const recipientAvatarStyle = { width: '56px', height: '56px', borderRadius: '14px', background: '#14161a', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const recipientNameStyle = { fontSize: '18px', fontWeight: '700', color: '#fff', textAlign: 'left', marginBottom: '4px' };
const recipientPhoneStyle = { fontSize: '14px', color: '#666d75', textAlign: 'left' };
const amountInputGroupStyle = { marginBottom: '24px', textAlign: 'left' };
const labelStyle = { fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '8px' };
const amountInputStyle = { width: '93%', padding: '16px', borderRadius: '14px', border: '1px solid #202329', background: '#1c1f26', color: '#fff', fontSize: '20px', fontWeight: '700', outline: 'none', textAlign: 'center' };
const balanceTextStyle = { fontSize: '12px', color: '#666d75', display: 'block', marginTop: '8px' };
const confirmButtonStyle = (disabled) => ({ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: disabled ? '#0c6e47' : '#11bb77', color: disabled ? '#666' : '#000', fontWeight: '700', fontSize: '16px', cursor: disabled ? 'not-allowed' : 'pointer' });
