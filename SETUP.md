# 🚀 Инструкция по запуску BakaBank

## ✅ Конфигурация завершена!

Фронтенд настроен на работу с ngrok URL:
```
https://supersympathetic-dana-disharmoniously.ngrok-free.dev
```

---

## 📋 Шаги для запуска

### 1️⃣ Запуск Backend (на сервере с ngrok)

```bash
cd backend
node server.js
```

**Ожидаемый вывод:**
```
🚀 Локальная база данных SQLite успешно создана и подключена!
🏦 BakaBank Core System успешно запущен на порту: 3001
```

**Важно:** Убедитесь, что ngrok проксирует порт 3001:
```bash
ngrok http 3001
```

---

### 2️⃣ Запуск Frontend (локально)

```bash
cd bank-trading-app/frontend
npm run dev
```

**Откроется на:** `http://localhost:5173`

---

## 🔧 Переключение между ngrok и localhost

### Для работы с ngrok (текущая конфигурация):
Файл `frontend/src/config.js`:
```javascript
export const API_BASE_URL = 'https://supersympathetic-dana-disharmoniously.ngrok-free.dev';
```

### Для локальной разработки:
Раскомментируйте в `frontend/src/config.js`:
```javascript
export const API_BASE_URL = 'http://localhost:3001';
```

---

## 📱 Тестирование

### Демо-вход:
- Нажмите кнопку **"⚡ Быстрый демо-вход (Бекжан)"**
- Баланс: 50,000 сом

### Реальная регистрация:
1. Введите номер телефона (например: `0700123456`)
2. Придумайте пароль
3. Введите ФИО

---

## 🎯 Функционал для проверки:

✅ **Главная** - баланс карты  
✅ **Платежи** - перевод по номеру телефона, пополнение M-Invest  
✅ **Кредиты** - оформление и погашение кредита  
✅ **M-Invest** - покупка акций (BAKAI, NVDA, GOLD, BTC)  
✅ **Профиль** - изменение номера телефона, выход  

---

## ⚠️ Возможные проблемы

### Ошибка CORS:
Если видите ошибку CORS в консоли браузера, проверьте:
1. Backend запущен и доступен через ngrok
2. ngrok URL актуален (не истек)

### Ошибка "Нет связи с сервером":
1. Проверьте, что backend запущен
2. Проверьте ngrok туннель: `curl https://supersympathetic-dana-disharmoniously.ngrok-free.dev/api/invest/market`

---

## 📝 Обновленные файлы:

- ✅ `frontend/src/config.js` - создан конфиг с API URL
- ✅ `frontend/src/App.jsx` - обновлен
- ✅ `frontend/src/pages/Transfer.jsx` - обновлен
- ✅ `frontend/src/pages/Credits.jsx` - обновлен
- ✅ `frontend/src/pages/invest.jsx` - обновлен
- ✅ `frontend/src/pages/Profile.jsx` - обновлен
- ✅ `frontend/src/pages/Main.jsx` - обновлен
- ✅ `frontend/src/pages/auth.jsx` - обновлен
- ✅ `frontend/src/pages/register.jsx` - обновлен

Все файлы теперь используют `API_BASE_URL` из конфига!
