import React, { useEffect, useState } from 'react'
import useShopStore from '../../store/shopStore'
import useUserStore from '../../store/userStore'
import OptimizedImage from '../OptimizedImage'

const CATEGORIES = [
  { id: 'cosmetics', label: 'Cosmetics' },
  { id: 'themes', label: 'Themes' },
  { id: 'currency', label: 'Currency' },
  { id: 'badges', label: 'Badges' },
]

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('cosmetics')
  const [purchasing, setPurchasing] = useState(null)
  const { items, wallet, inventory, fetchShopItems, purchaseItem, fetchInventory, fetchWallet } = useShopStore()
  const { user } = useUserStore()

  useEffect(() => {
    fetchShopItems(selectedCategory)
  }, [selectedCategory])

  useEffect(() => {
    if (user?.id) {
      fetchInventory(user.id)
      fetchWallet(user.id)
    }
  }, [user])

  const handlePurchase = async (itemId) => {
    if (!user?.id) {
      alert('Please log in to purchase items')
      return
    }

    setPurchasing(itemId)
    try {
      await purchaseItem(user.id, itemId, 1)
      alert('Purchase successful!')
    } catch (error) {
      alert(`Purchase failed: ${error.message}`)
    } finally {
      setPurchasing(null)
    }
  }

  const isOwned = (itemId) => {
    return inventory.some(inv => inv.shop_item_id === itemId)
  }

  return (
    <div className="shop-page section">
      <div className="shop-header">
        <div>
          <h1>AniEmpire Shop</h1>
          <p>Customize your profile and unlock exclusive content</p>
        </div>
        {wallet && (
          <div className="wallet-display">
            <div className="currency-badge">
              <span className="currency-icon">💎</span>
              <span className="currency-amount">{wallet.credits}</span>
            </div>
          </div>
        )}
      </div>

      <div className="shop-filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="shop-grid">
        {items.map(item => (
          <div key={item.id} className="shop-item-card">
            <div className="item-image">
              <OptimizedImage
                src={item.image_url}
                alt={item.name}
                width={200}
                height={200}
                className="item-img"
              />
              {isOwned(item.id) && <div className="owned-badge">Owned</div>}
            </div>
            <div className="item-info">
              <h3>{item.name}</h3>
              <p className="item-description">{item.description}</p>
              <div className="item-price">
                <span className="price-label">💎</span>
                <span className="price-value">{item.price}</span>
              </div>
            </div>
            <button
              className={`purchase-btn ${isOwned(item.id) ? 'owned' : ''} ${purchasing === item.id ? 'loading' : ''}`}
              onClick={() => handlePurchase(item.id)}
              disabled={isOwned(item.id) || purchasing === item.id}
            >
              {isOwned(item.id) ? 'Owned' : purchasing === item.id ? 'Purchasing...' : 'Buy'}
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .shop-page {
          max-width: 1200px;
          margin: 0 auto;
        }
        .shop-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .shop-header h1 {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }
        .wallet-display {
          display: flex;
          gap: 12px;
        }
        .currency-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-elevated);
          padding: 12px 20px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          font-weight: 700;
        }
        .currency-icon {
          font-size: 1.5rem;
        }
        .shop-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
          overflow-x: auto;
          padding-bottom: 12px;
        }
        .filter-btn {
          padding: 10px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .filter-btn:hover,
        .filter-btn.active {
          background: var(--gold);
          color: var(--bg-primary);
          border-color: var(--gold);
        }
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 24px;
        }
        .shop-item-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .shop-item-card:hover {
          border-color: var(--gold);
          box-shadow: var(--shadow-gold);
          transform: translateY(-4px);
        }
        .item-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--bg-elevated);
        }
        .item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .owned-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: var(--green);
          color: white;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .item-info {
          padding: 16px;
        }
        .item-info h3 {
          font-size: 1.1rem;
          margin-bottom: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-description {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .item-price {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          font-weight: 700;
          color: var(--gold);
        }
        .purchase-btn {
          width: 100%;
          padding: 12px;
          background: var(--gold);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-md);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .purchase-btn:hover:not(:disabled) {
          background: var(--gold-light);
          box-shadow: var(--shadow-gold-lg);
        }
        .purchase-btn.owned,
        .purchase-btn:disabled {
          background: var(--bg-elevated);
          color: var(--text-muted);
          cursor: not-allowed;
        }
        .purchase-btn.loading {
          opacity: 0.7;
        }
      `}</style>
    </div>
  )
}
