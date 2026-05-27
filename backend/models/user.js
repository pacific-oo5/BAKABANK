const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true }, // Логин для входа
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  
  // Банковские счета (Экосистема MBank)
  accounts: {
    card: {
      cardNumber: { type: String, unique: true },
      balance: { type: Number, default: 50000.00 } // Дадим 50к при регистрации для теста
    },
    invest: {
      balance: { type: Number, default: 0.00 },
      portfolio: { type: Map, of: Number, default: {} } // Тут будут храниться акции
    },
    deposit: {
      balance: { type: Number, default: 0.00 },
      active: { type: Boolean, default: false }
    },
    piggyBank: {
      balance: { type: Number, default: 0.00 } // Копилка
    }
  },
  
  // Кредитный модуль
  credits: [{
    amount: Number,
    remainingAmount: Number,
    monthlyPayment: Number,
    nextPaymentDate: String
  }]
});

module.exports = mongoose.model('User', UserSchema);