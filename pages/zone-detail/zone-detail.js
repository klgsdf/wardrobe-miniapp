const app = getApp();

Page({
  data: {
    __theme: 'cream-morandi',
    wardrobeId: '',
    zoneId: '',
    wardrobeName: '',
    zoneName: '',
    zoneType: '',
    zoneDesc: '',
    itemCount: 0,
    zoneItems: [],
    masonryLeft: [],
    masonryRight: [],
    showItemDetailSheet: false,
    detailItem: null,
    detailWardrobeName: '',
    detailZoneName: '',
  },

  onLoad(options) {
    const { id, zoneId } = options;
    this.setData({ wardrobeId: id, zoneId });
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const state = app.getState();
    const wardrobe = state.wardrobes.find(w => w.id === this.data.wardrobeId);
    if (!wardrobe) return;

    const zone = wardrobe.zones.find(z => z.id === this.data.zoneId);
    if (!zone) return;

    const zoneItems = state.clothingItems.filter(
      item => item.zoneId === this.data.zoneId && item.wardrobeId === this.data.wardrobeId
    );

    // Zone type descriptions
    const zoneTypeMap = {
      'shelf': '隔板层 · 叠放衣物',
      'hanging': '挂衣区 · 悬挂衣物',
      'drawer': '抽屉 · 小件收纳',
      'storage-box': '收纳盒 · 分类收纳',
      'shoe': '鞋区 · 鞋子收纳',
      'suit': '西装区 · 正装存放',
      'bedding': '床品区 · 床品存放',
    };

    this.setData({
      __theme: state.theme,
      wardrobeName: wardrobe.name,
      zoneName: zone.name,
      zoneType: zone.type,
      zoneDesc: zoneTypeMap[zone.type] || zone.type,
      itemCount: zoneItems.length,
      zoneItems,
    });
    this.buildMasonry(zoneItems);
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
          this.loadData();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  preventBubble() {
    // 阻止事件冒泡，防止点击弹窗内容时关闭弹窗
  },

  navigateBack() {
    wx.navigateBack();
  },
});
