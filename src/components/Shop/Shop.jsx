import React, { useEffect, useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { supabase } from '../../lib/supabase';

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
    { id: 'profile_effect', name: 'Profile Effects', icon: '✨' },
    { id: 'avatar_border', name: 'Avatar Borders', icon: '🖼️' },
    { id: 'title_effect', name: 'Title Effects', icon: '👑' },
  ];

  const filteredItems = shopItems.filter((item) => item.category === selectedCategory);

  const userInventoryIds = profile?.user_inventory?.map((inv) => inv.shop_item_id) || [];
  const equippedItemIds = profile?.user_inventory
    ?.filter((inv) => inv.is_equipped)
    .map((inv) => inv.shop_item_id) || [];

  const itemOwned = (itemId) => userInventoryIds.includes(itemId);
  const itemEquipped = (itemId) => equippedItemIds.includes(itemId);
  const getInventoryItemId = (itemId) =>
    profile?.user_inventory?.find((inv) => inv.shop_item_id === itemId)?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🛍️ AniEmpire Shop</h1>
          <p className="text-slate-300">Customize your profile and earn exclusive items</p>
        </div>

        {/* Credits Display */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm mb-1">Your Credits Balance</p>
              <p className="text-4xl font-bold text-yellow-300">{profile?.credits || 0}</p>
            </div>
            <div className="text-6xl">💰</div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* Purchase Message */}
        {purchaseMessage && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              purchaseMessage.type === 'success'
                ? 'bg-green-500/20 border-green-500/50 text-green-300'
                : 'bg-red-500/20 border-red-500/50 text-red-300'
            }`}
          >
            {purchaseMessage.text}
          </div>
        )}

        {/* Items Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-white text-xl">Loading items...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-slate-400">No items available in this category</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const owned = itemOwned(item.id);
              const equipped = itemEquipped(item.id);
              const inventoryItemId = getInventoryItemId(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                >
                  {/* Item Preview */}
                  {item.iframe_template ? (
                    <div className="w-full h-40 bg-slate-700/50 rounded-lg mb-4 overflow-hidden border border-slate-600">
                      <iframe
                        srcDoc={item.iframe_template}
                        className="w-full h-full border-none"
                        style={{ mixBlendMode: 'screen' }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg mb-4 border border-purple-500/30 flex items-center justify-center text-6xl">
                      🎨
                    </div>
                  )}

                  {/* Item Info */}
                  <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{item.description}</p>

                  {/* Price Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-3 py-2">
                      <span className="text-xl">💰</span>
                      <span className="font-bold text-yellow-300">{item.price}</span>
                    </div>

                    {owned && (
                      <span className="text-xs bg-green-500/20 text-green-300 px-3 py-2 rounded-lg border border-green-500/50">
                        ✓ Owned
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {!owned ? (
                      <button
                        onClick={() => handlePurchase(item.id)}
                        disabled={
                          (profile?.credits || 0) < item.price ||
                          (!profile?.id && 'Not authenticated')
                        }
                        className={`w-full py-3 rounded-lg font-bold transition-all ${
                          (profile?.credits || 0) < item.price
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                        }`}
                      >
                        {(profile?.credits || 0) < item.price
                          ? `Need ${item.price - (profile?.credits || 0)} more`
                          : 'Purchase'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEquip(inventoryItemId)}
                          disabled={equipped}
                          className={`w-full py-3 rounded-lg font-bold transition-all ${
                            equipped
                              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          {equipped ? '✓ Equipped' : 'Equip'}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="mt-4 p-3 bg-slate-700/30 rounded-lg text-xs text-slate-400 border border-slate-600">
                    💡 Complete activities to earn credits and XP
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How to Earn Credits Section */}
        <div className="mt-12 bg-slate-800/80 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">How to Earn Credits</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="text-3xl mb-3">📺</div>
              <h3 className="font-bold text-white mb-2">Track Episodes</h3>
              <p className="text-sm text-slate-300 mb-2">
                Track your favorite anime episodes to earn rewards
              </p>
              <div className="flex items-center gap-2">
                <span className="text-blue-300 font-bold">+5</span>
                <span className="text-slate-400">per episode</span>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="text-3xl mb-3">✍️</div>
              <h3 className="font-bold text-white mb-2">Write Reviews</h3>
              <p className="text-sm text-slate-300 mb-2">
                Share your thoughts with reviews (200+ characters)
              </p>
              <div className="flex items-center gap-2">
                <span className="text-yellow-300 font-bold">+50</span>
                <span className="text-slate-400">per review</span>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-bold text-white mb-2">Chat Messages</h3>
              <p className="text-sm text-slate-300 mb-2">
                Participate in global and guild chat
              </p>
              <div className="flex items-center gap-2">
                <span className="text-pink-300 font-bold">+1</span>
                <span className="text-slate-400">per message</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-slate-300">
              💎 <span className="text-purple-300 font-semibold">Donors get 2x rewards!</span> Support
              AniEmpire and unlock exclusive benefits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
