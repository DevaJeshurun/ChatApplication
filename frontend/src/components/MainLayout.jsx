// frontend/src/components/MainLayout.jsx
import { useState } from 'react';
import GroupSidebar from './GroupSidebar';
import ChatRoom from './ChatRoom';

// Inject shared CSS once
const LAYOUT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Outfit', sans-serif; background: #0c0c14; color: #e2e8f0; overflow: hidden; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #252538; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #3a3a5c; }
`;

let cssInjected = false;

function MainLayout({ username, onLogout }) {
  const [activeRoom, setActiveRoom] = useState({ type: 'global', id: null, name: 'Global' });

  if (!cssInjected) {
    const el = document.createElement('style');
    el.textContent = LAYOUT_CSS;
    document.head.appendChild(el);
    cssInjected = true;
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#0c0c14',
    }}>
      {/* Left sidebar — rooms list */}
      <GroupSidebar
        username={username}
        activeRoom={activeRoom}
        onSelectRoom={setActiveRoom}
        onLogout={onLogout}
      />

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ChatRoom
          key={`${activeRoom.type}-${activeRoom.id}`}
          username={username}
          room={activeRoom}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}

export default MainLayout;