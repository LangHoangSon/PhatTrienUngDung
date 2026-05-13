import { useState, useEffect, useRef } from 'react';

export default function StaffChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('calls'); // 'calls' or 'chats'
  const [calls, setCalls] = useState([]);
  const [chats, setChats] = useState([]); // list of unique tables that have chats
  const [selectedTable, setSelectedTable] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const messagesEndRef = useRef(null);

  const fetchCalls = async () => {
    try {
      const res = await fetch('/api/staff-calls');
      if (res.ok) setCalls(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        // Group by table
        const grouped = {};
        data.forEach(m => {
          if (!grouped[m.table_id]) grouped[m.table_id] = { table_id: m.table_id, table_number: m.table_number, lastMessage: m.message, created_at: m.created_at, sender: m.sender };
          else if (new Date(m.created_at) > new Date(grouped[m.table_id].created_at)) {
            grouped[m.table_id].lastMessage = m.message;
            grouped[m.table_id].created_at = m.created_at;
            grouped[m.table_id].sender = m.sender;
          }
        });
        setChats(Object.values(grouped).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async (tableId) => {
    try {
      const res = await fetch(`/api/chat/${tableId}`);
      if (res.ok) setMessages(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchCalls();
    fetchChats();
    const interval = setInterval(() => {
      fetchCalls();
      fetchChats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Âm thanh thông báo
  const [notificationSound] = useState(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const prevCallCount = useRef(0);
  const prevLatestChatTime = useRef(null);

  useEffect(() => {
    let shouldPlay = false;

    // Check new calls
    if (calls.length > prevCallCount.current) {
      shouldPlay = true;
    }
    prevCallCount.current = calls.length;

    // Check new messages from customer
    const currentLatest = chats.length > 0 ? chats[0] : null;
    if (currentLatest && prevLatestChatTime.current) {
      if (new Date(currentLatest.created_at) > new Date(prevLatestChatTime.current) && currentLatest.sender !== 'staff') {
        shouldPlay = true;
      }
    }
    if (currentLatest) {
      prevLatestChatTime.current = currentLatest.created_at;
    }

    if (shouldPlay) {
      notificationSound.play().catch(e => console.log('Audio autoplay blocked or failed:', e));
    }
  }, [calls, chats, notificationSound]);

  useEffect(() => {
    if (selectedTable) {
      fetchMessages(selectedTable);
      const interval = setInterval(() => fetchMessages(selectedTable), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTable]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resolveCall = async (id) => {
    try {
      await fetch(`/api/staff-calls/${id}`, { method: 'PATCH' });
      fetchCalls();
    } catch (e) { console.error(e); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedTable) return;
    const msg = inputMsg;
    setInputMsg('');
    setMessages(prev => [...prev, { sender: 'staff', message: msg, created_at: new Date().toISOString(), id: Date.now() }]);
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: selectedTable, sender: 'staff', message: msg })
      });
      fetchMessages(selectedTable);
      fetchChats();
      fetchCalls(); // because sending a message auto-resolves calls
    } catch (e) { console.error(e); }
  };

  const unreadChatsCount = chats.filter(c => c.sender === 'customer').length;
  const totalNotifications = calls.length + unreadChatsCount;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: 30,
          background: totalNotifications > 0 ? 'var(--amber)' : 'linear-gradient(135deg, #3D2B1F, #5C3D28)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(61,43,31,0.4)',
          fontSize: 28,
          cursor: 'pointer',
          zIndex: 100,
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: totalNotifications > 0 ? 'pulse 2s infinite' : 'none'
        }}
      >
        {calls.length > 0 ? '🔔' : '💬'}
        {totalNotifications > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {totalNotifications}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 'min(400px, calc(100vw - 48px))',
          height: 600,
          maxHeight: 'calc(100vh - 48px)',
          background: '#FFFAF3',
          borderRadius: 24,
          boxShadow: '0 12px 40px rgba(61,43,31,0.3)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2)'
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #3D2B1F, #5C3D28)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontFamily: "'Playfair Display', serif" }}>
              {selectedTable ? `Trò chuyện với Bàn ${chats.find(c => c.table_id === selectedTable)?.table_number || selectedTable}` : 'Trung tâm Hỗ trợ'}
            </h3>
            <div style={{ display: 'flex', gap: 10 }}>
              {selectedTable && (
                <button onClick={() => setSelectedTable(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 12, padding: '4px 8px', borderRadius: 12, cursor: 'pointer' }}>
                  ← Quay lại
                </button>
              )}
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
          </div>

          {!selectedTable ? (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(122,92,74,0.1)' }}>
                <button 
                  onClick={() => setActiveTab('calls')}
                  style={{ flex: 1, padding: 12, border: 'none', background: activeTab === 'calls' ? '#fff' : 'transparent', fontWeight: activeTab === 'calls' ? 800 : 600, color: activeTab === 'calls' ? 'var(--amber-dark)' : 'var(--text-secondary)', borderBottom: activeTab === 'calls' ? '2px solid var(--amber)' : 'none', cursor: 'pointer' }}
                >
                  Yêu cầu gọi ({calls.length})
                </button>
                <button 
                  onClick={() => setActiveTab('chats')}
                  style={{ flex: 1, padding: 12, border: 'none', background: activeTab === 'chats' ? '#fff' : 'transparent', fontWeight: activeTab === 'chats' ? 800 : 600, color: activeTab === 'chats' ? 'var(--amber-dark)' : 'var(--text-secondary)', borderBottom: activeTab === 'chats' ? '2px solid var(--amber)' : 'none', cursor: 'pointer' }}
                >
                  Tin nhắn ({chats.length})
                </button>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {activeTab === 'calls' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {calls.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 20 }}>Không có yêu cầu gọi nào.</div>
                    ) : (
                      calls.map(c => (
                        <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(122,92,74,0.08)', border: '1px solid rgba(232,130,26,0.3)' }}>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Bàn {c.table_number} gọi nhân viên</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleTimeString('vi-VN')}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setSelectedTable(c.table_id)} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(232,130,26,0.1)', color: 'var(--amber-dark)', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Chat</button>
                            <button onClick={() => resolveCall(c.id)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--amber)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Xong</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'chats' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {chats.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 20 }}>Chưa có cuộc trò chuyện nào.</div>
                    ) : (
                      chats.map(c => {
                        const isUnread = c.sender === 'customer';
                        return (
                          <div key={c.table_id} onClick={() => setSelectedTable(c.table_id)} style={{ background: isUnread ? 'rgba(232,130,26,0.1)' : '#fff', borderRadius: 12, padding: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(122,92,74,0.08)', border: isUnread ? '1px solid rgba(232,130,26,0.4)' : '1px solid rgba(122,92,74,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                Bàn {c.table_number} {isUnread && <span style={{ width: 8, height: 8, background: 'red', borderRadius: '50%', display: 'inline-block', marginLeft: 4 }} />}
                              </div>
                              <div style={{ fontSize: 12, color: isUnread ? 'var(--amber-dark)' : 'var(--text-muted)', fontWeight: isUnread ? 700 : 400 }}>{new Date(c.created_at).toLocaleTimeString('vi-VN')}</div>
                            </div>
                            <div style={{ fontSize: 13, color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isUnread ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.lastMessage}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Chat View */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Bắt đầu trò chuyện...</div>}
                {messages.map(m => (
                  <div key={m.id} style={{
                    alignSelf: m.sender === 'staff' ? 'flex-end' : 'flex-start',
                    background: m.sender === 'staff' ? 'var(--amber)' : '#fff',
                    color: m.sender === 'staff' ? '#fff' : 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: m.sender === 'staff' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    maxWidth: '80%',
                    boxShadow: '0 2px 8px rgba(122,92,74,0.08)',
                    fontSize: 14,
                    lineHeight: 1.4
                  }}>
                    {m.message}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid rgba(122,92,74,0.1)', display: 'flex', gap: 10, background: '#fff' }}>
                <input
                  type="text"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: '1px solid rgba(122,92,74,0.2)', outline: 'none', fontSize: 14 }}
                />
                <button 
                  type="submit"
                  disabled={!inputMsg.trim()}
                  style={{ width: 40, height: 40, borderRadius: 20, background: inputMsg.trim() ? 'var(--amber)' : '#ccc', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputMsg.trim() ? 'pointer' : 'not-allowed' }}
                >
                  ➤
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
