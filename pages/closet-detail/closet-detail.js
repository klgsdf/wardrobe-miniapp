const app = getApp();
Page({
  data: { __theme: 'cream-morandi', wardrobe: null, showAddZone: false, newZoneName: '', selectedZoneType: '' },
  onLoad(options) {
    this.wardrobeId = options.id;
    this.loadState();
  },
  onShow() { this.loadState(); },
  loadState() {
    const s = app.getState();
    const w = s.wardrobes.find(x => x.id === this.wardrobeId);
    this.setData({ __theme: s.theme, wardrobe: w || null });
  },
  goBack() { wx.navigateBack(); },
  goToZone(e) {
    const zoneId = e.currentTarget.dataset.zoneid;
    wx.navigateTo({ url: `/pages/zone-detail/zone-detail?id=${this.wardrobeId}&zoneId=${zoneId}` });
  },
  showAddZone() { this.setData({ showAddZone: true, newZoneName: '', selectedZoneType: '' }); },
  hideAddZone() { this.setData({ showAddZone: false }); },
  onZoneNameInput(e) { this.setData({ newZoneName: e.detail.value }); },
  selectZoneType(e) { this.setData({ selectedZoneType: e.currentTarget.dataset.type }); },
  confirmAddZone() {
    const name = this.data.newZoneName.trim();
    const type = this.data.selectedZoneType;
    if (!name) { wx.showToast({ title: '请输入分区名称', icon: 'none' }); return; }
    if (!type) { wx.showToast({ title: '请选择分区类型', icon: 'none' }); return; }
    app.addZone(this.wardrobeId, { id: 'z'+Date.now(), name, type, itemCount: 0 });
    this.hideAddZone(); this.loadState();
    wx.showToast({ title: '分区已添加' });
  },
  deleteZone(e) {
    const zoneId = e.currentTarget.dataset.id;
    wx.showModal({ title: '确认删除', content: '删除后不可恢复', success: (res) => {
      if (res.confirm) { app.deleteZone(this.wardrobeId, zoneId); this.loadState(); wx.showToast({ title: '已删除' }); }
    }});
  },
});
