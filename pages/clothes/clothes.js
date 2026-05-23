const app = getApp();
const { CATEGORY_CONFIG } = require('../../utils/data');

Page({
  data: {
    __theme: 'cream-morandi',
    clothingItems: [],
    categories: [],
    activeCategory: '全部',
    activeSubCategory: '',
    expandedCategory: '',
    searchQuery: '',
    showFavoritesOnly: false,
    masonryLeft: [],
    masonryRight: [],
    showDetail: false,
    detailItem: null,
    detailWardrobeName: '',
    detailZoneName: '',
    sidebarOpen: false,
  },
  onLoad() { this.loadState(); },
  onShow() { this.loadState(); this.syncTabBar(); },
  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ activeIndex: 2 });
      const theme = this.data.__theme || 'cream-morandi';
      this.getTabBar().setData({ __theme: theme });
    }
  },
  loadState() {
    const s = app.getState();
    const categories = ['全部', ...Object.keys(CATEGORY_CONFIG)];
    this.setData({ __theme: s.theme, clothingItems: s.clothingItems, categories, CATEGORY_CONFIG });
    this.filterItems();
  },
  filterItems() {
    let items = this.data.clothingItems;
    if (this.data.activeCategory !== '全部') {
      items = items.filter(i => i.category === this.data.activeCategory);
    }
    if (this.data.activeSubCategory) {
      items = items.filter(i => i.subCategory === this.data.activeSubCategory);
    }
    if (this.data.showFavoritesOnly) {
      items = items.filter(i => i.favorite);
    }
    if (this.data.searchQuery.trim()) {
      const q = this.data.searchQuery.trim().toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.includes(q) || i.style.includes(q));
    }
    this.buildMasonry(items);
  },
  toggleFavoritesFilter() {
    this.setData({ showFavoritesOnly: !this.data.showFavoritesOnly });
    this.filterItems();
  },
  toggleFavorite() {
    const item = this.data.detailItem;
    if (!item) return;
    const newFavorite = !item.favorite;
    app.updateClothingItem(item.id, { favorite: newFavorite });
    this.setData({
      detailItem: { ...item, favorite: newFavorite },
      clothingItems: this.data.clothingItems.map(i => i.id === item.id ? { ...i, favorite: newFavorite } : i),
    });
    this.filterItems();
    wx.showToast({ title: newFavorite ? '已收藏' : '已取消收藏', icon: 'none' });
  },
  goToEdit() {
    const item = this.data.detailItem;
    if (!item) return;
    wx.navigateTo({
      url: `/pages/add-clothes/add-clothes?mode=edit&id=${item.id}`,
    });
    this.setData({ showDetail: false });
  },
  buildMasonry(items) {
    const left = [], right = [];
    items.forEach((item, idx) => idx % 2 === 0 ? left.push(item) : right.push(item));
    this.setData({ masonryLeft: left, masonryRight: right });
  },
  toggleSidebar() { this.setData({ sidebarOpen: !this.data.sidebarOpen }); },
  closeSidebar() { this.setData({ sidebarOpen: false }); },
  selectCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    if (cat === '全部') {
      this.setData({ activeCategory: '全部', activeSubCategory: '', expandedCategory: '', sidebarOpen: false });
    } else {
      const isSame = this.data.expandedCategory === cat;
      this.setData({ activeCategory: cat, activeSubCategory: '', expandedCategory: isSame ? '' : cat });
    }
    this.filterItems();
  },
  selectSubCategory(e) {
    const sub = e.currentTarget.dataset.sub;
    this.setData({ activeSubCategory: sub, sidebarOpen: false, expandedCategory: '' });
    this.filterItems();
  },
  onSearch(e) { this.setData({ searchQuery: e.detail.value }); this.filterItems(); },
  showDetail(e) {
    const s = app.getState();
    const item = this.data.clothingItems.find(i => i.id === e.currentTarget.dataset.id);
    if (item) {
      const wardrobe = s.wardrobes.find(w => w.id === item.wardrobeId);
      const zone = wardrobe && wardrobe.zones ? wardrobe.zones.find(z => z.id === item.zoneId) : null;
      this.setData({
        showDetail: true,
        detailItem: item,
        detailWardrobeName: wardrobe ? wardrobe.name : '未分配',
        detailZoneName: zone ? zone.name : '未分配',
      });
    }
  },
  hideDetail() { this.setData({ showDetail: false, detailItem: null }); },
  preventBubble() {
    // 阻止事件冒泡，防止点击弹窗内容时关闭弹窗
  },
  deleteItem() {
    const id = this.data.detailItem.id;
    wx.showModal({ title: '确认删除', content: '删除后不可恢复', success: (res) => {
      if (res.confirm) { app.deleteClothingItem(id); this.hideDetail(); this.loadState(); wx.showToast({ title: '已删除' }); }
    },
  });
  },
});