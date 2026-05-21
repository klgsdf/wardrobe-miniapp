// ===== 全局应用逻辑 =====
const { getDefaultState } = require('./utils/data');

App({
  globalData: {
    state: null,
    toasts: [],
  },

  onLaunch() {
    // 从本地存储恢复状态，没有则使用默认值
    const saved = wx.getStorageSync('appState');
    if (saved) {
      this.globalData.state = saved;
    } else {
      this.globalData.state = getDefaultState();
    }

    // 获取设备信息（兼容新API）
    const windowInfo = wx.getWindowInfo();
    const deviceInfo = wx.getDeviceInfo();
    this.globalData.sysInfo = { ...windowInfo, ...deviceInfo };
    this.globalData.statusBarHeight = windowInfo.statusBarHeight;
    this.globalData.safeAreaBottom = windowInfo.safeArea ? (windowInfo.screenHeight - windowInfo.safeArea.bottom) : 0;

    // 应用当前主题
    this.applyTheme(this.globalData.state.theme);
  },

  /** 应用主题到页面 */
  applyTheme(theme) {
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const page = pages[pages.length - 1];
      page.setData({ __theme: theme });
    }
  },

  /** 获取当前状态 */
  getState() {
    return this.globalData.state;
  },

  /** 更新状态并持久化 */
  setState(updater) {
    const newState = typeof updater === 'function' ? updater(this.globalData.state) : updater;
    this.globalData.state = { ...this.globalData.state, ...newState };
    wx.setStorageSync('appState', this.globalData.state);
    return this.globalData.state;
  },

  /** 更新城市 */
  updateCity(city) {
    this.setState({ city });
  },

  /** 更新天气信息 */
  updateWeather(weatherData) {
    this.setState({
      weather: weatherData.weather,
      temperature: weatherData.temperature,
      greeting: weatherData.greeting,
    });
  },

  /** 更新主题 */
  updateTheme(theme) {
    this.setState({ theme });
    this.applyTheme(theme);
    // 通知所有页面刷新
    const pages = getCurrentPages();
    pages.forEach(p => {
      if (p.onThemeChange) p.onThemeChange(theme);
    });

  },

  /** 更新背景图 */
  updateBgImage(bgImage) {
    this.setState({ bgImage });
  },

  /** 获取自定义背景列表 */
  getCustomBgs(theme) {
    const state = this.globalData.state;
    const backgrounds = state.backgrounds || {};
    if (!backgrounds[theme]) {
      backgrounds[theme] = { presets: [], custom: [], activeIndex: 0 };
    }
    return backgrounds[theme].custom || [];
  },

  /** 更新闲置天数 */
  updateIdleDays(days) {
    this.setState({ idleDays: days });
  },

  /** 更新衣柜名称 */
  updateWardrobeName(name) {
    this.setState({ wardrobeName: name });
  },

  /** 添加衣柜 */
  addWardrobe(wardrobe) {
    const wardrobes = [...this.globalData.state.wardrobes, wardrobe];
    this.setState({ wardrobes });
  },

  /** 删除衣柜 */
  deleteWardrobe(id) {
    const wardrobes = this.globalData.state.wardrobes.filter(w => w.id !== id);
    this.setState({ wardrobes });
  },

  /** 添加分区 */
  addZone(wardrobeId, zone) {
    const wardrobes = this.globalData.state.wardrobes.map(w => {
      if (w.id !== wardrobeId) return w;
      return { ...w, zones: [...w.zones, zone], zoneCount: w.zoneCount + 1 };
    });
    this.setState({ wardrobes });
  },

  /** 删除分区 */
  deleteZone(wardrobeId, zoneId) {
    const wardrobes = this.globalData.state.wardrobes.map(w => {
      if (w.id !== wardrobeId) return w;
      return { ...w, zones: w.zones.filter(z => z.id !== zoneId), zoneCount: w.zoneCount - 1 };
    });
    this.setState({ wardrobes });
  },

  /** 添加衣物 */
  addClothingItem(item) {
    const clothingItems = [...this.globalData.state.clothingItems, item];
    this.setState({ clothingItems });
  },

  /** 删除衣物 */
  deleteClothingItem(itemId) {
    const clothingItems = this.globalData.state.clothingItems.filter(i => i.id !== itemId);
    this.setState({ clothingItems });
  },

  /** 更新衣物 */
  updateClothingItem(itemId, updates) {
    const clothingItems = this.globalData.state.clothingItems.map(i => {
      if (i.id !== itemId) return i;
      return { ...i, ...updates };
    });
    this.setState({ clothingItems });
  },

  /** 添加日记 */
  addDiaryOutfit(entry) {
    const diaryOutfits = [...this.globalData.state.diaryOutfits, entry];
    this.setState({ diaryOutfits });
  },

  /** 删除日记 */
  deleteDiaryOutfit(entryId) {
    const diaryOutfits = this.globalData.state.diaryOutfits.filter(d => d.id !== entryId);
    this.setState({ diaryOutfits });
  },

  /** 显示 Toast */
  showToast(message, type = 'success') {
    const toastId = Date.now().toString();
    this.globalData.toasts = [...this.globalData.toasts, { id: toastId, message, type }];

    // 通知所有页面
    const pages = getCurrentPages();
    pages.forEach(p => {
      if (p.showPageToast) p.showPageToast(message);
    });

    // 3秒后自动清除
    setTimeout(() => {
      this.globalData.toasts = this.globalData.toasts.filter(t => t.id !== toastId);
    }, 3000);
  },
});
