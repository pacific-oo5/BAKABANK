import React, { useState, useEffect, useRef } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { Send, Bot, User, X, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/zhaba.css';

// Скрипты ответов ЖАБЫ
const ZHABA_RESPONSES = {
  greeting: [
    "Ква-ква! Я ЖАБА — твой финансовый помощник в BakaBank! 🐸",
    "Привет! Я ЖАБА, готова помочь с финансами! Ква!",
    "Салам! ЖАБА на связи! Чем могу помочь?"
  ],
  balance: [
    "Твой баланс на карте: {balance} сом. Ква-ква! 💰",
    "На твоей карте {balance} сом. Хочешь инвестировать? 📈",
    "Баланс карты: {balance} сом. Не забывай копить! 🐷"
  ],
  invest: [
    "M-Invest — это круто! Можешь купить акции BAKAI, NVDA, GOLD или BTC. Ква! 📊",
    "Инвестиции — путь к богатству! Начни с малого, купи акции в разделе M-Invest! 🚀",
    "Хочешь стать инвестором? Пополни инвест-счет и покупай акции! Ква-ква! 💎"
  ],
  credit: [
    "Кредиты от 5,000 до 300,000 сом! Ставка от 14% годовых. Ква! 💸",
    "Нужны деньги? Оформи кредит за 5 секунд без справок! 🏦",
    "Кредитный конвейер работает 24/7! Одобрение мгновенное! Ква-ква! ⚡"
  ],
  transfer: [
    "Переводы по номеру телефона или QR-коду — без комиссии! Ква! 📲",
    "Отправь деньги другу через QR-код! Быстро и удобно! 🎯",
    "Переводы внутри BakaBank бесплатные! Пользуйся! 💚"
  ],
  help: [
    "Я могу рассказать про:\n• Баланс и карты 💳\n• Инвестиции 📊\n• Кредиты 💰\n• Переводы 📲\n• QR-платежи 🔲\nПросто спроси! Ква!",
    "Спрашивай про баланс, инвестиции, кредиты или переводы! Я знаю всё! 🐸",
    "Нужна помощь? Спроси про любую функцию BakaBank! Ква-ква! 💡"
  ],
  unknown: [
    "Ква? Не совсем понял... Попробуй спросить про баланс, инвестиции или кредиты! 🤔",
    "Хм... Я пока не знаю ответа. Спроси про карты, переводы или инвестиции! 🐸",
    "Ква-ква! Переформулируй вопрос, пожалуйста! Я помогу! 💚"
  ],
  thanks: [
    "Всегда пожалуйста! Ква-ква! 🐸💚",
    "Рад помочь! Обращайся ещё! Ква! 😊",
    "Без проблем! ЖАБА всегда на связи! 🚀"
  ]
};

export default function ZhabaAssistant() {
  const { user } = useTradingStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
    if (lower.match(/привет|салам|здравствуй|ква/)) return 'greeting';
    if (lower.match(/баланс|сколько денег|карт/)) return 'balance';
    if (lower.match(/инвест|акци|купить|портфель|биржа/)) return 'invest';
    if (lower.match(/кредит|займ|деньги в долг/)) return 'credit';
    if (lower.match(/перевод|отправить|qr|кюар/)) return 'transfer';
    if (lower.match(/помощь|помоги|что умеешь|функци/)) return 'help';
    if (lower.match(/спасибо|благодар|спс|thx/)) return 'thanks';
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
      const intent = detectIntent(input);
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: generateResponse(intent),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  const handleClear = () => {
    const welcomeMsg = {
      id: Date.now(),
      type: 'bot',
      text: ZHABA_RESPONSES.greeting[1],
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMsg]);
    localStorage.removeItem(`zhaba_chat_${user?.id}`);
  };

  return (
    <div className="zhaba-container">
      {/* HEADER */}
      <div className="zhaba-header glass">
        <div className="zhaba-header-left">
          <div className="zhaba-avatar">
            <Bot size={24} strokeWidth={2.5} />
          </div>
          <div className="zhaba-info">
            <h3 className="zhaba-name">ЖАБА</h3>
            <span className="zhaba-status">
              <Sparkles size={12} />
              Финансовый ассистент
            </span>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleClear}
          className="zhaba-clear-btn"
        >
          <Trash2 size={20} />
        </motion.button>
      </div>

      {/* MESSAGES */}
      <div className="zhaba-messages">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`message-wrapper ${msg.type}`}
            >
              {msg.type === 'bot' && (
                <div className="message-avatar bot-avatar">
                  <Bot size={16} strokeWidth={2.5} />
                </div>
              )}
              <div className={`message-bubble ${msg.type}`}>
                <p className="message-text">{msg.text}</p>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {msg.type === 'user' && (
                <div className="message-avatar user-avatar">
                  <User size={16} strokeWidth={2.5} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="message-wrapper bot"
          >
            <div className="message-avatar bot-avatar">
              <Bot size={16} strokeWidth={2.5} />
            </div>
            <div className="typing-bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="zhaba-input-container glass">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Спроси ЖАБУ о чём угодно..."
          className="zhaba-input"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!input.trim()}
          className={`zhaba-send-btn ${input.trim() ? 'active' : ''}`}
        >
          <Send size={20} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
