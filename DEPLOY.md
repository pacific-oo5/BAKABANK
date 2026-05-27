# 🌐 Запуск BakaBank: Фронтенд через ngrok, Backend локально

## 📋 Пошаговая инструкция

### 1️⃣ Запустите Backend локально

```bash
cd backend
node server.js
```

**Ожидаемый вывод:**
```
🚀 Локальная база данных SQLite успешно создана и подключена!
🏦 BakaBank Core System успешно запущен на порту: 3001
```

Backend будет доступен на `http://localhost:3001`

---

### 2️⃣ Соберите Frontend для продакшена

```bash
cd bank-trading-app/frontend
npm run build
```

Это создаст папку `dist` с готовым сайтом.

---

### 3️⃣ Запустите Frontend в preview режиме

```bash
npm run preview
```

По умолчанию запустится на порту `4173` (или `5173`).

---

### 4️⃣ Настройте ngrok для фронтенда

```bash
ngrok http 4173
```

Или если preview запустился на 5173:
```bash
ngrok http 5173
```

**Ngrok выдаст URL типа:**
```
https://supersympathetic-dana-disharmoniously.ngrok-free.dev
```

---

## ✅ Готово!

Теперь:
- 🌐 **Фронтенд** доступен через ngrok URL (публично)
- 💻 **Backend** работает локально на вашей машине
- 🔒 **CORS** настроен для работы с ngrok

---

## ⚠️ Важно!

Backend должен быть **запущен на той же машине**, где вы открываете сайт через ngrok, потому что фронтенд обращается к `http://localhost:3001`.

Если вы хотите, чтобы backend тоже был доступен удаленно, нужна другая конфигурация (два ngrok туннеля).

---

## 🔄 Альтернатива: Оба сервиса через ngrok

Если нужно, чтобы и backend был доступен удаленно:

1. Запустите два ngrok туннеля:
```bash
# Терминал 1 - Backend
ngrok http 3001

# Терминал 2 - Frontend  
ngrok http 5173
```

2. Обновите `frontend/src/config.js`:
```javascript
export const API_BASE_URL = 'https://your-backend-ngrok-url.ngrok-free.dev';
```

3. Пересоберите фронтенд:
```bash
npm run build
npm run preview
```
