import React, { useState } from 'react';
import { useTradingStore } from '../store/useTradingStore';

export default function Register({ onSwitchToAuth }) {
  const { setUser } = useTradingStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, password, fullName })
      });
      
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при регистрации');
        setLoading(false);
        return;
      }

      // Если всё ок — авторизуем
      setUser(data); 
    } catch (err) {
      console.error(err); // Выведем реальную ошибку в консоль, чтобы её видеть
      setError('Сервер не отвечает. Убедись, что в терминале бэкенда запущен node server.js');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoContainerStyle}>
          <span style={{ fontSize: '28px' }}>⚡</span>
          <h2 style={logoStyle}>BakaBank</h2>
        </div>
        <p style={subtitleStyle}>Регистрация цифрового профиля</p>

        {error && <div style={errorStyle}>⚠️ {error}</div>}

        <form onSubmit={handleRegister} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Ваше имя и фамилия</label>
            <input 
              type="text" 
              placeholder="Иванов Иван" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              style={inputStyle} 
              required 
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Номер телефона</label>
            <input 
              type="tel" 
              placeholder="0700112233" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              style={inputStyle} 
              required 
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Пароль доступа</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={inputStyle} 
              required 
            />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle(loading)}>
            {loading ? 'Создание аккаунта...' : 'Зарегистрироваться и войти'}
          </button>
        </form>

        <div style={footerStyle}>
          <span style={{ color: '#666d75' }}>Уже есть личный кабинет? </span>
          <span onClick={onSwitchToAuth} style={linkStyle}>Войти</span>
        </div>
      </div>
    </div>
  );
}

const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0b0c0e', fontFamily: 'system-ui, sans-serif', padding: '20px' };
const cardStyle = { background: '#14161a', padding: '40px 30px', borderRadius: '28px', width: '100%', maxWidth: '360px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', border: '1px solid #202329', textAlign: 'center' };
const logoContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' };
const logoStyle = { color: '#11bb77', fontSize: '28px', margin: 0, fontWeight: '800', letterSpacing: '-0.5px' };
const subtitleStyle = { color: '#666d75', fontSize: '14px', margin: '0 0 32px 0', fontWeight: '500' };
const errorStyle = { background: 'rgba(255, 77, 79, 0.1)', border: '1px solid #ff4d4f', color: '#ff4d4f', padding: '12px', borderRadius: '14px', fontSize: '13px', marginBottom: '20px', textAlign: 'left' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '14px' };
const inputGroupStyle = { textAlign: 'left' };
const labelStyle = { color: '#8c8c8c', fontSize: '12px', display: 'block', marginBottom: '6px', paddingLeft: '4px' };
const inputStyle = { width: '91%', padding: '14px 16px', borderRadius: '14px', border: '1px solid #202329', background: '#1c1f26', color: '#fff', fontSize: '16px', outline: 'none' };
const buttonStyle = (loading) => ({ padding: '16px', borderRadius: '16px', border: 'none', background: loading ? '#0c6e47' : '#11bb77', color: '#000', fontWeight: '700', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '14px', boxShadow: '0 4px 12px rgba(17,187,119,0.2)' });
const footerStyle = { marginTop: '28px', borderTop: '1px solid #202329', paddingTop: '20px', fontSize: '14px' };
const linkStyle = { color: '#11bb77', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' };