// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import MainLayout from './components/MainLayout';

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) setUser(username);
  }, []);

  if (user) {
    return <MainLayout username={user} onLogout={() => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setUser(null);
    }} />;
  }

  if (page === 'register') {
    return <Register onSwitchToLogin={() => setPage('login')} />;
  }

  return (
    <Login
      onLoginSuccess={(u) => setUser(u)}
      onSwitchToRegister={() => setPage('register')}
    />
  );
}

export default App;