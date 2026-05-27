import React, { useState } from 'react';
import { useTradingStore } from '../store/useTradingStore';

export default function Profile() {
  const { user, setUser, logout } = useTradingStore();
  const [newPhone, setNewPhone] = useState(user?.phoneNumber || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!newPhone.trim()) {
      setError('Номер телефона не может быть пустым');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/user/update-phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newPhoneNumber: newPhone.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при обновлении номера');
        setLoading(false);
        return;
      }

      // Обновляем глобальное состояние юзера в Zustand
      setUser(data.user);
      setSuccess('Номер телефона успешно изменен!');
      setIsEditing(false);
    } catch (err) {
      setError('Ошибка связи с сервером.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>Загрузка профиля...</div>;

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Мой профиль</h2>
      <p style={subtitleStyle}>Управление личными данными цифрового банкинга</p>

      {error && <div style={errorStyle}>⚠️ {error}</div>}
      {success && <div style={successStyle}>✅ {success}</div>}

      {/* Карточка с личными данными */}
      <div style={profileCardStyle}>
        <div style={avatarBlockStyle}>
          <div style={avatarStyle}>{user.fullName ? user.fullName[0].toUpperCase() : 'U'}</div>
          <h3 style={{ margin: '10px 0 4px 0', fontSize: '18px', fontWeight: '700' }}>{user.fullName}</h3>
          <span style={{ color: '#11bb77', fontSize: '12px', fontWeight: '600' }}>Клиент BakaBank</span>
        </div>

        <div style={infoDividerStyle} />

        {/* Данные пользователя */}
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Номер карты (Элкарт)</span>
          <span style={infoValueStyle}>{user.cardNumber || 'Не указан'}</span>
        </div>

        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>ID Пользователя</span>
          <span style={infoValueStyle}># {user.id}</span>
        </div>

        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Номер телефона</span>
          {!isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={infoValueStyle}>{user.phoneNumber}</span>
              <button onClick={() => setIsEditing(true)} style={editInlineButtonStyle}>✏️</button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePhone} style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '6px' }}>
              <input 
                type="tel" 
                value={newPhone} 
                onChange={e => setNewPhone(e.target.value)} 
                style={inlineInputStyle} 
                disabled={loading}
                required
              />
              <button type="submit" disabled={loading} style={saveButtonStyle}>
                {loading ? '...' : 'Ок'}
              </button>
              <button type="button" onClick={() => { setIsEditing(false); setNewPhone(user.phoneNumber); }} style={cancelButtonStyle} disabled={loading}>
                Х
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Кнопка выхода для удобства */}
      <button onClick={() => logout()} style={logoutActionButtonStyle}>
        Выйти из аккаунта
      </button>
    </div>
  );
}

// Стили интерфейса профиля
const containerStyle = { width: '100%', maxWidth: '440px', margin: '0 auto', padding: '10px 4px' };
const titleStyle = { fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '-0.5px' };
const subtitleStyle = { color: '#666d75', fontSize: '13px', margin: '0 0 24px 0', lineHeight: '1.4' };
const profileCardStyle = { background: '#14161a', padding: '24px', borderRadius: '24px', border: '1px solid #202329', display: 'flex', flexDirection: 'column' };
const avatarBlockStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' };
const avatarStyle = { width: '64px', height: '64px', borderRadius: '50%', background: '#1c1f26', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '700', fontSize: '24px', color: '#11bb77', border: '2px solid #202329' };
const infoDividerStyle = { height: '1px', background: '#202329', margin: '8px 0 16px 0' };
const infoRowStyle = { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px', textAlign: 'left' };
const infoLabelStyle = { color: '#8c8c8c', fontSize: '12px' };
const infoValueStyle = { fontSize: '15px', fontWeight: '600', color: '#fff' };
const editInlineButtonStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 };

const inlineInputStyle = { flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #11bb77', background: '#1c1f26', color: '#fff', fontSize: '14px', outline: 'none' };
const saveButtonStyle = { background: '#11bb77', border: 'none', color: '#000', borderRadius: '10px', padding: '0 12px', fontWeight: '700', cursor: 'pointer' };
const cancelButtonStyle = { background: '#202329', border: 'none', color: '#ff4d4f', borderRadius: '10px', padding: '0 12px', fontWeight: '700', cursor: 'pointer' };

const errorStyle = { background: 'rgba(255, 77, 79, 0.1)', border: '1px solid #ff4d4f', color: '#ff4d4f', padding: '12px', borderRadius: '14px', fontSize: '13px', marginBottom: '16px' };
const successStyle = { background: 'rgba(17, 187, 119, 0.1)', border: '1px solid #11bb77', color: '#11bb77', padding: '12px', borderRadius: '14px', fontSize: '13px', marginBottom: '16px' };
const logoutActionButtonStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #ff4d4f', background: 'none', color: '#ff4d4f', fontWeight: '600', fontSize: '15px', cursor: 'pointer', marginTop: '20px', transition: '0.2s' };