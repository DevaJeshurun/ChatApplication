// frontend/src/components/GroupSidebar.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import CreateGroupModal from './CreateGroupModal';

const AVATAR_COLORS = ['#f97316','#6366f1','#22c55e','#ef4444','#eab308','#06b6d4','#a855f7','#ec4899'];
function getColor(name) {
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function GroupSidebar({ username, activeRoom, onSelectRoom, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(res.data);
    } catch (e) {}
  };

  useEffect(() => { fetchGroups(); }, []);

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const myGroups = filtered.filter(g => g.members.includes(username));
  const publicGroups = filtered.filter(g => !g.isPrivate && !g.members.includes(username));

  const handleGroupCreated = (group) => {
    setGroups(prev => [group, ...prev]);
    onSelectRoom({ type: 'group', id: group._id, name: group.name, group });
    setShowCreate(false);
  };

  const joinGroup = async (group) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/groups/${group._id}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGroups();
      onSelectRoom({ type: 'group', id: group._id, name: group.name, group });
    } catch (e) {}
  };

  return (
    <>
      <div style={{
        width: 260,
        background: '#0d0d1a',
        borderRight: '1px solid #1e1e30',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
      }}>
        {/* Brand + user */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid #1e1e30',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30,
                background: 'linear-gradient(135deg, #f97316, #fb923c)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>💬</div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' }}>Ripple</span>
            </div>
            <button onClick={onLogout} title="Sign out" style={{
              background: 'none', border: 'none', color: '#3a3a5c',
              cursor: 'pointer', fontSize: 16, padding: 4,
              borderRadius: 6, transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = '#ef4444'}
              onMouseLeave={e => e.target.style.color = '#3a3a5c'}
            >⎋</button>
          </div>

          {/* Current user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: getColor(username),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white',
            }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{username}</span>
            <div style={{
              marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
              background: '#22c55e',
            }} />
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px 8px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms..."
            style={{
              width: '100%', padding: '7px 12px',
              background: '#13131f', border: '1px solid #252538',
              borderRadius: 8, fontSize: 13,
              fontFamily: "'Outfit', sans-serif",
              color: '#e2e8f0', outline: 'none',
            }}
          />
        </div>

        {/* Rooms list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>

          {/* Global */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3a3a5c', letterSpacing: '1px', textTransform: 'uppercase', padding: '6px 8px 4px' }}>
              Global
            </div>
            <RoomItem
              icon="🌐"
              name="Global Chat"
              subtitle="Everyone is here"
              active={activeRoom.type === 'global'}
              onClick={() => onSelectRoom({ type: 'global', id: null, name: 'Global Chat' })}
              color="#f97316"
            />
          </div>

          {/* My Groups */}
          {myGroups.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#3a3a5c', letterSpacing: '1px', textTransform: 'uppercase', padding: '6px 8px 4px' }}>
                My Groups
              </div>
              {myGroups.map(g => (
                <RoomItem
                  key={g._id}
                  icon={g.avatar}
                  name={g.name}
                  subtitle={`${g.isPrivate ? '🔒 Private' : '🌐 Public'} · ${g.members.length} members`}
                  active={activeRoom.id === g._id}
                  onClick={() => onSelectRoom({ type: 'group', id: g._id, name: g.name, group: g })}
                  color={getColor(g.name)}
                />
              ))}
            </div>
          )}

          {/* Public groups to join */}
          {publicGroups.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#3a3a5c', letterSpacing: '1px', textTransform: 'uppercase', padding: '6px 8px 4px' }}>
                Discover
              </div>
              {publicGroups.map(g => (
                <RoomItem
                  key={g._id}
                  icon={g.avatar}
                  name={g.name}
                  subtitle={`${g.members.length} members · Click to join`}
                  active={false}
                  onClick={() => joinGroup(g)}
                  color={getColor(g.name)}
                  dim
                />
              ))}
            </div>
          )}
        </div>

        {/* Create group button */}
        <div style={{ padding: '12px', borderTop: '1px solid #1e1e30' }}>
          <button onClick={() => setShowCreate(true)} style={{
            width: '100%', padding: '10px',
            background: 'rgba(249,115,22,0.1)',
            border: '1px dashed rgba(249,115,22,0.3)',
            borderRadius: 10, color: '#f97316',
            fontSize: 13, fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
            cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.18)'; e.currentTarget.style.borderStyle = 'solid'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.1)'; e.currentTarget.style.borderStyle = 'dashed'; }}
          >
            + Create Group
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateGroupModal
          username={username}
          onClose={() => setShowCreate(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </>
  );
}

function RoomItem({ icon, name, subtitle, active, onClick, color, dim }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px', borderRadius: 10,
      cursor: 'pointer',
      background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
      border: active ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent',
      marginBottom: 2,
      opacity: dim ? 0.6 : 1,
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${color}20`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: active ? '#f97316' : '#e2e8f0',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        <div style={{
          fontSize: 11, color: '#3a3a5c',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{subtitle}</div>
      </div>
    </div>
  );
}

export default GroupSidebar;