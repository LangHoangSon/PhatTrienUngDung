import { useEffect, useMemo, useState } from 'react'

const STATUS_SEQUENCE = ['pending', 'preparing', 'done', 'paid']
const STATUS_LABEL = {
  pending: 'Chờ xử lý',
  preparing: 'Đang chuẩn bị',
  done: 'Sẵn sàng phục vụ',
  paid: 'Đã thanh toán'
}

function formatMoney(n) {
  const num = Number(n || 0)
  return `${num.toLocaleString('vi-VN')}₫`
}

export default function StaffPage() {
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])

  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderItems, setOrderItems] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const ordersById = useMemo(() => new Map(orders.map(o => [o.id, o])), [orders])
  const selectedOrder = selectedOrderId ? ordersById.get(selectedOrderId) : null

  const fetchTablesAndOrders = async () => {
    const [tRes, oRes] = await Promise.all([fetch('/api/tables'), fetch('/api/orders')])
    const tJson = await tRes.json()
    const oJson = await oRes.json()
    setTables(Array.isArray(tJson) ? tJson : [])
    setOrders(Array.isArray(oJson) ? oJson : [])
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        await fetchTablesAndOrders()
      } catch (e) {
        console.error('StaffPage load failed:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const timer = setInterval(load, 5000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!selectedOrderId) return
    // /api/tables đã lọc orders.status != 'paid' qua JOIN,
    // nên nếu không còn trong danh sách => coi như đã kết thúc.
    const stillActive = tables.some(t => Number(t.order_id) === Number(selectedOrderId))
    if (!stillActive) {
      setSelectedOrderId(null)
      setOrderItems([])
    }
  }, [tables, selectedOrderId])

  useEffect(() => {
    if (!selectedOrderId) {
      setOrderItems([])
      return
    }

    let cancelled = false
    const loadItems = async () => {
      try {
        setLoadingItems(true)
        const res = await fetch(`/api/orders/${selectedOrderId}/items`)
        const json = await res.json()
        if (!cancelled) setOrderItems(Array.isArray(json) ? json : [])
      } catch (e) {
        console.error('Failed to load order items:', e)
        if (!cancelled) setOrderItems([])
      } finally {
        if (!cancelled) setLoadingItems(false)
      }
    }

    loadItems()
    return () => {
      cancelled = true
    }
  }, [selectedOrderId])

  const currentStatus = selectedOrder?.status || 'pending'
  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus)

  const canSetStatus = (status) => STATUS_SEQUENCE.indexOf(status) >= currentIndex

  const updateStatus = async (status) => {
    if (!selectedOrderId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${selectedOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      // Refresh dữ liệu để UI đồng bộ trạng thái.
      await fetchTablesAndOrders()
    } catch (e) {
      console.error('Update status failed:', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #3D2B1F 0%, #5C3D28 60%, #7A4E35 100%)',
          padding: '22px 16px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ fontSize: 34, marginBottom: 6 }}>🧑‍🍳</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#FFFAF3', marginBottom: 6 }}>
          Dashboard Nhân viên
        </h1>
        <p style={{ color: '#FFFAF3', opacity: 0.9, fontSize: 13, fontWeight: 600 }}>
          Theo dõi bàn có đơn và cập nhật trạng thái: pending → preparing → done → paid
        </p>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 16px 120px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '380px 1fr',
            gap: 16,
            alignItems: 'start'
          }}
        >
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                Danh sách bàn
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
                {loading ? 'Đang tải...' : `${tables.length} bàn`}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? (
                <div style={{ padding: 18, borderRadius: 'var(--radius)', background: 'rgba(122,92,74,0.06)' }}>
                  Đang tải...
                </div>
              ) : tables.filter(t => t.order_id).length === 0 ? (
                <div style={{ padding: 18, borderRadius: 'var(--radius)', background: 'rgba(122,92,74,0.06)' }}>
                  Chưa có bàn nào có đơn chưa `paid`.
                </div>
              ) : (
                tables
                  .filter(t => t.order_id)
                  .map((t, i) => {
                    const orderId = Number(t.order_id)
                    const active = Number(selectedOrderId) === orderId
                    const st = t.status || (ordersById.get(orderId)?.status ?? 'pending')
                    const stIndex = STATUS_SEQUENCE.indexOf(st)

                    return (
                      <button
                        key={t.id ?? i}
                        onClick={() => setSelectedOrderId(orderId)}
                        disabled={submitting}
                        style={{
                          textAlign: 'left',
                          borderRadius: 'var(--radius)',
                          border: active ? '2px solid var(--amber)' : '1px solid rgba(122,92,74,0.12)',
                          background: active ? 'rgba(232,130,26,0.08)' : '#fff',
                          boxShadow: active ? 'var(--shadow-warm)' : 'var(--shadow-card)',
                          padding: 14,
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>
                              🪑 Bàn {t.table_number}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                              Order #{orderId}
                            </div>
                          </div>
                          <div
                            style={{
                              minWidth: 120,
                              textAlign: 'right',
                              padding: '6px 10px',
                              borderRadius: 999,
                              background: stIndex >= 2 ? 'rgba(232,130,26,0.14)' : 'rgba(122,92,74,0.08)',
                              color: 'var(--amber-dark)',
                              fontWeight: 800,
                              fontSize: 12,
                              border: '1px solid rgba(232,130,26,0.25)'
                            }}
                          >
                            {STATUS_LABEL[st] || st}
                          </div>
                        </div>
                      </button>
                    )
                  })
              )}
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                Chi tiết đơn
              </h2>
              {selectedOrder ? (
                <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>
                  Tổng: {formatMoney(selectedOrder.total_price)}
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>Chọn một bàn</span>
              )}
            </div>

            {!selectedOrderId ? (
              <div style={{ padding: 18, borderRadius: 'var(--radius)', background: '#fff', boxShadow: 'var(--shadow-card)' }}>
                Hãy chọn một bàn ở cột bên trái để xem món và cập nhật trạng thái.
              </div>
            ) : (
              <div style={{ padding: 14, borderRadius: 'var(--radius)', background: '#fff', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 15 }}>
                      🧾 Order #{selectedOrderId}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13 }}>
                      🪑 Bàn {selectedOrder?.table_number}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--amber-dark)' }}>
                      Trạng thái hiện tại
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--amber)' }}>
                      {STATUS_LABEL[currentStatus] || currentStatus}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(122,92,74,0.12)', paddingTop: 12, marginBottom: 12 }}>
                  <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 6 }}>
                    {loadingItems ? (
                      <div style={{ padding: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Đang tải món...</div>
                    ) : orderItems.length === 0 ? (
                      <div style={{ padding: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Không có dữ liệu món.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {orderItems.map((it, i) => (
                          <div
                            key={`${it.name}-${it.menu_item_id ?? i}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 10,
                              alignItems: 'center',
                              background: 'rgba(232,130,26,0.06)',
                              border: '1px solid rgba(232,130,26,0.18)',
                              borderRadius: 12,
                              padding: '10px 12px'
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 900, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {it.name}
                              </div>
                              <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 12 }}>
                                Đơn giá: {formatMoney(it.unit_price)}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', fontWeight: 900 }}>
                              <div style={{ color: 'var(--amber-dark)' }}>x{it.quantity}</div>
                              <div style={{ color: 'var(--amber)' }}>
                                {formatMoney(Number(it.unit_price || 0) * Number(it.quantity || 0))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {STATUS_SEQUENCE.map((st) => {
                      const disabled = submitting || !canSetStatus(st)
                      const isCurrent = st === currentStatus
                      return (
                        <button
                          key={st}
                          onClick={() => updateStatus(st)}
                          disabled={disabled}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 12,
                            border: isCurrent ? '2px solid var(--amber)' : '1px solid rgba(122,92,74,0.18)',
                            background: isCurrent ? 'rgba(232,130,26,0.12)' : '#fff',
                            color: isCurrent ? 'var(--amber-dark)' : 'var(--text-primary)',
                            fontWeight: 900,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            flex: '1 1 auto',
                            minWidth: 150,
                            opacity: disabled ? 0.65 : 1
                          }}
                        >
                          {STATUS_LABEL[st] || st}
                        </button>
                      )
                    })}
                  </div>

                  {selectedOrder?.created_at ? (
                    <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12 }}>
                      Tạo lúc: {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

