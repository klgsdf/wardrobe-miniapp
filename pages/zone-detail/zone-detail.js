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
  },

  navigateBack() {
    wx.navigateBack();
  },
});
