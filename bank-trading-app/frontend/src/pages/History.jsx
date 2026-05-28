import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { ArrowUpRight, ArrowDownLeft, Smartphone, ShoppingBag, TrendingUp, Briefcase, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Функция для подбора иконки и цвета на основе типа транзакции
const getTransactionMeta = (type) => {
  switch (type) {
    case 'transfer_out':
      return { icon: ArrowUpRight, color: '#FF453A' };
    case 'transfer_in':
      return { icon: ArrowDownLeft, color: '#30D158' };
    case 'payment_service':
    case 'payment':
      return { icon: Smartphone, color: '#FF9500' };
    case 'payment_shop':
      return { icon: ShoppingBag, color: '#0A84FF' };
    case 'stock_buy':
      return { icon: TrendingUp, color: '#FF453A' }; // Покупка (минус деньги)
    case 'stock_sell':
      return { icon: TrendingUp, color: '#30D158' }; // Продажа (плюс деньги)
    case 'broker_deposit':
      return { icon: Briefcase, color: '#0A84FF' };
    default:
      return { icon: Clock, color: '#525a64' };
  }
};

export default function History() {
  const user = useTradingStore((state) => state.user);
  const [activeSubTab, setActiveSubTab] = useState('banking'); // 'banking' или 'investments'
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Фетч истории операций с реального бэкенда
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
        console.error('Ошибка загрузки истории с бэкенда:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.id]);

  // Фильтруем транзакции по категориям из базы данных
  // Категория 'banking': переводы, оплата услуг, покупки
  // Категория 'invest': покупка/продажа акций (NVIDIA и др.), пополнение инвест-счета
  const filteredData = transactions.filter(t => {
    if (activeSubTab === 'banking') {
      return t.category === 'banking' || t.category === 'transfers';
    } else {
      return t.category === 'invest' || t.category === 'investments';
    }
  });

  return (
    <div style={historyContainerStyle}>
      <h2 style={pageTitleStyle}>История операций</h2>

      {/* ПЕРЕКЛЮЧАТЕЛЬ ВКЛАДОК */}
      <div style={tabContainerStyle}>
        <button 
          onClick={() => setActiveSubTab('banking')} 
          style={tabButtonStyle(activeSubTab === 'banking')}
        >
          Банковские счёта
        </button>
        <button 
          onClick={() => setActiveSubTab('investments')} 
          style={tabButtonStyle(activeSubTab === 'investments')}
        >
          Ценные бумаги
        </button>
      </div>

      {/* ЛЕНТА ОПЕРАЦИЙ */}
      <div style={listContainerStyle}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {loading ? (
              <div style={emptyStateStyle}>
                <p style={{ color: '#525a64', fontSize: '14px' }}>Загрузка истории...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div style={emptyStateStyle}>
                <AlertCircle size={32} color="#525a64" />
                <p style={{ marginTop: '8px', color: '#525a64', fontSize: '14px' }}>
                  {activeSubTab === 'banking' 
                    ? 'Нет банковских операций' 
                    : 'Вы еще не совершали сделок с ценными бумагами'}
                </p>
              </div>
            ) : (
              filteredData.map((item) => {
                const { icon: IconComponent, color } = getTransactionMeta(item.type);
                const isNegative = item.amount < 0;
                
                // Форматирование даты (если с бэкенда летит ISO-строка)
                const displayDate = new Date(item.createdAt || item.date).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={item.id || item._id} style={transactionItemStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={iconWrapperStyle(color)}>
                        <IconComponent size={20} color={color} strokeWidth={2.5} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <span style={itemTitleStyle}>{item.title}</span>
                        <span style={itemSubTitleStyle}>{item.description}</span>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <span style={itemAmountStyle(isNegative)}>
                        {isNegative ? '' : '+'}{item.amount.toLocaleString('ru-RU')} {item.currency || 'с'}
                      </span>
                      <span style={itemDateStyle}>{displayDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// СТИЛИ (PREMIUM DARK)
const historyContainerStyle = { width: '100%', maxWidth: '440px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' };
const pageTitleStyle = { fontSize: '22px', fontWeight: '800', color: '#fff', textAlign: 'left', margin: '10px 4px 20px 4px' };
const tabContainerStyle = { display: 'flex', background: '#14161a', padding: '4px', borderRadius: '14px', border: '1px solid #202329', marginBottom: '20px' };
const tabButtonStyle = (isActive) => ({ flex: 1, padding: '12px', background: isActive ? '#1c1f26' : 'transparent', color: isActive ? '#11bb77' : '#525a64', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' });
const listContainerStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const transactionItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#14161a', padding: '14px 16px', borderRadius: '18px', border: '1px solid #202329', marginBottom: '10px' };
const iconWrapperStyle = (color) => ({ width: '42px', height: '42px', borderRadius: '12px', background: `${color}15`, display: 'flex', justifyContent: 'center', alignItems: 'center' });
const itemTitleStyle = { fontSize: '14px', fontWeight: '700', color: '#fff', display: 'block', marginBottom: '2px' };
const itemSubTitleStyle = { fontSize: '11px', color: '#525a64', display: 'block' };
const itemAmountStyle = (isNegative) => ({ fontSize: '15px', fontWeight: '800', color: isNegative ? '#fff' : '#11bb77', display: 'block', marginBottom: '2px' });
const itemDateStyle = { fontSize: '11px', color: '#525a64', display: 'block' };
const emptyStateStyle = { padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };