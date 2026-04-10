import MenuCard from './MenuCard.jsx'

export default function MenuGrid({ items = [], cart = [], onAdd, onRemove }) {
  // 1. Kiểm tra nếu items không phải là mảng hoặc bị rỗng
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
        <p style={{ fontSize: 16 }}>
          {!items ? "Đang tải hoặc có lỗi xảy ra..." : "Chưa có món ăn nào"}
        </p>
      </div>
    )
  }

  return (
    <div>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '24px 0 16px' }}>
        {items.length} món • Chọn món bạn muốn
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {items.map((item, i) => {
          // 2. Dùng Optional Chaining để tránh lỗi nếu cart bị undefined
          const inCart = cart?.find(c => c.id === item.id)
          
          return (
            <div key={item.id} className="animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
              <MenuCard 
                item={item} 
                quantity={inCart?.quantity || 0} 
                onAdd={() => onAdd(item)} 
                onRemove={() => onRemove(item.id)} 
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}