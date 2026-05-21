const app = getApp();
const { STYLE_OPTIONS } = require('../../utils/data');

Page({
  data: {
    __theme: 'cream-morandi',
    wardrobeName: '',
    outfitCount: 0,
    monthlyWorn: 0,
    idleCount: 0,
    temperature: 24,
    weather: '小毛毛雨',
    greeting: '晚上好,',
    userNickname: '胖胖子',
    city: '广州市',
    diaryOutfits: [],
    clothingItems: [],
    showDropdown: false,
    wardrobes: [],
    editingName: false,
    editNameValue: '',
    activeNavIndex: 0,
    isLightBgTheme: true,
    bgImage: '/images/bg-cream.jpg',
    safeTop: 44,
    weatherBg: '/images/weather-rain.jpg',
  },

  onLoad() {
    this.loadState();
    this.fetchWeatherData();
  },

  onShow() {
    this.loadState();
    this.fetchWeatherData();
    this.syncTabBar();
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ activeIndex: 0 });
      const theme = this.data.__theme || 'cream-morandi';
      this.getTabBar().setData({ __theme: theme });
    }
  },

  loadState() {
    const state = app.getState();
    const theme = state.theme || 'cream-morandi';
    const isLightBg = theme === 'cream-morandi' || theme === 'sakura-pink' || theme === 'mint-latte' || theme === 'haze-blue';
    // 根据天气状态选择天气卡片背景图和图标
    const weatherInfo = this.getWeatherInfo(state.weather || '');
    const sysInfo = wx.getSystemInfoSync();
    // 解析衣柜名称，如果包含"的衣柜"则提取前缀
    var rawName = state.wardrobeName || '胖胖子的衣柜';
    var displayName = rawName;
    if (rawName.indexOf('的衣柜') === rawName.length - 3) {
      displayName = rawName;
    } else if (rawName.indexOf('的衣柜') === -1) {
      displayName = rawName + '的衣柜';
    }
    this.setData({
      __theme: theme,
      wardrobeName: displayName,
      outfitCount: state.outfitCount || 5,
      monthlyWorn: state.monthlyWorn || 4,
      idleCount: state.idleCount || 1,
      temperature: state.temperature || 24,
      weather: state.weather || '小毛毛雨',
      greeting: state.greeting || '晚上好,',
      userNickname: state.userNickname || '胖胖子',
      city: state.city || '广州市',
      diaryOutfits: this.enrichDiaryOutfits(state.diaryOutfits || [], state.clothingItems || []),
      clothingItems: state.clothingItems || [],
      wardrobes: state.wardrobes || [],
      isLightBgTheme: isLightBg,
      bgImage: state.bgImage || '/images/bg-cream.jpg',
      safeTop: sysInfo.statusBarHeight + 4,
      weatherBg: weatherInfo.bg,
      weatherIcon: weatherInfo.icon,
    });
  },

  onThemeChange(theme) {
    const isLightBg = theme === 'cream-morandi' || theme === 'sakura-pink' || theme === 'mint-latte' || theme === 'haze-blue';
    this.setData({ __theme: theme, isLightBgTheme: isLightBg });
  },

  /** Toggle wardrobe dropdown */
  toggleDropdown() {
    this.setData({ showDropdown: !this.data.showDropdown, editingName: false });
  },

  /** Close dropdown */
  closeDropdown() {
    this.setData({ showDropdown: false, editingName: false });
  },

  /** Start editing wardrobe name */
  startEditName() {
    this.setData({ editingName: true, editNameValue: this.data.wardrobeName });
  },

  /** Name input changed */
  onNameInput(e) {
    this.setData({ editNameValue: e.detail.value });
  },

  /** Confirm rename */
  confirmRename() {
    const name = this.data.editNameValue.trim();
    if (name) {
      var displayName = name;
      if (name.indexOf('的衣柜') === -1) {
        displayName = name + '的衣柜';
      }
      app.updateWardrobeName(displayName);
      this.setData({ wardrobeName: displayName, editingName: false });
    }
  },

  /** Cancel rename */
  cancelRename() {
    this.setData({ editingName: false });
  },

  /** Tap on page background to close dropdown */
  onPageTap() {
    if (this.data.showDropdown) {
      this.setData({ showDropdown: false, editingName: false });
    }
  },

  /** Tap on header area, prevent bubbling */
  onHeaderTap() {
    // do nothing, just prevent bubbling
  },

  /** Tap on dropdown menu, prevent bubbling */
  onDropdownTap() {
    // do nothing, just prevent bubbling
  },

  /** Enrich diary outfits with clothing item names */
  enrichDiaryOutfits(diaryOutfits, clothingItems) {
    return diaryOutfits.map(outfit => {
      var names = [];
      if (outfit.clothingItemIds && outfit.clothingItemIds.length > 0) {
        for (var i = 0; i < outfit.clothingItemIds.length; i++) {
          var itemId = outfit.clothingItemIds[i];
          for (var j = 0; j < clothingItems.length; j++) {
            if (clothingItems[j].id === itemId) {
              names.push(clothingItems[j].name);
              break;
            }
          }
        }
      }
      return Object.assign({}, outfit, {
        clothingItemNames: names.join('、')
      });
    }).reverse();
  },

  /** 手动刷新天气 */
  refreshWeather() {
    this.setData({ weatherLoading: true });
    this.fetchWeatherData();
    setTimeout(() => {
      this.setData({ weatherLoading: false });
    }, 1000);
  },

  /** 获取实时天气数据（使用 wttr.in，零注册无 Key） */
  fetchWeatherData() {
    const state = app.getState();
    const city = state.city || '广州市';
    // 根据当前时间生成问候语
    const hour = new Date().getHours();
    var greeting = '晚上好,';
    if (hour >= 5 && hour < 12) greeting = '早上好,';
    else if (hour >= 12 && hour < 18) greeting = '下午好,';

    this.setData({ weatherLoading: true });
    // 调用 wttr.in 获取天气（零注册、无 Key、永久免费）
    wx.request({
      url: `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
      timeout: 10000,
      success: (res) => {
        if (res.data && res.data.current_condition && res.data.current_condition[0]) {
          const d = res.data.current_condition[0];
          const area = res.data.nearest_area && res.data.nearest_area[0];
          const weatherText = d.weatherDesc && d.weatherDesc[0] ? d.weatherDesc[0].value : '';
          const weatherData = {
            weather: weatherText,
            temperature: parseInt(d.temp_C),
            greeting: greeting,
          };
          app.updateWeather(weatherData);
          const info = this.getWeatherInfo(weatherText);
          this.setData({
            weather: weatherData.weather,
            temperature: weatherData.temperature,
            greeting: weatherData.greeting,
            weatherBg: info.bg,
            weatherIcon: info.icon,
            weatherLoading: false,
          });
        } else {
          this.setData({ greeting, weatherLoading: false });
        }
      },
      fail: () => {
        // API 调用失败时仅更新问候语，保持原有天气数据
        this.setData({ greeting, weatherLoading: false });
      },
    });
  },

  /** Get weather background image and icon based on weather text */
  getWeatherInfo(weatherText) {
    const w = (weatherText || this.data.weather || '').toLowerCase();
    // 雨天
    if (w.indexOf('雨') !== -1 || w.indexOf('rain') !== -1 || w.indexOf('drizzle') !== -1 || w.indexOf('阵雨') !== -1 || w.indexOf('小雨') !== -1 || w.indexOf('大雨') !== -1 || w.indexOf('毛毛雨') !== -1) {
      return { bg: '/images/weather-rain.jpg', icon: '/images/cloud.png' };
    }
    // 多云 / 阴天
    if (w.indexOf('云') !== -1 || w.indexOf('cloud') !== -1 || w.indexOf('阴') !== -1 || w.indexOf('overcast') !== -1 || w.indexOf('多云') !== -1) {
      return { bg: '/images/weather-cloudy.jpg', icon: '/images/cloud.png' };
    }
    // 雪天
    if (w.indexOf('雪') !== -1 || w.indexOf('snow') !== -1 || w.indexOf('blizzard') !== -1) {
      return { bg: '/images/weather-rain.jpg', icon: '/images/cloud.png' };
    }
    // 雾 / 霾
    if (w.indexOf('雾') !== -1 || w.indexOf('fog') !== -1 || w.indexOf('haze') !== -1 || w.indexOf('霾') !== -1 || w.indexOf('mist') !== -1) {
      return { bg: '/images/weather-cloudy.jpg', icon: '/images/cloud.png' };
    }
    // 雷暴
    if (w.indexOf('雷') !== -1 || w.indexOf('thunder') !== -1 || w.indexOf('storm') !== -1 || w.indexOf('暴风') !== -1) {
      return { bg: '/images/weather-rain.jpg', icon: '/images/cloud.png' };
    }
    // 晴天（默认）
    return { bg: '/images/weather-sunny.jpg', icon: '/images/home.png' };
  },

  /** Navigate to diary page */
  goToDiary() {
    wx.switchTab({ url: '/pages/diary/diary' });
  },

  /** Navigate to diary detail */
  goToDiaryDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/diary-detail/diary-detail?id=${id}` });
  },

  /** Navigate to AI outfit page */
  goToAIOutfit() {
    wx.navigateTo({ url: '/pages/ai-outfit/ai-outfit' });
  },

  /** Navigate to settings */
  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

});
