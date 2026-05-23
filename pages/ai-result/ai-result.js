const app = getApp();

Page({
  data: {
    __theme: 'cream-morandi',
    imageAnalysisResult: null,
    recommendation: null,
    clothingItems: [],
    showItemDetailSheet: false,
    detailItem: null,
    detailWardrobeName: '',
    detailZoneName: '',
  },

  onLoad() {
    const s = app.getState();
    const resultData = app.globalData.aiResultData;
    if (resultData) {
      this.setData({
        __theme: s.theme,
        clothingItems: s.clothingItems,
        imageAnalysisResult: resultData.imageAnalysisResult || null,
        recommendation: resultData.recommendation || null,
      });
      // 清除暂存数据
      app.globalData.aiResultData = null;
    } else {
      wx.showToast({ title: '数据异常', icon: 'none' });
      setTimeout(function() { wx.switchTab({ url: '/pages/home/home' }); }, 1000);
    }
  },

  showItemDetail(e) {
    const targetId = e.currentTarget.dataset.id;
    if (!targetId) {
      wx.showToast({ title: '数据异常', icon: 'none' });
      return;
    }
    const items = this.data.clothingItems;
    const state = app.getState();
    let item = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        item = items[i];
        break;
      }
    }
    if (!item) {
      wx.showToast({ title: '未找到单品', icon: 'none' });
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

  preventBubble() {},

  goRetry() {
    wx.navigateBack();
  },

  goHome() { wx.switchTab({ url: '/pages/home/home' }); },
});
