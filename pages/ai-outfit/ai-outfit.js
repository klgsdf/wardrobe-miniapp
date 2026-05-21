const app = getApp();

Page({
  data: {
    __theme: 'cream-morandi',
    inputValue: '',
    searchHistory: ['约会穿搭', '通勤商务', '周末休闲', '运动健身', '海边度假'],
    isAnalyzing: false,
    recommendations: [],
    expandedRecId: null,
    selectedItem: null,
    clothingItems: [],
    showItemDetailSheet: false,
    detailItem: null,
    detailWardrobeName: '',
    detailZoneName: '',
  },
  onLoad() {
    const s = app.getState();
    const history = wx.getStorageSync('aiSearchHistory') || this.data.searchHistory;
    this.setData({ __theme: s.theme, clothingItems: s.clothingItems, searchHistory: history });
  },

  onInput(e) { this.setData({ inputValue: e.detail.value }); },
  addTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const base = this.data.inputValue.trim();
    this.setData({ inputValue: base ? base + '，' + tag : tag });
  },
  clearHistory() {
    this.setData({ searchHistory: [] });
    wx.removeStorageSync('aiSearchHistory');
    wx.showToast({ title: '已清空' });
  },
  submit() {
    const query = this.data.inputValue.trim();
    if (!query) { wx.showToast({ title: '请输入需求', icon: 'none' }); return; }
    const history = [query].concat(this.data.searchHistory.filter(function(h) { return h !== query; })).slice(0, 10);
    this.setData({ searchHistory: history, isAnalyzing: true, recommendations: [], expandedRecId: null });
    wx.setStorageSync('aiSearchHistory', history);
    const that = this;
    setTimeout(function() {
      const items = that.data.clothingItems;
      const colors = ['#FFB74D', '#81C784', '#64B5F6'];
      const bgs = ['rgba(255,183,77,0.15)', 'rgba(129,199,132,0.15)', 'rgba(100,181,246,0.15)'];
      const recs = [
        { id: 'rec-0', name: '优雅知性风', style: '职场', desc: '根据「' + query + '」推荐优雅知性风，展现自信气质。', clothingItemIds: items.slice(0,2).map(function(i) { return i.id; }), confidence: 92 },
        { id: 'rec-1', name: '休闲舒适风', style: '休闲', desc: '针对「' + query + '」推荐休闲舒适风，轻松自在。', clothingItemIds: items.slice(1,3).map(function(i) { return i.id; }), confidence: 88 },
        { id: 'rec-2', name: '活力清新风', style: '运动', desc: '为「' + query + '」搭配活力清新风，充满朝气。', clothingItemIds: items.slice(0,1).concat(items.slice(3,4)).map(function(i) { return i.id; }), confidence: 85 },
      ];
      // 添加辅助数据
      const recommendations = recs.map(function(r, idx) {
        const matchedItems = items.filter(function(i) { return r.clothingItemIds.indexOf(i.id) !== -1; });
        return {
          id: r.id,
          name: r.name,
          style: r.style,
          desc: r.desc,
          confidence: r.confidence,
          rankColor: colors[idx] || '#64B5F6',
          rankBg: bgs[idx] || 'rgba(100,181,246,0.15)',
          matchedItems: matchedItems,
        };
      });
      that.setData({ recommendations: recommendations, isAnalyzing: false });
      wx.showToast({ title: '分析完成' });
    }, 3500);
  },
  toggleRec(e) { const id = e.currentTarget.dataset.id; this.setData({ expandedRecId: this.data.expandedRecId === id ? null : id }); },
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
    // 查找所在衣柜和分区名称
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
  preventBubble() {
    // 阻止事件冒泡，防止点击弹窗内容时关闭弹窗
  },
  goBack() { wx.navigateBack(); },
});
