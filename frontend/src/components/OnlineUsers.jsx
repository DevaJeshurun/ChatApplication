// frontend/src/components/OnlineUsers.jsx

import PropTypes from 'prop-types';

const AVATAR_COLORS = [
  '#f97316','#6366f1','#22c55e','#ef4444',
  '#eab308','#06b6d4','#a855f7','#ec4899',
];

function getColor(name) {
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 32, style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif",
      fontSize: size * 0.4, fontWeight: 600, color: 'white',
      flexShrink: 0, ...style
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

Avatar.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.number,
  style: PropTypes.object,
};

function OnlineUsers({ users, currentUser }) {
  const others = users.filter(u => u !== currentUser);
  const sorted = currentUser && users.includes(currentUser)
    ? [currentUser, ...others]
    : users;

  return (
    <div style={{
      background: '#13131f',
      border: '1px solid #252538',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #252538',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Online
        </div>
        <div style={{
          background: '#22c55e',
          color: 'white',
          fontSize: 11,
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 20,
          lineHeight: '16px',
        }}>
          {users.length}
        </div>
      </div>

      <div style={{ maxHeight: 280, overflowY: 'auto', padding: '8px 0' }}>
        {sorted.length === 0 ? (
          <div style={{
            padding: '20px', textAlign: 'center',
            fontSize: 13, color: '#3a3a5c',
            fontFamily: "'Outfit', sans-serif"
          }}>
            No one online yet
          </div>
        ) : (
          sorted.map((user) => (
            <div key={user} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 20px',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ position: 'relative' }}>
                <Avatar name={user} size={34} />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 10, height: 10,
                  background: '#22c55e',
                  border: '2px solid #13131f',
                  borderRadius: '50%',
                }} />
              </div>
              <div>
                <div style={{
                  fontSize: 14, fontWeight: 500,
                  color: user === currentUser ? '#f97316' : '#e2e8f0',
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {user}{user === currentUser ? ' (you)' : ''}
                </div>
                <div style={{ fontSize: 11, color: '#22c55e', fontFamily: "'Outfit', sans-serif" }}>
                  Active now
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { Avatar, getColor };
export default OnlineUsers;