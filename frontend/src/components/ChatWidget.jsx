import { useState, useEffect, useRef } from 'react';

export default function ChatWidget({ tableId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [calling, setCalling] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${tableId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to fetch chat', e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, tableId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const msg = inputMsg;
    setInputMsg('');
    
    // Optimistic UI
    setMessages(prev => [...prev, { sender: 'customer', message: msg, created_at: new Date().toISOString(), id: Date.now() }]);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: parseInt(tableId), sender: 'customer', message: msg })
      });
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCallStaff = async () => {
    if (calling) return;
    setCalling(true);
    try {
      const res = await fetch('/api/call-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: parseInt(tableId) })
      });
      if (res.ok) {
        alert('Đã gọi nhân viên. Vui lòng đợi trong giây lát!');
      } else {
        alert('Lỗi gọi nhân viên. Vui lòng thử lại.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    } finally {
      setCalling(false);
    }
  };

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
          background: 'linear-gradient(135deg, var(--amber), var(--amber-light))',
          color: '#fff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(232,130,26,0.4)',
          fontSize: 28,
          cursor: 'pointer',
          zIndex: 100,
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        💬
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 'min(360px, calc(100vw - 48px))',
          height: 500,
          maxHeight: 'calc(100vh - 150px)',
          background: '#FFFAF3',
          borderRadius: 24,
          boxShadow: '0 12px 40px rgba(61,43,31,0.2)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2)'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #3D2B1F, #5C3D28)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff'
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontFamily: "'Playfair Display', serif" }}>Hỗ trợ khách hàng</h3>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Call Staff Button inside Chat */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(122,92,74,0.1)' }}>
            <button
              onClick={handleCallStaff}
              disabled={calling}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                background: 'rgba(232,130,26,0.1)',
                border: '1px solid rgba(232,130,26,0.3)',
                color: 'var(--amber-dark)',
                fontWeight: 700,
                fontSize: 15,
                cursor: calling ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {calling ? '⏳ Đang gọi...' : '🔔 Gọi nhân viên đến bàn'}
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              Chào mừng đến bàn {tableId}. Bạn cần hỗ trợ gì ạ?
            </div>
            {messages.map(m => (
              <div key={m.id} style={{
                alignSelf: m.sender === 'customer' ? 'flex-end' : 'flex-start',
                background: m.sender === 'customer' ? 'var(--amber)' : '#fff',
                color: m.sender === 'customer' ? '#fff' : 'var(--text-primary)',
                padding: '10px 14px',
                borderRadius: m.sender === 'customer' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
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
          <form onSubmit={handleSend} style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(122,92,74,0.1)',
            display: 'flex',
            gap: 10,
            background: '#fff'
          }}>
            <input
              type="text"
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              placeholder="Nhập tin nhắn..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 20,
                border: '1px solid rgba(122,92,74,0.2)',
                outline: 'none',
                fontSize: 14
              }}
            />
            <button 
              type="submit"
              disabled={!inputMsg.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: inputMsg.trim() ? 'var(--amber)' : '#ccc',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputMsg.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
