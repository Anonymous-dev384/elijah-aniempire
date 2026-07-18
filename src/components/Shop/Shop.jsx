import React, { useEffect, useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { supabase } from '../../lib/supabase';
import {
  IconSparkles, IconImage, IconGem, IconShoppingBag, IconCoins,
  IconSearch, IconPalette, IconTv, IconPenLine, IconMessage,
  IconLightbulb, IconCheck, CrownIcon
} from '../Icons';

const CategoryIcon = ({ id, size = 16 }) => {
  if (id === 'profile_effect') return <IconSparkles size={size} />;
  if (id === 'avatar_border') return <IconImage size={size} />;
  if (id === 'title_effect') return <CrownIcon size={size} color="currentColor" />;
  return <IconPackage size={size} />;
};

export default function Shop() {
  const profile = useProfileStore((state) => state.profile);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const purchaseItem = useProfileStore((state) => state.purchaseItem);
  const equipItem = useProfileStore((state) => state.equipItem);

  const [shopItems, setShopItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('profile_effect');
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseMessage, setPurchaseMessage] = useState(null);

  useEffect(() => {
    fetchShopItems();
  }, []);

  const fetchShopItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .order('category');
      if (error) throw error;
      setShopItems(data || []);
    } catch (error) {
      console.error('Fetch shop items error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (itemId) => {
    try {
      setPurchaseMessage(null);
      await purchaseItem(itemId);
      setPurchaseMessage({ type: 'success', text: 'Item purchased successfully!' });
      await fetchProfile();
      setTimeout(() => setPurchaseMessage(null), 3000);
    } catch (error) {
      setPurchaseMessage({ type: 'error', text: error.message });
      setTimeout(() => setPurchaseMessage(null), 3000);
    }
  };

  const handleEquip = async (inventoryItemId) => {
    try {
      setPurchaseMessage(null);
      await equipItem(inventoryItemId);
      setPurchaseMessage({ type: 'success', text: 'Item equipped!' });
      await fetchProfile();
      setTimeout(() => setPurchaseMessage(null), 3000);
    } catch (error) {
      setPurchaseMessage({ type: 'error', text: error.message });
      setTimeout(() => setPurchaseMessage(null), 3000);
    }
  };

  const categories = [
    { id: 'profile_effect', name: 'Profile Effects', Icon: IconSparkles },
    { id: 'avatar_border',  name: 'Avatar Borders',  Icon: IconImage },
    { id: 'title_effect',   name: 'Title Effects',   Icon: CrownIcon },
  ];

  const filteredItems = shopItems.filter((item) => item.category === selectedCategory);
  const userInventoryIds = profile?.user_inventory?.map((inv) => inv.shop_item_id) || [];
  const equippedItemIds  = profile?.user_inventory?.filter((inv) => inv.is_equipped).map((inv) => inv.shop_item_id) || [];
  const itemOwned     = (id) => userInventoryIds.includes(id);
  const itemEquipped  = (id) => equippedItemIds.includes(id);
  const getInventoryItemId = (id) => profile?.user_inventory?.find((inv) => inv.shop_item_id === id)?.id;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '2.2rem', fontFamily: 'var(--font-heading)', color: 'var(--gold)', marginBottom: 8 }}>
            <IconShoppingBag size={32} color="var(--gold)" />
            AniEmpire Shop
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Customize your profile and earn exclusive items</p>
        </div>

        {/* Credits Display */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', marginBottom: 28, border: '1px solid var(--border-active)', background: 'var(--gold-glow-soft)' }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Credits Balance</p>
            <p style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-heading)' }}>{profile?.credits || 0}</p>
          </div>
          <div style={{ opacity: 0.6 }}>
            <IconCoins size={52} color="var(--gold)" />
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map(({ id, name, Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedCategory(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${selectedCategory === id ? 'var(--gold)' : 'var(--border-default)'}`,
                background: selectedCategory === id ? 'var(--gold)' : 'var(--bg-card)',
                color: selectedCategory === id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Icon size={15} color={selectedCategory === id ? 'var(--bg-primary)' : 'currentColor'} />
              {name}
            </button>
          ))}
        </div>

        {/* Purchase Message */}
        {purchaseMessage && (
          <div style={{
            marginBottom: 20, padding: '12px 16px', borderRadius: 'var(--radius-md)',
            background: purchaseMessage.type === 'success' ? 'rgba(69,163,94,0.15)' : 'rgba(217,59,59,0.15)',
            border: `1px solid ${purchaseMessage.type === 'success' ? 'var(--green)' : 'var(--red)'}`,
            color: purchaseMessage.type === 'success' ? 'var(--green)' : 'var(--red)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <IconCheck size={16} />
            {purchaseMessage.text}
          </div>
        )}

        {/* Items Grid */}
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading items…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
            <IconSearch size={40} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-muted)' }}>No items available in this category</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filteredItems.map((item) => {
              const owned    = itemOwned(item.id);
              const equipped = itemEquipped(item.id);
              const invId    = getInventoryItemId(item.id);
              return (
                <div key={item.id} className="glass-panel shop-item-card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Preview */}
                  {item.iframe_template ? (
                    <div style={{ width: '100%', height: 160, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                      <iframe srcDoc={item.iframe_template} style={{ width: '100%', height: '100%', border: 'none', mixBlendMode: 'screen' }} />
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 160, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconPalette size={48} color="var(--text-muted)" />
                    </div>
                  )}

                  <div style={{ padding: '16px' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: 6, color: 'var(--text-primary)' }}>{item.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>{item.description}</p>

                    {/* Price & Owned */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontWeight: 700 }}>
                        <IconCoins size={16} color="var(--gold)" />
                        <span>{item.price}</span>
                      </div>
                      {owned && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--green)', background: 'rgba(69,163,94,0.12)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--green)' }}>
                          <IconCheck size={12} /> Owned
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    {!owned ? (
                      <button
                        onClick={() => handlePurchase(item.id)}
                        disabled={(profile?.credits || 0) < item.price}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', justifyContent: 'center', opacity: (profile?.credits || 0) < item.price ? 0.45 : 1 }}
                      >
                        {(profile?.credits || 0) < item.price ? `Need ${item.price - (profile?.credits || 0)} more` : 'Purchase'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEquip(invId)}
                        disabled={equipped}
                        className={equipped ? 'btn btn-ghost btn-sm' : 'btn btn-secondary btn-sm'}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {equipped ? <><IconCheck size={13} /> Equipped</> : 'Equip'}
                      </button>
                    )}

                    {/* Tip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <IconLightbulb size={13} />
                      Complete activities to earn credits and XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How to Earn Credits */}
        <div className="glass-panel" style={{ marginTop: 48, padding: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: 24, color: 'var(--text-primary)' }}>How to Earn Credits</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { Icon: IconTv,      title: 'Track Episodes',  desc: 'Track your favourite anime episodes',  reward: '+5',  rewardColor: '#4A8FCC', unit: 'per episode' },
              { Icon: IconPenLine, title: 'Write Reviews',   desc: 'Share your thoughts (200+ chars)',     reward: '+50', rewardColor: 'var(--gold)', unit: 'per review' },
              { Icon: IconMessage, title: 'Chat Messages',   desc: 'Participate in global and guild chat', reward: '+1',  rewardColor: 'var(--pink)', unit: 'per message' },
            ].map(({ Icon, title, desc, reward, rewardColor, unit }) => (
              <div key={title} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-subtle)' }}>
                <Icon size={28} color="var(--text-secondary)" style={{ marginBottom: 10 }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10 }}>{desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 700, color: rewardColor }}>{reward}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--gold-glow-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconGem size={18} color="var(--gold)" />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Donors get 2× rewards!</span> Support AniEmpire and unlock exclusive benefits.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .shop-item-card {
          transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
        }
        .shop-item-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-gold-lg);
          border-color: var(--border-hover) !important;
        }
      `}</style>
    </div>
  );
}
