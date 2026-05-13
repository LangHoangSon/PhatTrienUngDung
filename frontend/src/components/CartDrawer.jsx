export default function CartDrawer({ cart, totalPrice, onAdd, onRemove, onUpdateNote, onClose, onOrder, submitting }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(45,25,10,0.55)', backdropFilter: 'blur(3px)', zIndex: 200, animation: 'fadeIn 0.25s ease' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#FFFAF3', borderRadius: '24px 24px 0 0', zIndex: 201, maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 -8px 40px rgba(61,43,31,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--text-muted)', opacity: 0.3 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px', borderBottom: '1px solid rgba(122,92,74,0.12)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>🛒 Giỏ hàng</h2>
          <button onClick={onClose} style={{ background: 'rgba(122,92,74,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)' }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px' }}>
          {cart.map((item, i) => (
            <div key={item.id} className="animate-fadeUp" style={{ animationDelay: `${i * 40}ms`, display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(122,92,74,0.08)', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #FDF3E3, #FDEAC8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🍜</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                <p style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 14 }}>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                <input 
                  type="text" 
                  value={item.note || ''} 
                  onChange={(e) => onUpdateNote(item.id, e.target.value)} 
                  placeholder="Ghi chú (vd: ít cay, không hành...)" 
                  style={{ marginTop: 8, width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(122,92,74,0.2)', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--amber-pale)', borderRadius: 10, padding: '4px 8px' }}>
                <button onClick={() => onRemove(item.id)} style={smallBtn}>−</button>
                <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center', color: 'var(--warm-brown)' }}>{item.quantity}</span>
                <button onClick={() => onAdd(item)} style={smallBtn}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 20px 32px', borderTop: '1px solid rgba(122,92,74,0.12)', background: '#FFFAF3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>Tổng cộng</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--amber-dark)', fontFamily: "'Playfair Display', serif" }}>{totalPrice.toLocaleString('vi-VN')}₫</span>
          </div>
          <button onClick={onOrder} disabled={submitting} style={{ width: '100%', padding: '16px', background: submitting ? 'rgba(232,130,26,0.5)' : 'linear-gradient(135deg, var(--amber), var(--amber-light))', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: submitting ? 'none' : '0 6px 20px rgba(232,130,26,0.35)' }}>
            {submitting ? <><div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Đang gửi đơn...</> : <>🍽️ Đặt món ngay</>}
          </button>
        </div>
      </div>
    </>
  )
}

const smallBtn = { width: 28, height: 28, background: '#fff', border: '1.5px solid var(--amber)', borderRadius: 7, color: 'var(--amber-dark)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }