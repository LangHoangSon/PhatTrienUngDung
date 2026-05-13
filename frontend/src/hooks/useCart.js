import { useState, useCallback } from 'react'

export default function useCart() {
  const [cart, setCart] = useState([])

  const addItem = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((id) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === id)
      if (existing?.quantity === 1) return prev.filter(c => c.id !== id)
      return prev.map(c => c.id === id ? { ...c, quantity: c.quantity - 1 } : c)
    })
  }, [])

  const updateItemNote = useCallback((id, note) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, note } : c))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0)
  const totalPrice = cart.reduce((s, c) => s + c.price * c.quantity, 0)

  return { cart, addItem, removeItem, updateItemNote, clearCart, totalItems, totalPrice }
}