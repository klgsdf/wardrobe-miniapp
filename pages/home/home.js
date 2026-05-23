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
    userNickname: '用户',
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
    // 详情弹窗相关数据
    showDetailSheet: false,
    detailEntry: null,
    detailItems: [],
    showItemDetailSheet: false,
    detailItem: null,
    detailWardrobeName: '',
    detailZoneName: '',
  },

  onLoad() {
    this.loadState();
    this.fetchWeatherData();
  },

  onShow() {
    this.loadState();
    this.fetchWeatherData();
    this.syncTabBar();
    // 确保下拉菜单在页面重新显示时是收起状态
    this.setData({ showDropdown: false, editingName: false });
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
    // 解析衣柜名称，提取昵称部分
    var rawName = state.wardrobeName || '用户的衣柜';
    var displayName = rawName;
    var nickname = '用户'; // 默认昵称
    
    // 如果衣柜名称包含"的衣柜"，提取前面的部分作为昵称
    if (rawName.indexOf('的衣柜') !== -1) {
      nickname = rawName.replace('的衣柜', '');
      displayName = rawName;
    } else {
      displayName = rawName + '的衣柜';
      nickname = rawName;
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
      userNickname: nickname,
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
      var nickname = name;
      if (name.indexOf('的衣柜') === -1) {
        displayName = name + '的衣柜';
        nickname = name;
      } else {
        nickname = name.replace('的衣柜', '');
      }
      app.updateWardrobeName(displayName);
      this.setData({ wardrobeName: displayName, userNickname: nickname, editingName: false, showDropdown: false });
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
          // 将英文天气描述转换为中文
          const translatedWeather = this.translateWeatherToChinese(weatherText);
          const weatherData = {
            weather: translatedWeather,
            temperature: parseInt(d.temp_C),
            greeting: greeting,
          };
          app.updateWeather(weatherData);
          const info = this.getWeatherInfo(translatedWeather);
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

  /** 将英文天气描述翻译为中文 */
  translateWeatherToChinese(weatherText) {
    if (!weatherText) return '晴天';
    
    const w = weatherText.toLowerCase().trim();
    
    // 晴天相关
    if (w.indexOf('sunny') !== -1 || w.indexOf('clear') !== -1) {
      return '晴天';
    }
    // 少云/晴间多云
    if (w.indexOf('partly cloudy') !== -1) {
      return '晴间多云';
    }
    // 多云
    if (w.indexOf('cloudy') !== -1 || w.indexOf('overcast') !== -1) {
      return '多云';
    }
    // 阴天
    if (w.indexOf('mist') !== -1 || w.indexOf('fog') !== -1) {
      return '雾天';
    }
    // 毛毛雨
    if (w.indexOf('drizzle') !== -1 || w.indexOf('light rain') !== -1) {
      return '毛毛雨';
    }
    // 小雨
    if (w.indexOf('light rain') !== -1 || w.indexOf('patchy rain') !== -1) {
      return '小雨';
    }
    // 中雨
    if (w.indexOf('moderate rain') !== -1 || w.indexOf('rain') !== -1) {
      return '中雨';
    }
    // 大雨/暴雨
    if (w.indexOf('heavy rain') !== -1 || w.indexOf('torrential') !== -1) {
      return '大雨';
    }
    // 雷暴
    if (w.indexOf('thunder') !== -1 || w.indexOf('tstorm') !== -1) {
      return '雷阵雨';
    }
    // 雪
    if (w.indexOf('snow') !== -1 || w.indexOf('blizzard') !== -1) {
      return '雪天';
    }
    // 小雪
    if (w.indexOf('light snow') !== -1) {
      return '小雪';
    }
    // 大雪
    if (w.indexOf('heavy snow') !== -1) {
      return '大雪';
    }
    // 雨夹雪
    if (w.indexOf('sleet') !== -1 || w.indexOf('rain and snow') !== -1) {
      return '雨夹雪';
    }
    // 冰雹
    if (w.indexOf('hail') !== -1 || w.indexOf('ice') !== -1) {
      return '冰雹';
    }
    // 霾
    if (w.indexOf('haze') !== -1 || w.indexOf('smog') !== -1) {
      return '霾';
    }
    // 风
    if (w.indexOf('windy') !== -1 || w.indexOf('breezy') !== -1) {
      return '有风';
    }
    
    // 默认返回晴天
    return '晴天';
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
    return { bg: '/images/weather-sunny.jpg', icon: '/images/cloud.png' };
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

  /** Show diary detail sheet (modal) - 复刻日记页弹窗逻辑 */
  showDiaryDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;

    const state = app.getState();
    const diaries = state.diaryOutfits || [];
    const clothingItems = state.clothingItems || [];
    let entry = diaries.find(d => d.id === id);

    if (!entry) {
      wx.showToast({ title: '未找到穿搭记录', icon: 'none' });
      return;
    }

    // 解析 clothingItemIds 为完整单品对象（与日记页 goToDiaryDetail 一致）
    const items = (entry.clothingItemIds || []).map(cid => {
      return clothingItems.find(c => c.id === cid);
    }).filter(Boolean);

    this.setData({
      detailEntry: entry,
      detailItems: items,
      showDetailSheet: true,
    });
  },

  /** Hide diary detail sheet */
  hideDiaryDetail() {
    this.setData({ showDetailSheet: false });
    setTimeout(() => {
      this.setData({ detailEntry: null, detailItems: [] });
    }, 300);
  },

  /** Edit diary entry - 跳转至编辑页 */
  editDiaryEntry() {
    const entry = this.data.detailEntry;
    if (!entry) return;
    this.hideDiaryDetail();
    wx.navigateTo({ url: `/pages/add-diary/add-diary?id=${entry.id}` });
  },

  /** Delete diary entry */
  deleteDiaryEntry() {
    const entry = this.data.detailEntry;
    if (!entry) return;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这套穿搭记录吗？',
      confirmColor: '#C17C74',
      success: (res) => {
        if (res.confirm) {
          app.deleteDiaryOutfit(entry.id);
          this.hideDiaryDetail();
          this.loadState();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  /** Share diary entry */
  shareDiaryEntry() {
    const entry = this.data.detailEntry;
    if (!entry) return;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
    wx.showToast({ title: '点击右上角分享', icon: 'none' });
  },

  /** Show item detail from diary detail sheet */
  showItemDetailFromSheet(e) {
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

  /** Hide item detail sheet */
  hideItemDetail() {
    this.setData({ showItemDetailSheet: false });
    setTimeout(() => {
      this.setData({ detailItem: null, detailWardrobeName: '', detailZoneName: '' });
    }, 300);
  },

  /** Edit item detail */
  editItemDetail() {
    const item = this.data.detailItem;
    if (!item) return;
    this.hideItemDetail();
    wx.navigateTo({ url: `/pages/add-clothes/add-clothes?id=${item.id}` });
  },

  /** Delete item detail */
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
          // 更新首页数据
          this.loadState();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  /** Prevent event bubbling */
  preventBubble() {
    // 阻止事件冒泡，防止点击弹窗内容时关闭弹窗
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
