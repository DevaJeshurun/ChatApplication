// frontend/src/components/CreateGroupModal.jsx
import { useState } from 'react';
import axios from 'axios';

const GROUP_EMOJIS = ['💬','🚀','🎮','🎵','📚','🏀','🎨','💡','🔥','⚡','🌍','🍕','💼','🎯','🤝','✨'];

function CreateGroupModal({ username, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatar, setAvatar] = useState('💬');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMember = () => {
    const val = memberInput.trim();
    if (!val || val === username || members.includes(val)) return;
    setMembers(prev => [...prev, val]);
    setMemberInput('');
  };

  const removeMember = (m) => setMembers(prev => prev.filter(x => x !== m));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Group name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/groups', {
        name, description, isPrivate, members, avatar
      }, { headers: { Authorization: `Bearer ${token}` } });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#13131f',
        border: '1px solid #252538',
        borderRadius: 20,
        width: '100%',
        maxWidth: 480,
        padding: '32px 32px 28px',
        animation: 'modalIn 0.25s ease',
      }}>
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
            Create Group
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#64748b',
            fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 2,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = '#f1f5f9'}
            onMouseLeave={e => e.target.style.color = '#64748b'}
          >×</button>
        </div>

        <form onSubmit={handleCreate}>
          {/* Avatar picker */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Group Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GROUP_EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setAvatar(e)} style={{
                  width: 38, height: 38, fontSize: 20,
                  background: avatar === e ? 'rgba(249,115,22,0.15)' : '#0c0c14',
                  border: avatar === e ? '2px solid #f97316' : '1px solid #252538',
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                }}>{e}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Group Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Design Team, Study Group..."
              required
              maxLength={40}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Description <span style={{ color: '#3a3a5c' }}>(optional)</span></label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this group about?"
              maxLength={120}
              style={inputStyle}
            />
          </div>

          {/* Privacy toggle */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Privacy</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { val: false, label: '🌐 Public', sub: 'Anyone can join' },
                { val: true, label: '🔒 Private', sub: 'Invite only' },
              ].map(opt => (
                <div key={String(opt.val)} onClick={() => setIsPrivate(opt.val)} style={{
                  flex: 1, padding: '10px 14px',
                  background: isPrivate === opt.val ? 'rgba(249,115,22,0.1)' : '#0c0c14',
                  border: isPrivate === opt.val ? '1px solid #f97316' : '1px solid #252538',
                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isPrivate === opt.val ? '#f97316' : '#e2e8f0' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{opt.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Members */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              Invite Members <span style={{ color: '#3a3a5c' }}>(by username)</span>
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={memberInput}
                onChange={e => setMemberInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }}
                placeholder="Enter username..."
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button type="button" onClick={addMember} style={{
                padding: '10px 14px',
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: 10, color: '#f97316',
                fontSize: 13, fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}>Add</button>
            </div>

            {/* Member chips */}
            {members.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {members.map(m => (
                  <div key={m} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: '#1a1a2e',
                    border: '1px solid #252538',
                    borderRadius: 20,
                    padding: '4px 10px 4px 8px',
                    fontSize: 12, color: '#e2e8f0',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#6366f1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: 'white',
                    }}>{m.charAt(0).toUpperCase()}</div>
                    {m}
                    <button type="button" onClick={() => removeMember(m)} style={{
                      background: 'none', border: 'none', color: '#64748b',
                      cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1,
                      transition: 'color 0.15s',
                    }}
                      onMouseEnter={e => e.target.style.color = '#ef4444'}
                      onMouseLeave={e => e.target.style.color = '#64748b'}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 16,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, fontSize: 13, color: '#f87171',
            }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px',
              background: 'transparent', border: '1px solid #252538',
              borderRadius: 10, color: '#94a3b8',
              fontSize: 14, fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              cursor: 'pointer', transition: 'border-color 0.2s',
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '12px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              border: 'none', borderRadius: 10, color: 'white',
              fontSize: 14, fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}>
              {loading ? 'Creating...' : `Create ${avatar} ${name || 'Group'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#94a3b8', marginBottom: 7, letterSpacing: '0.3px',
};

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: '#0c0c14', border: '1px solid #252538',
  borderRadius: 10, fontSize: 14,
  fontFamily: "'Outfit', sans-serif",
  color: '#f1f5f9', outline: 'none',
  transition: 'border-color 0.2s',
  marginBottom: 0,
};

export default CreateGroupModal;