import { useState } from 'react'

function isItemAvailable(item) {
  return item.is_available === true || item.is_available === 1
}

export default function MenuCard({ item, quantity, onAdd, onRemove }) {
  const [pressed, setPressed] = useState(false)
  const hasItem = quantity > 0
  const available = isItemAvailable(item)

  const handleAdd = () => {
    if (!available) return
    setPressed(true)
    onAdd()
    setTimeout(() => setPressed(false), 200)
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius)', boxShadow: hasItem && available ? '0 4px 20px rgba(232,130,26,0.2), 0 0 0 2px var(--amber)' : 'var(--shadow-card)', transition: 'box-shadow 0.25s ease, transform 0.15s ease', overflow: 'hidden', transform: pressed ? 'scale(0.98)' : 'scale(1)', opacity: available ? 1 : 0.92 }}>
      <div style={{ background: hasItem && available ? 'linear-gradient(135deg, #FDF3E3, #FDEAC8)' : 'linear-gradient(135deg, #FDFAF6, #F5EFE6)', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, position: 'relative', transition: 'background 0.3s ease' }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: available ? 'none' : 'grayscale(0.85) brightness(0.72)',
              transform: available ? 'none' : 'scale(1.02)'
            }}
          />
        ) : (
          <span style={{ filter: available ? 'none' : 'grayscale(1)', opacity: available ? 1 : 0.45 }}>🍜</span>
        )}
        {!available && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(to bottom, rgba(44,26,14,0.35), rgba(44,26,14,0.55))',
              backdropFilter: 'blur(1px)'
            }}
          >
            <span
              style={{
                background: 'rgba(61,43,31,0.92)',
                color: '#FFFAF3',
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: '0.06em',
                padding: '10px 18px',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            >
              Hết món
            </span>
          </div>
        )}
        {hasItem && available && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--amber)', color: '#fff', borderRadius: 100, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, animation: 'scaleIn 0.2s ease' }}>
            {quantity}
          </div>
        )}
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{item.name}</h3>
        <p style={{ fontSize: 18, fontWeight: 700, color: available ? 'var(--amber)' : 'var(--text-muted)', marginBottom: 14 }}>{item.price?.toLocaleString('vi-VN')}₫</p>
        {!available ? (
          <button disabled style={{ width: '100%', padding: '10px 0', background: 'rgba(122,92,74,0.15)', color: 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, cursor: 'not-allowed' }}>
            Tạm ngưng phục vụ
          </button>
        ) : quantity === 0 ? (
          <button onClick={handleAdd} style={{ width: '100%', padding: '10px 0', background: 'linear-gradient(135deg, var(--amber), var(--amber-light))', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>+</span> Thêm vào giỏ
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--amber-pale)', borderRadius: 'var(--radius-sm)', padding: '4px 6px' }}>
            <button onClick={onRemove} style={btnStyle('#fff', 'var(--amber)')}>−</button>
            <span style={{ fontWeight: 700, color: 'var(--amber-dark)', fontSize: 16 }}>{quantity}</span>
            <button onClick={handleAdd} style={btnStyle('var(--amber)', '#fff')}>+</button>
          </div>
        )}
      </div>
    </div>
  )
}

function btnStyle(bg, color) {
  return { width: 34, height: 34, borderRadius: 8, background: bg, color: color, border: '2px solid var(--amber)', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }
}
