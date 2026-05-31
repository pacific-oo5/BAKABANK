import React, { useState, useEffect, useRef } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { Send, Terminal, User, Trash2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/zhaba.css';

// Пружины Эмила Ковальски
const springConfig = { type: "spring", stiffness: 400, damping: 30 };

// Индустриальные скрипты ответов ЖАБЫ
const ZHABA_RESPONSES = {
  greeting: [
    "> СИСТЕМА АКТИВИРОВАНА. ИИ-Жаба BakaBank на связи. Ква. 🐸",
    "> СОЕДИНЕНИЕ УСТАНОВЛЕНО. Финансовый модуль 'ЖАБА' готов к работе. Ква.",
    "> ИНИЦИАЛИЗАЦИЯ... Приветствую! Чем могу помочь в управлении активами?"
  ],
  balance: [
    "> ЗАПРОС БАЛАНСА: {balance} KGS. Рекомендую инвестировать свободные средства. Ква. 💰",
    "> АНАЛИЗ СЧЕТА: На вашем балансе {balance} KGS. Транзакции доступны. 📈",
    "> ТЕКУЩИЙ АКТИВ: {balance} KGS. Копите ресурсы! Ква. 🐷"
  ],
  invest: [
    "> МОДУЛЬ M-INVEST: Доступны тикеры BAKAI, NVDA, GOLD, BTC. Начните торговлю прямо сейчас. 📊",
    "> ДИРЕКТИВА: Инвестиции генерируют капитал. Перейдите во вкладку M-Invest для покупки активов. 🚀"
  ],
  credit: [
    "> КРЕДИТНЫЙ КОНВЕЙЕР: Линии от 5,000 до 300,000 KGS. Скоринг занимает 5.2 секунды. Ква. 💸",
    "> АНАЛИЗ ВОЗМОЖНОСТЕЙ: Вам доступен моментальный займ. Оформление без физических документов. 🏦"
  ],
  transfer: [
    "> МАРШРУТИЗАЦИЯ: Доступны P2P-переводы по номеру и QR-коду (0% комиссия внутри сети). 📲",
    "> ОПТИЧЕСКАЯ ТРАНЗАКЦИЯ: Используйте QR-сканер для мгновенной передачи средств. Ква. 🎯"
  ],
  help: [
    "> ДОСТУПНЫЕ КОМАНДЫ:\n• [БАЛАНС] - проверка фиата\n• [ИНВЕСТ] - биржа\n• [КРЕДИТ] - займы\n• [ПЕРЕВОД] - маршрутизация\nОжидаю ввода. Ква.",
    "> СПРАВКА: Мой нейросетевой модуль обучен банковским операциям. Задайте вопрос. 🐸"
  ],
  unknown: [
    "> ОШИБКА СИНТАКСИСА: Запрос не распознан. Попробуйте ключевые слова: 'баланс', 'кредит', 'перевод'. 🤔",
    "> EXCEPTION: Ква? Переформулируйте директиву, пожалуйста. 🐸"
  ],
  thanks: [
    "> ТРАНЗАКЦИЯ ЗАВЕРШЕНА: Всегда к вашим услугам. Ква! 💚",
    "> СТАТУС: Рад помочь. Обращайтесь при необходимости. 🚀"
  ]
};

export default function ZhabaAssistant() {
  const { user } = useTradingStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(`zhaba_chat_${user?.id}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{
        id: Date.now(),
        type: 'bot',
        text: ZHABA_RESPONSES.greeting[0],
        timestamp: new Date().toISOString()
      }]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (messages.length > 0 && user?.id) {
      localStorage.setItem(`zhaba_chat_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const detectIntent = (text) => {
    const lower = text.toLowerCase();
    if (lower.match(/привет|салам|здравствуй|ква|hi/)) return 'greeting';
    if (lower.match(/баланс|сколько|деньг|счет|карт/)) return 'balance';
    if (lower.match(/инвест|акци|купить|биржа|портфель/)) return 'invest';
    if (lower.match(/кредит|займ|долг/)) return 'credit';
    if (lower.match(/перевод|отправить|qr|кюар/)) return 'transfer';
    if (lower.match(/помощь|помоги|умеешь|команд/)) return 'help';
    if (lower.match(/спасибо|спс|thx|благодар/)) return 'thanks';
    return 'unknown';
  };

  const generateResponse = (intent) => {
    const responses = ZHABA_RESPONSES[intent];
    let response = responses[Math.floor(Math.random() * responses.length)];
    if (intent === 'balance' && user) {
      response = response.replace('{balance}', user.cardBalance?.toLocaleString('ru-RU') || '0');
    }
    return response;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const intent = detectIntent(userMessage.text);
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: generateResponse(intent),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 600 + Math.random() * 400); // Чуть быстрее для "машинного" ощущения
  };

  const handleClear = () => {
    const welcomeMsg = {
      id: Date.now(),
      type: 'bot',
      text: "> ЛОГ ОЧИЩЕН. Система готова к новым запросам. Ква.",
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMsg]);
    localStorage.removeItem(`zhaba_chat_${user?.id}`);
  };

  return (
    <div className="terminal-container">
      {/* HEADER */}
      <div className="terminal-header">
        <div className="terminal-header-left">
          <div className="terminal-avatar">
            <Cpu size={24} strokeWidth={2} />
          </div>
          <div className="terminal-info">
            <h3 className="terminal-name">BAKA-AI // ЖАБА</h3>
            <span className="terminal-status">
              <span className="status-dot"></span> СИСТЕМА В СЕТИ
            </span>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleClear} className="terminal-clear-btn">
          <Trash2 size={18} />
          <span>PURGE</span>
        </motion.button>
      </div>

      {/* MESSAGES LOG */}
      <div className="terminal-log">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              transition={springConfig}
              className={`log-entry ${msg.type}`}
            >
              <div className="log-header">
                <span className="log-actor">
                  {msg.type === 'bot' ? <Terminal size={12}/> : <User size={12}/>}
                  {msg.type === 'bot' ? 'SYS_ZHABA' : `USR_${user?.id || 'GUEST'}`}
                </span>
                <span className="log-time">
                  {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="log-content">
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="log-entry bot">
            <div className="log-header">
              <span className="log-actor"><Terminal size={12}/> SYS_ZHABA</span>
            </div>
            <div className="log-content typing-indicator">
              ГЕНЕРАЦИЯ ОТВЕТА<span className="cursor-blink">_</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="terminal-input-area">
        <div className="terminal-input-wrapper">
          <span className="terminal-prefix">CMD&gt;</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="ВВЕДИТЕ ЗАПРОС..."
            className="terminal-input"
            autoComplete="off"
            spellCheck="false"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className="terminal-send-btn"
          >
            <Send size={18} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}