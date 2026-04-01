import { useEffect, useState } from 'react'
import { getProducts, getCategories, createOrder } from './api'
import ProductCard from './components/ProductCard'
import { ShoppingCart, Search, X, ArrowRight, CheckCircle2, Minus, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── KN GROUP DESIGN TOKENS ──────────────────────────────────────────────────
// Saffron   #F47C20  ← from the "K" in logo
// Forest    #3E8E2E  ← from the "N" + flag in logo
// Ivory     #FEF9F3  ← warm background that breathes with saffron
// Charcoal  #1C1C1C  ← rich near-black for typography
// ─────────────────────────────────────────────────────────────────────────────

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
  --saffron:   #F47C20;
  --saffron-light: #FDE8D2;
  --saffron-mid:   #FBEBD6;
  --forest:    #3E8E2E;
  --forest-light: #D6EDD1;
  --ivory:     #FEF9F3;
  --ivory-2:   #F8F0E6;
  --charcoal:  #1C1C1C;
  --muted:     #8A7968;
  --border:    #EDE3D6;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--ivory);
  font-family: 'Outfit', sans-serif;
  color: var(--charcoal);
  -webkit-font-smoothing: antialiased;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Grain texture overlay */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 256px;
}

input, textarea, button { font-family: 'Outfit', sans-serif; }

::selection { background: var(--saffron-light); color: var(--saffron); }

/* Smooth focus ring */
:focus-visible {
  outline: 2px solid var(--saffron);
  outline-offset: 3px;
  border-radius: 6px;
}
`

function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('')

  // Checkout States
  const [cart, setCart] = useState([])
  const [cartStep, setCartStep] = useState(0) // 0: Closed, 1: Cart, 2: Checkout Form, 3: Success
  const [customer, setCustomer] = useState({ name: '', email: '', address: '' })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    getProducts({ search, category_id: selectedCat }).then(setProducts)
  }, [search, selectedCat])

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0)

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    const orderPayload = {
      customer_name: customer.name,
      customer_email: customer.email,
      shipping_address: customer.address,
      items: cart.map(item => ({ product_id: item.id }))
    }
    try {
      await createOrder(orderPayload)
      setCartStep(3)
    } catch {
      alert("Something went wrong. Please try again.")
    }
  }

  const closeCart = () => {
    setCartStep(0)
    if (cartStep === 3) {
      setCart([])
      setCustomer({ name: '', email: '', address: '' })
    }
  }

  const removeFromCart = (idx) => {
    setCart(cart.filter((_, i) => i !== idx))
  }

  const currentCategory = categories.find(c => c.id === selectedCat)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
    <style>{FONTS}</style>

    {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(254,249,243,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
          transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
          padding: '0 2.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '72px',
    }}>

    {/* Logo */}
    <div
    onClick={() => setSelectedCat('')}
    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
    <img src="/logo.png" alt="KN Group" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
    </div>

    {/* Search */}
    <div style={{
      flex: 1, maxWidth: '520px', margin: '0 3rem',
      position: 'relative', display: 'flex', alignItems: 'center'
    }} className="hidden-mobile">
    <Search size={16} style={{
      position: 'absolute', left: '1rem',
      color: 'var(--muted)', pointerEvents: 'none'
    }} />
    <input
    type="text"
    placeholder="Search premium appliances…"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      width: '100%',
      padding: '0.75rem 1rem 0.75rem 2.75rem',
      background: 'var(--ivory-2)',
          border: '1px solid var(--border)',
          borderRadius: '100px',
          fontSize: '0.875rem',
          color: 'var(--charcoal)',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          fontFamily: 'Outfit, sans-serif',
          letterSpacing: '0.01em',
    }}
    onFocus={(e) => {
      e.target.style.borderColor = 'var(--saffron)'
      e.target.style.boxShadow = '0 0 0 3px rgba(244,124,32,0.12)'
    }}
    onBlur={(e) => {
      e.target.style.borderColor = 'var(--border)'
      e.target.style.boxShadow = 'none'
    }}
    />
    </div>

    {/* Cart */}
    <button
    onClick={() => setCartStep(1)}
    style={{
      position: 'relative',
      background: 'none', border: 'none',
      cursor: 'pointer',
      padding: '0.5rem',
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      color: 'var(--charcoal)',
    }}
    >
    <ShoppingCart size={22} style={{ transition: 'color 0.2s' }}
    onMouseEnter={e => e.currentTarget.style.color = 'var(--saffron)'}
    onMouseLeave={e => e.currentTarget.style.color = 'var(--charcoal)'}
    />
    <AnimatePresence>
    {cart.length > 0 && (
      <motion.span
      key="badge"
      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
      style={{
        position: 'absolute', top: 0, right: 0,
        background: 'var(--saffron)', color: '#fff',
                         fontSize: '10px', fontWeight: 700,
                         width: '18px', height: '18px', borderRadius: '50%',
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         lineHeight: 1,
      }}
      >
      {cart.length}
      </motion.span>
    )}
    </AnimatePresence>
    </button>
    </nav>

    {/* ── HERO ───────────────────────────────────────────────────────────── */}
    <header style={{
      paddingTop: '140px',
      paddingBottom: '80px',
      paddingLeft: '2.5rem',
      paddingRight: '2.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
    {/* Decorative saffron blob */}
    <div style={{
      position: 'absolute', top: '-80px', right: '-100px',
      width: '600px', height: '600px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(244,124,32,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
    }} />
    {/* Decorative green blob */}
    <div style={{
      position: 'absolute', bottom: '-120px', left: '-60px',
      width: '400px', height: '400px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(62,142,46,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
    }} />

    <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
    <motion.div
    key={selectedCat}
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    style={{ maxWidth: '680px' }}
    >
    {/* Label */}
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
      background: 'var(--saffron-mid)',
          border: '1px solid rgba(244,124,32,0.2)',
          borderRadius: '100px',
          padding: '0.35rem 1rem',
          marginBottom: '1.5rem',
    }}>
    <div style={{
      width: '6px', height: '6px', borderRadius: '50%',
      background: 'var(--saffron)',
    }} />
    <span style={{
      fontSize: '0.7rem', fontWeight: 600,
      color: 'var(--saffron)', letterSpacing: '0.12em',
          textTransform: 'uppercase',
    }}>
    {selectedCat ? 'Curated Collection' : 'Official Store'}
    </span>
    </div>

    {/* Headline */}
    <h1 style={{
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: 'clamp(3rem, 6vw, 5rem)',
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'var(--charcoal)',
          marginBottom: '1.25rem',
          textTransform: 'capitalize',
    }}>
    {selectedCat
      ? currentCategory?.name
      : <>
      Welcome to{' '}
      <span style={{ color: 'var(--saffron)' }}>K</span><span style={{ color: 'var(--forest)' }}>N</span> Group.
      </>
    }
    </h1>

    {/* Sub */}
    <p style={{
      fontSize: '1.05rem',
      color: 'var(--muted)',
          fontWeight: 300,
          lineHeight: 1.7,
          maxWidth: '480px',
    }}>
    {selectedCat
      ? currentCategory?.quote
      : 'Browse our curated catalog of premium home & kitchen appliances, crafted for modern living.'
    }
    </p>
    </motion.div>
    </div>
    </header>

    {/* ── CATEGORIES ─────────────────────────────────────────────────────── */}
    <section style={{ padding: '0 2.5rem 3rem' }}>
    <div style={{
      maxWidth: '1400px', margin: '0 auto',
      display: 'flex', gap: '0.625rem',
      overflowX: 'auto', paddingBottom: '0.5rem',
    }} className="no-scrollbar">
    {['', ...categories.map(c => c.id)].map((id) => {
      const cat = categories.find(c => c.id === id)
      const label = id === '' ? 'All Products' : cat?.name
      const active = selectedCat === id
      return (
        <button
        key={id}
        onClick={() => setSelectedCat(id)}
        style={{
          padding: '0.625rem 1.375rem',
          borderRadius: '100px',
          border: active ? '1.5px solid var(--saffron)' : '1.5px solid var(--border)',
              background: active ? 'var(--saffron)' : 'transparent',
              color: active ? '#fff' : 'var(--muted)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
              transition: 'all 0.2s ease',
              boxShadow: active ? '0 4px 16px rgba(244,124,32,0.28)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.borderColor = 'var(--saffron)'
            e.currentTarget.style.color = 'var(--saffron)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--muted)'
          }
        }}
        >
        {label}
        </button>
      )
    })}
    </div>
    </section>

    {/* ── PRODUCTS ───────────────────────────────────────────────────────── */}
    <main style={{ padding: '0 2.5rem 8rem' }}>
    <div style={{
      maxWidth: '1400px', margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.75rem',
    }}>
    {products.map((product, i) => (
      <motion.div
      key={product.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.4 }}
      >
      <ProductCard
      product={product}
      onAddToCart={(p) => { setCart([...cart, p]); setCartStep(1) }}
      />
      </motion.div>
    ))}
    {products.length === 0 && (
      <div style={{
        gridColumn: '1/-1',
        padding: '5rem 0', textAlign: 'center',
        color: 'var(--muted)', fontWeight: 300,
      }}>
      No products found in this category.
      </div>
    )}
    </div>
    </main>

    {/* ── CART DRAWER ────────────────────────────────────────────────────── */}
    <AnimatePresence>
    {cartStep > 0 && (
      <>
      {/* Backdrop */}
      <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={closeCart}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(28,28,28,0.45)',
                      backdropFilter: 'blur(6px)',
                      zIndex: 200,
      }}
      />

      {/* Drawer */}
      <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '440px',
        background: 'var(--ivory)',
                      zIndex: 201,
                      display: 'flex', flexDirection: 'column',
                      boxShadow: '-20px 0 60px rgba(28,28,28,0.15)',
      }}
      >
      {/* Drawer Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'var(--ivory-2)',
      }}>
      <div>
      <p style={{
        fontSize: '0.65rem', fontWeight: 700,
        color: 'var(--saffron)', letterSpacing: '0.12em',
                      textTransform: 'uppercase', marginBottom: '0.25rem',
      }}>
      {cartStep === 1 ? 'Shopping Cart' : cartStep === 2 ? 'Checkout' : 'Confirmed'}
      </p>
      <h2 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '1.5rem', fontWeight: 700, color: 'var(--charcoal)',
      }}>
      {cartStep === 1 && `${cart.length} Item${cart.length !== 1 ? 's' : ''}`}
      {cartStep === 2 && 'Your Details'}
      {cartStep === 3 && 'Order Placed!'}
      </h2>
      </div>
      <button
      onClick={closeCart}
      style={{
        background: 'var(--border)', border: 'none',
                      borderRadius: '50%', width: '36px', height: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#ddd'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--border)'}
      >
      <X size={16} color="var(--charcoal)" />
      </button>
      </div>

      {/* Drawer Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

      {/* ── Step 1: Cart Items */}
      {cartStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cart.length === 0 ? (
          <div style={{
            textAlign: 'center', marginTop: '5rem',
            color: 'var(--muted)', fontWeight: 300,
          }}>
          <ShoppingCart size={40} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
          Your cart is empty.
          </div>
        ) : (
          cart.map((item, idx) => (
            <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            style={{
              display: 'flex', gap: '1rem', alignItems: 'center',
              padding: '1rem',
              background: '#fff',
              border: '1px solid var(--border)',
                                   borderRadius: '16px',
            }}
            >
            <img
            src={item.image_url || 'https://via.placeholder.com/80'}
            alt={item.title}
            style={{
              width: '72px', height: '72px',
              borderRadius: '10px', objectFit: 'cover',
              background: 'var(--ivory-2)', flexShrink: 0,
            }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontWeight: 600, fontSize: '0.875rem',
              color: 'var(--charcoal)', lineHeight: 1.3,
                                   overflow: 'hidden', textOverflow: 'ellipsis',
                                   whiteSpace: 'nowrap',
            }}>
            {item.title}
            </p>
            <p style={{
              color: 'var(--saffron)', fontWeight: 700,
                                   fontSize: '1rem', marginTop: '0.35rem',
            }}>
            ₹{item.price.toLocaleString('en-IN')}
            </p>
            </div>
            <button
            onClick={() => removeFromCart(idx)}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--muted)',
                                   padding: '0.25rem', borderRadius: '6px',
                                   transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#e53e3e'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
            <Trash2 size={15} />
            </button>
            </motion.div>
          ))
        )}
        </div>
      )}

      {/* ── Step 2: Checkout Form */}
      {cartStep === 2 && (
        <form id="checkout-form" onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {[
          { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe' },
          { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
          <label style={{
            display: 'block',
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--muted)', letterSpacing: '0.1em',
                                                      textTransform: 'uppercase', marginBottom: '0.5rem',
          }}>
          {label}
          </label>
          <input
          required type={type} placeholder={placeholder}
          value={customer[key]}
          onChange={e => setCustomer({ ...customer, [key]: e.target.value })}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            background: '#fff',
            border: '1.5px solid var(--border)',
                                                      borderRadius: '12px',
                                                      fontSize: '0.9rem',
                                                      color: 'var(--charcoal)',
                                                      outline: 'none',
                                                      transition: 'border-color 0.2s, box-shadow 0.2s',
                                                      fontFamily: 'Outfit, sans-serif',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--saffron)'
            e.target.style.boxShadow = '0 0 0 3px rgba(244,124,32,0.1)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--border)'
            e.target.style.boxShadow = 'none'
          }}
          />
          </div>
        ))}
        <div>
        <label style={{
          display: 'block',
          fontSize: '0.7rem', fontWeight: 700,
          color: 'var(--muted)', letterSpacing: '0.1em',
                          textTransform: 'uppercase', marginBottom: '0.5rem',
        }}>
        Shipping Address
        </label>
        <textarea
        required rows={3} placeholder="123 Main St, City, State, PIN"
        value={customer.address}
        onChange={e => setCustomer({ ...customer, address: e.target.value })}
        style={{
          width: '100%', resize: 'none',
          padding: '0.875rem 1rem',
          background: '#fff',
          border: '1.5px solid var(--border)',
                          borderRadius: '12px',
                          fontSize: '0.9rem',
                          color: 'var(--charcoal)',
                          outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          fontFamily: 'Outfit, sans-serif',
                          lineHeight: 1.6,
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--saffron)'
          e.target.style.boxShadow = '0 0 0 3px rgba(244,124,32,0.1)'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border)'
          e.target.style.boxShadow = 'none'
        }}
        />
        </div>

        {/* Order summary mini */}
        <div style={{
          background: 'var(--saffron-mid)',
                          border: '1px solid rgba(244,124,32,0.18)',
                          borderRadius: '14px',
                          padding: '1rem 1.25rem',
        }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
        Order Total ({cart.length} item{cart.length !== 1 ? 's' : ''})
        </p>
        <p style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.75rem', fontWeight: 700,
          color: 'var(--saffron)',
        }}>
        ₹{totalPrice.toLocaleString('en-IN')}
        </p>
        </div>
        </form>
      )}

      {/* ── Step 3: Success */}
      {cartStep === 3 && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100%', textAlign: 'center',
          padding: '2rem',
          gap: '1.25rem',
        }}>
        <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.55, delay: 0.1 }}
        style={{
          width: '96px', height: '96px', borderRadius: '50%',
          background: 'var(--forest-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        >
        <CheckCircle2 size={48} color="var(--forest)" />
        </motion.div>
        <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        >
        <h3 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '2rem', fontWeight: 700,
          color: 'var(--charcoal)', marginBottom: '0.75rem',
        }}>
        Order Confirmed!
        </h3>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontWeight: 300 }}>
        Thank you, <strong style={{ color: 'var(--charcoal)', fontWeight: 600 }}>{customer.name}</strong>.
        <br />We've received your order and are processing it now.
        </p>
        </motion.div>
        </div>
      )}
      </div>

      {/* Drawer Footer */}
      {cartStep < 3 && (
        <div style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid var(--border)',
                        background: 'var(--ivory-2)',
        }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: '1rem',
        }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
        Total Amount
        </span>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.6rem', fontWeight: 700,
          color: 'var(--charcoal)',
        }}>
        ₹{totalPrice.toLocaleString('en-IN')}
        </span>
        </div>

        {cartStep === 1 ? (
          <button
          onClick={() => setCartStep(2)}
          disabled={cart.length === 0}
          style={{
            width: '100%',
            padding: '1rem',
            background: cart.length === 0 ? 'var(--border)' : 'var(--charcoal)',
                           color: cart.length === 0 ? 'var(--muted)' : '#fff',
                           border: 'none', borderRadius: '12px',
                           fontSize: '0.9rem', fontWeight: 700,
                           cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                           display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                           letterSpacing: '0.03em',
                           transition: 'background 0.2s, transform 0.15s',
                           fontFamily: 'Outfit, sans-serif',
          }}
          onMouseEnter={e => { if (cart.length > 0) e.currentTarget.style.background = 'var(--saffron)' }}
          onMouseLeave={e => { if (cart.length > 0) e.currentTarget.style.background = 'var(--charcoal)' }}
          >
          Proceed to Checkout <ArrowRight size={16} />
          </button>
        ) : (
          <button
          type="submit" form="checkout-form"
          style={{
            width: '100%',
            padding: '1rem',
            background: 'var(--saffron)',
             color: '#fff',
             border: 'none', borderRadius: '12px',
             fontSize: '0.9rem', fontWeight: 700,
             cursor: 'pointer',
             letterSpacing: '0.03em',
             transition: 'background 0.2s',
             boxShadow: '0 6px 20px rgba(244,124,32,0.32)',
             fontFamily: 'Outfit, sans-serif',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--forest)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--saffron)'}
          >
          Confirm & Place Order
          </button>
        )}
        </div>
      )}
      </motion.div>
      </>
    )}
    </AnimatePresence>
    </div>
  )
}

export default App
