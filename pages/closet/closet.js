const app = getApp();
Page({
  data: { __theme: 'cream-morandi', wardrobes: [], totalWardrobes: 0, totalItems: 0, totalZones: 0, showAddDialog: false, newName: '', newDesc: '' },
  onLoad() { this.loadState(); },
  onShow() { this.loadState(); this.syncTabBar(); },
  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ activeIndex: 1 });
      const theme = this.data.__theme || 'cream-morandi';
      this.getTabBar().setData({ __theme: theme });
    }
  },
  loadState() {
    const s = app.getState();
    this.setData({ __theme: s.theme, wardrobes: s.wardrobes, totalWardrobes: s.wardrobes.length, totalItems: s.wardrobes.reduce((a,w)=>a+w.itemCount,0), totalZones: s.wardrobes.reduce((a,w)=>a+w.zoneCount,0) });
  },
  goToDetail(e) { wx.navigateTo({ url: '/pages/closet-detail/closet-detail?id=' + e.currentTarget.dataset.id }); },
  showAdd() { this.setData({ showAddDialog: true, newName: '', newDesc: '' }); },
  hideAdd() { this.setData({ showAddDialog: false }); },
  onNameInput(e) { this.setData({ newName: e.detail.value }); },
  onDescInput(e) { this.setData({ newDesc: e.detail.value }); },
  confirmAdd() {
    if (!this.data.newName.trim()) { wx.showToast({ title: '请输入名称', icon: 'none' }); return; }
    app.addWardrobe({ id: 'w'+Date.now(), name: this.data.newName.trim(), description: this.data.newDesc.trim()||'日常衣物存放', type: '自定义', icon: 'Cabinet', zoneCount: 0, itemCount: 0, zones: [] });
    this.hideAdd(); this.loadState(); wx.showToast({ title: '已添加' });
  },
});
