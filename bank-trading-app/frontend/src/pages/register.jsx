import React, { useState } from 'react';
import { useTradingStore } from '../store/useTradingStore';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/app.css';

export default function Register({ onSwitchToAuth }) {
  const { setUser } = useTradingStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, password, fullName })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Ошибка при регистрации');
        setLoading(false);
        return;
      }

      // Если всё ок — авторизуем
      setUser(data);
      toast.success('Добро пожаловать в BakaBank!');
    } catch (err) {
      console.error(err);
      toast.error('Сервер не отвечает. Убедись, что бэкенд запущен');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
        success: { iconTheme: { primary: 'var(--color-accent-success)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--color-accent-error)', secondary: '#fff' } }
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card"
      >
        <div className="auth-header">
          <h2 className="auth-logo">BakaBank</h2>
          <p className="auth-subtitle">Цифровой суперапп • Регистрация</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-group">
            <label className="input-label">Имя и фамилия</label>
            <input
              type="text"
              placeholder="Иванов Иван"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Номер телефона</label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="0700 123 456"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
          </motion.button>
        </form>

        <div className="auth-divider">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSwitchToAuth}
            className="register-button"
          >
            Уже есть аккаунт? Войти
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}