import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { ArrowUpRight, ArrowDownLeft, Smartphone, ShoppingBag, TrendingUp, Briefcase, Clock, AlertCircle, X, Download, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import '../styles/history.css';

const springConfig = { type: "spring", stiffness: 400, damping: 30 };
const fastSpring = { type: "spring", stiffness: 500, damping: 35 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  exit: { opacity: 0, filter: "blur(4px)", transition: { duration: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: springConfig }
};

const getTransactionMeta = (type) => {
  switch (type) {
    case 'transfer_out':
      return { icon: ArrowUpRight, theme: 'danger' };
    case 'transfer_in':
      return { icon: ArrowDownLeft, theme: 'success' };
    case 'payment_service':
    case 'payment':
      return { icon: Smartphone, theme: 'warning' };
    case 'payment_shop':
      return { icon: ShoppingBag, theme: 'info' };
    case 'stock_buy':
      return { icon: TrendingUp, theme: 'danger' };
    case 'stock_sell':
      return { icon: TrendingUp, theme: 'success' };
    case 'broker_deposit':
      return { icon: Briefcase, theme: 'info' };
    default:
      return { icon: Clock, theme: 'neutral' };
  }
};

export default function History() {
  const user = useTradingStore((state) => state.user);
  const [activeSubTab, setActiveSubTab] = useState('banking');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Состояние для выбранной транзакции (Чек)
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/history/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (err) {
        console.error('Ошибка загрузки логов:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user?.id]);

  const filteredData = transactions.filter(t => {
    if (activeSubTab === 'banking') {
      return t.category === 'banking' || t.category === 'transfers';
    } else {
      return t.category === 'invest' || t.category === 'investments';
    }
  });

  const handleDownloadReceipt = () => {
    toast.success('Чек успешно сохранен в Галерею');
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h2 className="history-title">Лог операций</h2>
        <p className="history-subtitle">Системный реестр транзакций</p>
      </div>

      <div className="history-tabs-container">
        {['banking', 'investments'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveSubTab(tab)} 
            className={`history-tab-btn ${activeSubTab === tab ? 'active' : ''}`}
          >
            {activeSubTab === tab && (
              <motion.div layoutId="history-tab-bg" className="history-tab-active-bg" transition={fastSpring} />
            )}
            <span className="tab-label-text">
              {tab === 'banking' ? 'ФИАТНЫЕ СЧЕТА' : 'АКТИВЫ (M-INVEST)'}
            </span>
          </button>
        ))}
      </div>

      <div className="history-list-wrapper">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="history-list"
          >
            {loading ? (
              <motion.div variants={itemVariants} className="history-empty-state">
                <div className="spinner-util" />
                <span>ИЗВЛЕЧЕНИЕ ДАННЫХ ИЗ РЕЕСТРА...</span>
              </motion.div>
            ) : filteredData.length === 0 ? (
              <motion.div variants={itemVariants} className="history-empty-state">
                <AlertCircle size={32} className="empty-icon" />
                <span>
                  {activeSubTab === 'banking' 
                    ? 'ERR_NO_FIAT_TRANSACTIONS_FOUND' 
                    : 'ERR_NO_INVEST_DATA_FOUND'}
                </span>
              </motion.div>
            ) : (
              filteredData.map((item) => {
                const { icon: IconComponent, theme } = getTransactionMeta(item.type);
                const isNegative = item.amount < 0;
                
                const dateObj = new Date(item.date);
                const displayDate = dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
                const displayTime = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

                return (
                  <motion.div 
                    variants={itemVariants} 
                    key={item.id} 
                    className="tx-item"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTx(item)} // Открываем чек
                  >
                    <div className="tx-left">
                      <div className={`tx-icon-box ${theme}`}>
                        <IconComponent size={18} strokeWidth={2.5} />
                      </div>
                      <div className="tx-details">
                        <span className="tx-title">{item.title}</span>
                        <span className="tx-desc">{item.description}</span>
                      </div>
                    </div>
                    
                    <div className="tx-right">
                      <span className={`tx-amount ${isNegative ? 'negative' : 'positive'}`}>
                        {isNegative ? '' : '+'}{item.amount.toLocaleString('ru-RU')} <span>{item.currency || 'KGS'}</span>
                      </span>
                      <div className="tx-datetime">
                        <span>{displayDate}</span> • <span>{displayTime}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* === МОДАЛЬНОЕ ОКНО ЧЕКА (INVOICE MODAL) === */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="receipt-overlay"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95, filter: "blur(8px)" }}
              animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ y: 20, scale: 0.95, opacity: 0, filter: "blur(4px)" }}
              transition={springConfig}
              className="receipt-card"
              onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие при клике внутри окна
            >
              <div className="receipt-header">
                <div className="receipt-icon-wrapper">
                  <CheckCircle2 size={32} className="receipt-success-icon" />
                </div>
                <button className="receipt-close-btn" onClick={() => setSelectedTx(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="receipt-body">
                <p className="receipt-title">Транзакция выполнена</p>
                <h1 className="receipt-amount">
                  {selectedTx.amount < 0 ? '' : '+'}{selectedTx.amount.toLocaleString('ru-RU')} <span>{selectedTx.currency || 'KGS'}</span>
                </h1>

                <div className="receipt-divider" />

                <div className="receipt-data-table">
                  <div className="receipt-row">
                    <span className="receipt-label">ID Операции</span>
                    <span className="receipt-value">TXN-{String(selectedTx.id).padStart(8, '0')}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Тип</span>
                    <span className="receipt-value">{selectedTx.title}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Детали</span>
                    <span className="receipt-value truncate">{selectedTx.description}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Дата и время</span>
                    <span className="receipt-value">
                      {new Date(selectedTx.date).toLocaleString('ru-RU', { 
                        day: '2-digit', month: '2-digit', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit', second: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Статус</span>
                    <span className="receipt-value success-text">PROCESSED</span>
                  </div>
                </div>

                <div className="receipt-divider" />
              </div>

              <motion.button 
                whileTap={{ scale: 0.97 }} 
                className="receipt-download-btn"
                onClick={handleDownloadReceipt}
              >
                <Download size={18} />
                СКАЧАТЬ INVOICE
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}