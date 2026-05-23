const app = getApp();
Page({
  data: { __theme: 'cream-morandi', wardrobes: [], totalWardrobes: 0, totalItems: 0, totalZones: 0, showAddDialog: false, newName: '', newDesc: '', showEditDialog: false, editNameValue: '', editingWardrobeId: '' },
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
  onWardrobeLongPress(e) {
    const wardrobeId = e.currentTarget.dataset.wardrobeId;
    const wardrobeName = e.currentTarget.dataset.wardrobeName;
    
    // 检查是否为"未分区"衣柜
    if (wardrobeId === 'unassigned') {
      wx.showToast({ title: '系统衣柜不可操作', icon: 'none' });
      return;
    }
    
    wx.showActionSheet({
      itemList: ['编辑名称', '删除衣柜'],
      itemColor: '#333333',
      success: (res) => {
        if (res.tapIndex === 0) {
          this.showEditWardrobeDialog(wardrobeId, wardrobeName);
        } else if (res.tapIndex === 1) {
          this.confirmDeleteWardrobe(wardrobeId, wardrobeName);
        }
      }
    });
  },
  showEditWardrobeDialog(wardrobeId, currentName) {
    this.setData({
      showEditDialog: true,
      editNameValue: currentName,
      editingWardrobeId: wardrobeId
    });
  },
  hideEditDialog() {
    this.setData({ showEditDialog: false, editNameValue: '', editingWardrobeId: '' });
  },
  onEditNameInput(e) {
    this.setData({ editNameValue: e.detail.value });
  },
  confirmEditWardrobeName() {
    const newName = this.data.editNameValue.trim();
    if (!newName) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }
    const wardrobeId = this.data.editingWardrobeId;
    const wardrobes = this.data.wardrobes.map(w => {
      if (w.id !== wardrobeId) return w;
      return { ...w, name: newName };
    });
    this.setData({ wardrobes });
    app.setState({ wardrobes });
    this.hideEditDialog();
    wx.showToast({ title: '名称已更新' });
  },
  confirmDeleteWardrobe(wardrobeId, wardrobeName) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${wardrobeName}」吗？该衣柜下的所有衣物将迁移到"未分区"衣柜。删除后不可恢复。`,
      confirmColor: '#C17C74',
      success: (res) => {
        if (res.confirm) {
          // 迁移衣物到未分区衣柜
          app.migrateClothesToUnassigned(wardrobeId);
          // 删除衣柜
          app.deleteWardrobe(wardrobeId);
          this.loadState();
          wx.showToast({ title: '已删除' });
        }
      }
    });
  },
  preventBubble() {},
});
