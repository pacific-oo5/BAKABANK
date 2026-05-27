const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ====================================================================
// 1. ПОДКЛЮЧЕНИЕ К ЛОКАЛЬНОЙ БАЗЕ ДАННЫХ SQLITE
// ====================================================================
const dbPath = path.resolve(__dirname, 'bank.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('❌ Ошибка открытия базы SQLite:', err.message);
  console.log('🚀 Локальная база данных SQLite успешно создана и подключена! (Файл bank.db)');
});

// ====================================================================
// 2. ИНИЦИАЛИЗАЦИЯ ВСЕХ ТАБЛИЦ ЯДРА БАНКА
// ====================================================================
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phoneNumber TEXT UNIQUE,
    passwordHash TEXT,
    fullName TEXT,
    cardNumber TEXT UNIQUE,
    cardBalance REAL DEFAULT 50000.00,
    investBalance REAL DEFAULT 0.00,
    depositBalance REAL DEFAULT 0.00,
    piggyBalance REAL DEFAULT 0.00
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    symbol TEXT,
    quantity INTEGER,
    avgPrice REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    amount REAL,
    remainingAmount REAL,
    monthlyPayment REAL,
    termMonths INTEGER,
    nextPaymentDate TEXT
  )`);
});

function generateCardNumber() {
  return "4000 " + Array.from({length: 3}, () => Math.floor(1000 + Math.random() * 9000)).join(' ');
}

const STOCKS = [
  { symbol: 'BAKAI', name: 'Бакай Банк', price: 145.50, change: +2.4 },
  { symbol: 'NVDA', name: 'Nvidia Corp', price: 1240.15, change: +5.1 },
  { symbol: 'GOLD', name: 'Золото (XAU)', price: 2340.00, change: -0.8 },
  { symbol: 'BTC', name: 'Bitcoin', price: 67200.50, change: +1.2 }
];

// ====================================================================
// 3. СИСТЕМА РЕГИСТРАЦИИ И АВТОРИЗАЦИИ
// ====================================================================
app.post('/api/auth/register', async (req, res) => {
  const { phoneNumber, password, fullName } = req.body;
  try {
    if (!phoneNumber || !password || !fullName) {
      return res.status(400).json({ error: 'Заполните все поля формы!' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const cardNumber = generateCardNumber();
    const sql = `INSERT INTO users (phoneNumber, passwordHash, fullName, cardNumber) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [phoneNumber, passwordHash, fullName, cardNumber], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Этот номер телефона уже зарегистрирован в BakaBank' });
        }
        return res.status(500).json({ error: err.message });
      }
      db.get(`SELECT * FROM users WHERE id = ?`, [this.lastID], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        delete user.passwordHash;
        res.status(201).json(user);
      });
    });
  } catch (e) {
    res.status(500).json({ error: 'Внутренняя ошибка сервера: ' + e.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { phoneNumber, password } = req.body;
  if (!phoneNumber || !password) return res.status(400).json({ error: 'Введите номер и пароль' });

  db.get(`SELECT * FROM users WHERE phoneNumber = ?`, [phoneNumber], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Пользователь с таким номером не найден' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Неверный пароль доступа' });

    delete user.passwordHash;
    res.json(user);
  });
});

// ====================================================================
// 4. ПРОФИЛЬ КЛИЕНТА (ФОНОВОЕ ОБНОВЛЕНИЕ БАЛАНСОВ)
// ====================================================================
app.get('/api/user/profile/:id', (req, res) => {
  db.get(`SELECT * FROM users WHERE id = ?`, [req.params.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    delete user.passwordHash;
    res.json(user);
  });
});

app.put('/api/user/update-phone', (req, res) => {
  const { userId, newPhoneNumber } = req.body;
  if (!userId || !newPhoneNumber) return res.status(400).json({ error: 'Данные не переданы' });

  db.run(`UPDATE users SET phoneNumber = ? WHERE id = ?`, [newPhoneNumber, userId], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Этот номер телефона уже занят' });
      return res.status(500).json({ error: err.message });
    }
    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, updatedUser) => {
      delete updatedUser.passwordHash;
      res.json({ message: 'Номер телефона успешно обновлен', user: updatedUser });
    });
  });
});

// ====================================================================
// 5. РАСЧЕТНО-КАССОВЫЕ ОПЕРАЦИИ (ТРАНЗАКЦИОННЫЙ ХАБ)
// ====================================================================
app.post('/api/bank/transfer-phone', (req, res) => {
  const { senderId, targetPhone, amount } = req.body;
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Укажите корректную сумму' });

  db.get(`SELECT id FROM users WHERE phoneNumber = ?`, [targetPhone.trim()], (err, recipientRow) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!recipientRow) return res.status(404).json({ error: 'Получатель с таким номером телефона не найден' });
    if (senderId === recipientRow.id) return res.status(400).json({ error: 'Нельзя переводить самому себе' });

    db.get(`SELECT cardBalance FROM users WHERE id = ?`, [senderId], (err, senderRow) => {
      if (senderRow.cardBalance < amt) return res.status(400).json({ error: 'Недостаточно средств на карте' });

      db.serialize(() => {
        db.run(`UPDATE users SET cardBalance = cardBalance - ? WHERE id = ?`, [amt, senderId]);
        db.run(`UPDATE users SET cardBalance = cardBalance + ? WHERE id = ?`, [amt, recipientRow.id], (err) => {
          if (err) return res.status(500).json({ error: 'Ошибка транзакции' });
          db.get(`SELECT * FROM users WHERE id = ?`, [senderId], (err, updatedUser) => {
            delete updatedUser.passwordHash;
            res.json({ message: `Успешно переведено ${amt} сомов`, user: updatedUser });
          });
        });
      });
    });
  });
});

app.post('/api/bank/fund-invest', (req, res) => {
  const { userId, amount } = req.body;
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Укажите корректную сумму пополнения' });

  db.get(`SELECT cardBalance FROM users WHERE id = ?`, [userId], (err, row) => {
    if (row.cardBalance < amt) return res.status(400).json({ error: 'Недостаточно средств на дебетовой карте' });

    db.serialize(() => {
      db.run(`UPDATE users SET cardBalance = cardBalance - ?, investBalance = investBalance + ? WHERE id = ?`, [amt, amt, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка перевода' });
        db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, updatedUser) => {
          delete updatedUser.passwordHash;
          res.json({ message: 'Брокерский счет успешно пополнен', user: updatedUser });
        });
      });
    });
  });
});

// ====================================================================
// 6. КРЕДИТНЫЙ КОНВЕЙЕР (ИСПРАВЛЕНЫ ОШИБКИ ПОДГРУЗКИ)
// ====================================================================
app.get('/api/credit/active/:userId', (req, res) => {
  db.get(`SELECT * FROM credits WHERE userId = ? AND remainingAmount > 0`, [req.params.userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Отдаем 200 ОК и null вместо 404, чтобы консоль не спамила ошибками
    if (!row) return res.json(null);
    res.json(row);
  });
});

app.post('/api/credit/take', (req, res) => {
  const { userId, amount, termMonths, rate } = req.body;
  const amt = parseFloat(amount);
  const months = parseInt(termMonths);
  const r = parseFloat(rate) / 100 / 12;

  if (!amt || amt <= 0 || !months) return res.status(400).json({ error: 'Некорректные параметры расчета' });

  const monthlyPayment = +(amt * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)).toFixed(2);
  const totalToPay = +(monthlyPayment * months).toFixed(2);

  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  const nextDateStr = nextDate.toISOString().split('T')[0];

  db.get(`SELECT id FROM credits WHERE userId = ? AND remainingAmount > 0`, [userId], (err, activeCredit) => {
    if (activeCredit) return res.status(400).json({ error: 'Отказано скорингом: У вас уже есть непогашенный кредит!' });

    db.serialize(() => {
      db.run(`INSERT INTO credits (userId, amount, remainingAmount, monthlyPayment, termMonths, nextPaymentDate) 
              VALUES (?, ?, ?, ?, ?, ?)`, [userId, amt, totalToPay, monthlyPayment, months, nextDateStr]);
      
      db.run(`UPDATE users SET cardBalance = cardBalance + ? WHERE id = ?`, [amt, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка зачисления средств' });
        db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, updatedUser) => {
          delete updatedUser.passwordHash;
          res.json({ message: 'Кредит одобрен скорингом! Деньги зачислены на карту.', user: updatedUser });
        });
      });
    });
  });
});

app.post('/api/credit/pay', (req, res) => {
  const { userId, payAmount } = req.body;
  const payAmt = parseFloat(payAmount);
  if (!payAmt || payAmt <= 0) return res.status(400).json({ error: 'Укажите валидную сумму платежа' });

  db.get(`SELECT * FROM credits WHERE userId = ? AND remainingAmount > 0`, [userId], (err, credit) => {
    if (!credit) return res.status(404).json({ error: 'Активных кредитов не обнаружено' });

    db.get(`SELECT cardBalance FROM users WHERE id = ?`, [userId], (err, user) => {
      if (user.cardBalance < payAmt) return res.status(400).json({ error: 'Недостаточно денег на дебетовой карте' });

      const realSpisanie = payAmt > credit.remainingAmount ? credit.remainingAmount : payAmt;

      db.serialize(() => {
        db.run(`UPDATE users SET cardBalance = cardBalance - ? WHERE id = ?`, [realSpisanie, userId]);
        db.run(`UPDATE credits SET remainingAmount = remainingAmount - ? WHERE id = ?`, [realSpisanie, credit.id], (err) => {
          if ((credit.remainingAmount - realSpisanie) <= 0) {
             db.run(`DELETE FROM credits WHERE id = ?`, [credit.id]);
          } else {
             const nextDate = new Date(credit.nextPaymentDate);
             nextDate.setMonth(nextDate.getMonth() + 1);
             db.run(`UPDATE credits SET nextPaymentDate = ? WHERE id = ?`, [nextDate.toISOString().split('T')[0], credit.id]);
          }
          db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, updatedUser) => {
            delete updatedUser.passwordHash;
            res.json({ message: realSpisanie >= credit.remainingAmount ? 'Кредит успешно закрыт! Вы свободны от долгов.' : 'Платеж успешно зачислен', user: updatedUser });
          });
        });
      });
    });
  });
});

// ====================================================================
// 7. МОДУЛЬ ТОРГОВОГО БИРЖЕВОГО ТЕРМИНАЛА (M-INVEST)
// ====================================================================
app.get('/api/invest/market', (req, res) => {
  const liveStocks = STOCKS.map(s => {
    const drift = (Math.random() - 0.5) * (s.price * 0.01); 
    return { ...s, price: +(s.price + drift).toFixed(2), change: +(s.change + (Math.random() - 0.5) * 0.4).toFixed(2) };
  });
  res.json(liveStocks);
});

app.post('/api/invest/buy', (req, res) => {
  const { userId, symbol, quantity, price } = req.body;
  const qty = parseInt(quantity);
  const prc = parseFloat(price);
  const totalCost = qty * prc;

  if (!qty || qty <= 0) return res.status(400).json({ error: 'Укажите количество штук' });

  db.get(`SELECT investBalance FROM users WHERE id = ?`, [userId], (err, user) => {
    if (user.investBalance < totalCost) return res.status(400).json({ error: 'Недостаточно средств на брокерском счете M-Invest' });

    db.serialize(() => {
      db.run(`UPDATE users SET investBalance = investBalance - ? WHERE id = ?`, [totalCost, userId]);
      db.run(`INSERT INTO portfolio (userId, symbol, quantity, avgPrice) VALUES (?, ?, ?, ?)`, 
        [userId, symbol, qty, prc], () => {
          res.json({ message: 'Акция успешно добавлена в портфель' });
      });
    });
  });
});

app.get('/api/invest/portfolio/:userId', (req, res) => {
  db.all(`SELECT symbol, SUM(quantity) as totalQty, AVG(avgPrice) as avgPrice FROM portfolio WHERE userId = ? GROUP BY symbol HAVING totalQty > 0`, 
    [req.params.userId], (err, rows) => {
      res.json(rows || []);
  });
});

// ====================================================================
// 8. ИИ ЖАБА-КОНСУЛЬТАНТ (BAKA-AI)
// ====================================================================
app.post('/api/ai/chat', (req, res) => {
  const { message, userName, cardBalance } = req.body;
  if (!message) return res.status(400).json({ error: 'Пустой запрос' });

  const msg = message.toLowerCase();
  let reply = `Ква! Уважаемый ${userName || 'клиент'}, я ваш персональный жабий ИИ-помощник BakaBank. Задайте вопрос про баланс, кредиты или инвестиции!`;

  if (msg.includes('баланс') || msg.includes('деньг') || msg.includes('сколько')) {
    reply = `Ква! Твой текущий дебетовый баланс составляет ровно ${cardBalance ? cardBalance.toLocaleString('ru-RU') : '0'} сомов. Распоряжайся ими с умом!`;
  } else if (msg.includes('инвест') || msg.includes('акции') || msg.includes('биржа')) {
    reply = `Вкладка M-Invest — пушка! Ква! Закидывай деньги через Платежи -> Пополнение брокерского счета и скупай акции Бакай Банка или Биткоин.`;
  } else if (msg.includes('кредит') || msg.includes('взять') || msg.includes('долг')) {
    reply = `Нужны сомы прямо сейчас? Ква! Загляни во вкладку Кредиты. Наш автоматический кредитный конвейер выдаст деньги под аннуитет за 5 секунд!`;
  } else if (msg.includes('привет') || msg.includes('салам')) {
    reply = `Привет, ква! Финансовая Жаба BakaBank на связи. Рад помочь тебе с кредитами, инвестициями или переводами!`;
  }
  setTimeout(() => res.json({ reply }), 500);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏦 BakaBank Core System успешно запущен на порту: ${PORT}`);
  console.log(`====================================================`);
});