const app = getApp();
const { getOutfitDiaries } = require('../../utils/data.js');

Page({
  data: {
    __theme: 'cream-morandi',
    entry: null,
    items: [],
    showItemDetailSheet: false,
    detailItem: null,
    detailWardrobeName: '',
    detailZoneName: '',
  },

  onLoad(options) {
    const s = app.getState();
    const id = options.id || 'diary-1';
    const diaries = getOutfitDiaries ? getOutfitDiaries() : [];

    // Find the diary entry
    let entry = diaries.find(d => d.id === id);
    if (!entry) {
      // Default fallback data
      entry = {
        id: 'diary-1',
        name: '休闲帽搭配',
        style: '休闲',
        date: '2026-05-17',
        note: '适合周末逛街',
        photos: ['/images/outfit-thumb-1.jpg'],
        items: [
          { id: 'c1', name: '休闲棒球帽', category: '配饰服饰', subcategory: '帽子', image: '/images/cloth-1.jpg' }
        ]
      };
    }

    this.setData({
      __theme: s.theme,
      entry,
      items: entry.items || []
    });
  },

  onShow() {
    const s = app.getState();
    this.setData({ __theme: s.theme });
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/diary/diary' });
      }
    });
  },

  editEntry() {
    wx.showToast({ title: '编辑功能开发中', icon: 'none' });
  },

  shareEntry() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  deleteEntry() {
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这套穿搭记录吗？',
      confirmColor: '#C17C74',
      success(res) {
        if (res.confirm) {
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => {
            that.goBack();
          }, 800);
        }
      }
    });
  },

  onShareAppMessage() {
    const entry = this.data.entry;
    return {
      title: entry ? entry.name : '穿搭详情',
      path: `/pages/diary-detail/diary-detail?id=${entry ? entry.id : ''}`
    };
  },

  showItemDetail(e) {
    const targetId = e.currentTarget.dataset.id;
    if (!targetId) return;
    const state = app.getState();
    const clothingItems = state.clothingItems || [];
    let item = null;
    for (var i = 0; i < clothingItems.length; i++) {
      if (clothingItems[i].id === targetId) {
        item = clothingItems[i];
        break;
      }
    }
    if (!item) {
      wx.showToast({ title: '未找到单品详情', icon: 'none' });
      return;
    }
    let wardrobeName = '未分配';
    let zoneName = '未分配';
    if (item.wardrobeId) {
      const wardrobe = state.wardrobes.find(function(w) { return w.id === item.wardrobeId; });
      if (wardrobe) {
        wardrobeName = wardrobe.name;
        if (item.zoneId && wardrobe.zones) {
          const zone = wardrobe.zones.find(function(z) { return z.id === item.zoneId; });
          if (zone) zoneName = zone.name;
        }
      }
    }
    this.setData({
      detailItem: item,
      detailWardrobeName: wardrobeName,
      detailZoneName: zoneName,
      showItemDetailSheet: true,
    });
  },

  hideItemDetail() {
    this.setData({ showItemDetailSheet: false });
    setTimeout(function() {
      this.setData({ detailItem: null, detailWardrobeName: '', detailZoneName: '' });
    }.bind(this), 300);
  },

  editItemDetail() {
    const item = this.data.detailItem;
    if (!item) return;
    this.hideItemDetail();
    wx.navigateTo({ url: `/pages/add-clothes/add-clothes?id=${item.id}` });
  },

  deleteItemDetail() {
    const item = this.data.detailItem;
    if (!item) return;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${item.name}」吗？删除后不可恢复。`,
      confirmColor: '#C17C74',
      success: (res) => {
        if (res.confirm) {
          app.deleteClothingItem(item.id);
          this.hideItemDetail();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  preventBubble() {
    // 阻止事件冒泡，防止点击弹窗内容时关闭弹窗
  },
});
