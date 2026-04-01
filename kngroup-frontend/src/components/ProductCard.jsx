import { ShoppingCart } from 'lucide-react'

export default function ProductCard({ product, onAddToCart }) {
    return (
        <div
        style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            cursor: 'pointer'
        }}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(28,28,28,0.08)'
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'none'
        }}
        >
        <div style={{ position: 'relative', paddingTop: '75%', background: 'var(--ivory-2)' }}>
        <img
        src={product.image_url || 'https://placehold.co/400x300/FBEBD6/F47C20?text=KN+Group'}
        alt={product.name || product.title}
        style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover'
        }}
        />
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
            fontWeight: 600, fontSize: '1.1rem', color: 'var(--charcoal)',
            marginBottom: '0.5rem', lineHeight: 1.3
        }}>
        {product.name || product.title}
        </h3>

        {product.description && (
            <p style={{
                fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem',
                                 display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
            {product.description}
            </p>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem',
            fontWeight: 700, color: 'var(--saffron)'
        }}>
        ₹{product.price?.toLocaleString('en-IN')}
        </span>
        <button
        onClick={() => onAddToCart(product)}
        style={{
            background: 'var(--ivory-2)', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--charcoal)',
            transition: 'background 0.2s, color 0.2s'
        }}
        onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--saffron)'
            e.currentTarget.style.color = '#fff'
        }}
        onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--ivory-2)'
            e.currentTarget.style.color = 'var(--charcoal)'
        }}
        >
        <ShoppingCart size={18} />
        </button>
        </div>
        </div>
        </div>
    )
}
