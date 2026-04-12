import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import useCart from '../hooks/useCart.js'
import MenuHeader from '../components/MenuHeader.jsx'
import MenuGrid from '../components/MenuGrid.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import CartBar from '../components/CartBar.jsx'
import SuccessModal from '../components/SuccessModal.jsx'

export default function MenuPage() {
  const [searchParams] = useSearchParams()
  const tableId = searchParams.get('table') || '1'
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { cart, addItem, removeItem, clearCart, totalItems, totalPrice } = useCart()

  const loadMenu = () => {
    fetch('/api/menu')
      .then(r => r.json())
      .then(data => {
        setMenuItems(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadMenu()
    const t = setInterval(loadMenu, 10000)
    return () => clearInterval(t)
  }, [])

  const handleOrder = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: parseInt(tableId),
          items: cart.map(c => ({ menu_id: c.id, quantity: c.quantity }))
        })
      })
      if (res.ok) {
        clearCart()
        setCartOpen(false)
        setShowSuccess(true)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || 'Không thể đặt món. Có thể món đã hết — vui lòng kiểm tra lại giỏ.')
      }
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <MenuHeader tableId={tableId} />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 120px' }}>
        {loading ? <LoadingSpinner /> : <MenuGrid items={menuItems} cart={cart} onAdd={addItem} onRemove={removeItem} />}
      </main>
      {totalItems > 0 && <CartBar totalItems={totalItems} totalPrice={totalPrice} onClick={() => setCartOpen(true)} />}
      {cartOpen && <CartDrawer cart={cart} totalPrice={totalPrice} onAdd={addItem} onRemove={removeItem} onClose={() => setCartOpen(false)} onOrder={handleOrder} submitting={submitting} />}
      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} tableId={tableId} />}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '3px solid var(--amber-pale)', borderTop: '3px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Đang tải menu...</p>
    </div>
  )
}