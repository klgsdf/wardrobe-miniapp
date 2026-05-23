const app = getApp();
Page({
  data: { __theme: 'cream-morandi', wardrobe: null, showAddZone: false, newZoneName: '', selectedZoneType: '', showEditZoneDialog: false, editZoneNameValue: '', editingZoneId: '', unassignedItems: [], masonryLeft: [], masonryRight: [], showItemDetailSheet: false, detailItem: null, detailWardrobeName: '', detailZoneName: '' },
  onLoad(options) {
    this.wardrobeId = options.id;
    this.setData({ wardrobeId: this.wardrobeId });
    this.loadState();
  },
  onShow() { this.loadState(); },
  loadState() {
    const s = app.getState();
    const w = s.wardrobes.find(x => x.id === this.wardrobeId);
    
    // 如果是未分区衣柜，加载衣物列表
    if (this.wardrobeId === 'unassigned') {
      const unassignedItems = s.clothingItems.filter(item => item.wardrobeId === 'unassigned');
      this.setData({ 
        __theme: s.theme, 
        wardrobe: w || null,
        unassignedItems
      });
      this.buildMasonry(unassignedItems);
    } else {
      this.setData({ __theme: s.theme, wardrobe: w || null });
    }
  },
  buildMasonry(items) {
    const left = [], right = [];
    items.forEach((item, idx) => idx % 2 === 0 ? left.push(item) : right.push(item));
    this.setData({ masonryLeft: left, masonryRight: right });
  },
  showItemDetail(e) {
    const targetId = e.currentTarget.dataset.id;
    if (!targetId) return;
    const state = app.getState();
    const clothingItems = state.clothingItems || [];
    let item = null;
    for (var i = 0; i < clothingItems.length; i++) {
      if (clothingItems[i].id === targetId) { item = clothingItems[i]; break; }
    }
    if (!item) { wx.showToast({ title: '未找到单品详情', icon: 'none' }); return; }
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
    this.setData({ detailItem: item, detailWardrobeName: wardrobeName, detailZoneName: zoneName, showItemDetailSheet: true });
  },
  hideItemDetail() {
    this.setData({ showItemDetailSheet: false });
    setTimeout(function() { this.setData({ detailItem: null, detailWardrobeName: '', detailZoneName: '' }); }.bind(this), 300);
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
      title: '确认删除', content: `确定要删除「${item.name}」吗？删除后不可恢复。`, confirmColor: '#C17C74',
      success: (res) => { if (res.confirm) { app.deleteClothingItem(item.id); this.hideItemDetail(); this.loadState(); wx.showToast({ title: '已删除', icon: 'success' }); } },
    });
  },
  preventBubble() {},
  goBack() { wx.navigateBack(); },
  goToZone(e) {
    const zoneId = e.currentTarget.dataset.zoneid;
    wx.navigateTo({ url: `/pages/zone-detail/zone-detail?id=${this.wardrobeId}&zoneId=${zoneId}` });
  },
  showAddZone() { this.setData({ showAddZone: true, newZoneName: '', selectedZoneType: '' }); },
  hideAddZone() { this.setData({ showAddZone: false }); },
  onZoneNameInput(e) { this.setData({ newZoneName: e.detail.value }); },
  selectZoneType(e) {
    const type = e.currentTarget.dataset.type;
    const currentName = this.data.newZoneName.trim();
    
    // 如果名称为空或名称等于之前的类型,则自动填充类型名称
    let newName = currentName;
    if (!currentName || this.data.selectedZoneType === currentName) {
      newName = type;
    }
    
    this.setData({ 
      selectedZoneType: type,
      newZoneName: newName
    });
  },
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
  onZoneLongPress(e) {
    const zoneId = e.currentTarget.dataset.zoneId;
    const zoneName = e.currentTarget.dataset.zoneName;
    
    wx.showActionSheet({
      itemList: ['编辑名称', '删除分区'],
      itemColor: '#333333',
      success: (res) => {
        if (res.tapIndex === 0) {
          this.showEditZoneDialog(zoneId, zoneName);
        } else if (res.tapIndex === 1) {
          this.confirmDeleteZone(zoneId, zoneName);
        }
      }
    });
  },
  showEditZoneDialog(zoneId, currentName) {
    this.setData({
      showEditZoneDialog: true,
      editZoneNameValue: currentName,
      editingZoneId: zoneId
    });
  },
  hideEditZoneDialog() {
    this.setData({ showEditZoneDialog: false, editZoneNameValue: '', editingZoneId: '' });
  },
  onEditZoneNameInput(e) {
    this.setData({ editZoneNameValue: e.detail.value });
  },
  confirmEditZoneName() {
    const newName = this.data.editZoneNameValue.trim();
    if (!newName) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }
    const zoneId = this.data.editingZoneId;
    const state = app.getState();
    const wardrobes = state.wardrobes.map(w => {
      if (w.id !== this.wardrobeId) return w;
      const zones = w.zones.map(z => {
        if (z.id !== zoneId) return z;
        return { ...z, name: newName };
      });
      return { ...w, zones };
    });
    app.setState({ wardrobes });
    this.hideEditZoneDialog();
    this.loadState();
    wx.showToast({ title: '名称已更新' });
  },
  confirmDeleteZone(zoneId, zoneName) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${zoneName}」吗？该分区下的所有衣物将迁移到"未分区"衣柜。删除后不可恢复。`,
      confirmColor: '#C17C74',
      success: (res) => {
        if (res.confirm) {
          // 迁移衣物到未分区衣柜
          app.migrateClothesFromZoneToUnassigned(this.wardrobeId, zoneId);
          // 删除分区
          app.deleteZone(this.wardrobeId, zoneId);
          this.loadState();
          wx.showToast({ title: '已删除' });
        }
      }
    });
  },
});
