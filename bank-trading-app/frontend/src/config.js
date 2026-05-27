// API Configuration - автоматическое определение
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:3001'  // Локальная разработка
  : `http://${window.location.hostname}:3001`;  // Удаленный доступ (используем тот же IP что и фронтенд)
