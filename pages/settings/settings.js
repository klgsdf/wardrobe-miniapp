const app = getApp();
const { THEME_OPTIONS, BG_OPTIONS } = require('../../utils/data');

Page({
  data: {
    __theme: 'cream-morandi',
    city: '广州市',
    theme: 'cream-morandi',
    idleDays: 30,
    bgImage: '/images/bg-cream.jpg',
    themeOptions: THEME_OPTIONS,
    bgOptions: [],
    customBgs: [],
    showThemePicker: false,
    showBgPicker: false,
    showIdlePicker: false,
    idleOptions: [
      { value: 15, label: '15天' },
      { value: 30, label: '30天' },
      { value: 45, label: '45天' },
    ],
    locating: false,
  },
  onLoad() { this.loadState(); },
  onShow() { this.loadState(); },
  loadState() {
    const s = app.getState();
    var themeLabel = '';
    var themeColor = '';
    var colorMap = { 'cream-morandi': '#B08968', 'mint-latte': '#7DB9A8', 'haze-blue': '#8ECAE6', 'graphite-tangerine': '#F97316', 'sakura-pink': '#FFB7C5' };
    themeColor = colorMap[s.theme] || '#B08968';
    for (var i = 0; i < THEME_OPTIONS.length; i++) {
      if (THEME_OPTIONS[i].value === s.theme) { themeLabel = THEME_OPTIONS[i].label; break; }
    }
    // Find current bg label from current theme's bg options
    var bgLabel = '默认背景';
    var currentBgOptions = BG_OPTIONS[s.theme] || [];
    for (var j = 0; j < currentBgOptions.length; j++) {
      if (currentBgOptions[j].image === s.bgImage) { bgLabel = currentBgOptions[j].label; break; }
    }
    // Load custom backgrounds from global state
    var customBgs = s.backgrounds && s.backgrounds[s.theme] ? (s.backgrounds[s.theme].custom || []) : [];
    this.setData({
      __theme: s.theme,
      city: s.city,
      theme: s.theme,
      idleDays: s.idleDays,
      bgImage: s.bgImage || '/images/bg-cream.jpg',
      themeLabel: themeLabel,
      themeColor: themeColor,
      bgLabel: bgLabel,
      bgOptions: currentBgOptions,
      customBgs: customBgs,
    });
  },
  goBack() { wx.navigateBack(); },

  // City
  autoLocateCity() {
    this.setData({ locating: true });
    wx.chooseLocation({
      success: (res) => {
        this.setData({ locating: false });
        const address = res.address || '';
        // 从地址中提取城市，如 "广东省广州市天河区xxx" -> "广州市"
        const cityMatch = address.match(/^.+?(省|自治区|直辖市)(.+?市)/);
        const city = cityMatch ? cityMatch[2] : '';
        if (city) {
          app.updateCity(city);
          this.setData({ city });
          // 城市变更后，通知首页刷新天气
          const pages = getCurrentPages();
          const homePage = pages.find(p => p.route === 'pages/home/home');
          if (homePage && homePage.fetchWeatherData) {
            homePage.fetchWeatherData();
          }
          wx.showToast({ title: '定位成功: ' + city });
        } else {
          wx.showToast({ title: '未获取到城市', icon: 'none' });
        }
      },
      fail: (err) => {
        this.setData({ locating: false });
        const errMsg = err.errMsg || '';
        // 兼容新旧版本权限错误格式
        const isAuthDenied = errMsg.includes('auth') || errMsg.includes('permission');
        const isCancel = errMsg.includes('cancel');
        if (isCancel) {
          // 用户取消，静默处理
        } else if (isAuthDenied) {
          wx.showModal({
            title: '需要位置权限',
            content: '请在设置中开启位置权限以自动定位城市',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            },
          });
        } else {
          wx.showToast({ title: '定位失败', icon: 'none' });
        }
      },
    });
  },

  // Theme
  showThemePicker() { this.setData({ showThemePicker: true }); },
  hideThemePicker() { this.setData({ showThemePicker: false }); },
  selectTheme(e) {
    const theme = e.currentTarget.dataset.theme;
    var themeLabel = '';
    var colorMap = { 'cream-morandi': '#B08968', 'mint-latte': '#7DB9A8', 'haze-blue': '#8ECAE6', 'graphite-tangerine': '#F97316', 'sakura-pink': '#FFB7C5' };
    var themeColor = colorMap[theme] || '#B08968';
    for (var i = 0; i < THEME_OPTIONS.length; i++) {
      if (THEME_OPTIONS[i].value === theme) { themeLabel = THEME_OPTIONS[i].label; break; }
    }
    // Switch to the default background of the new theme
    var newBgOptions = BG_OPTIONS[theme] || [];
    var newBgImage = newBgOptions.length > 0 ? newBgOptions[0].image : '/images/bg-cream.jpg';
    var newBgLabel = newBgOptions.length > 0 ? newBgOptions[0].label : '默认背景';
    // Load custom backgrounds for the new theme
    var newCustomBgs = app.getCustomBgs(theme);
    app.updateTheme(theme);
    app.updateBgImage(newBgImage);
    this.setData({ theme, themeLabel, themeColor, bgImage: newBgImage, bgLabel: newBgLabel, bgOptions: newBgOptions, customBgs: newCustomBgs, showThemePicker: false });
    wx.showToast({ title: '主题已切换' });
  },

  // Background
  showBgPicker() { this.setData({ showBgPicker: true }); },
  hideBgPicker() { this.setData({ showBgPicker: false }); },
  selectBg(e) {
    const image = e.currentTarget.dataset.image;
    const label = e.currentTarget.dataset.label;
    app.updateBgImage(image);
    this.setData({ bgImage: image, bgLabel: label, showBgPicker: false });
    wx.showToast({ title: '背景已切换' });
  },
  addCustomBg() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        // Save to local persistent storage
        const fs = wx.getFileSystemManager();
        const fileName = `custom_bg_${Date.now()}.jpg`;
        const localPath = `${wx.env.USER_DATA_PATH}/${fileName}`;
        fs.saveFile({
          tempFilePath: tempPath,
          filePath: localPath,
          success: () => {
            // Update global state with custom background
            const state = app.getState();
            const theme = state.theme;
            const backgrounds = state.backgrounds || {};
            if (!backgrounds[theme]) {
              backgrounds[theme] = { presets: [], custom: [], activeIndex: 0 };
            }
            backgrounds[theme].custom = backgrounds[theme].custom || [];
            backgrounds[theme].custom.push({ image: localPath, label: '自定义背景' });
            app.setState({ backgrounds });
            // Update UI
            this.setData({ customBgs: backgrounds[theme].custom });
            // Auto-select the new background
            app.updateBgImage(localPath);
            this.setData({ bgImage: localPath, bgLabel: '自定义背景' });
            wx.showToast({ title: '自定义背景已添加' });
          },
          fail: () => {
            wx.showToast({ title: '保存失败', icon: 'none' });
          },
        });
      },
      fail: () => {
        wx.showToast({ title: '选择取消', icon: 'none' });
      },
    });
  },
  deleteCustomBg(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    wx.showModal({
      title: '删除背景',
      content: '确定要删除这张自定义背景吗？',
      confirmColor: '#FF4D4F',
      success: (modalRes) => {
        if (modalRes.confirm) {
          const state = app.getState();
          const theme = state.theme;
          const backgrounds = state.backgrounds || {};
          if (backgrounds[theme] && backgrounds[theme].custom) {
            const deletedBg = backgrounds[theme].custom[index];
            // Remove from array
            backgrounds[theme].custom.splice(index, 1);
            app.setState({ backgrounds });
            // Update UI
            this.setData({ customBgs: backgrounds[theme].custom });
            // If the deleted bg was currently selected, switch to default
            if (deletedBg && this.data.bgImage === deletedBg.image) {
              const defaultBg = BG_OPTIONS[theme] && BG_OPTIONS[theme][0] ? BG_OPTIONS[theme][0].image : '/images/bg-cream.jpg';
              const defaultLabel = BG_OPTIONS[theme] && BG_OPTIONS[theme][0] ? BG_OPTIONS[theme][0].label : '默认背景';
              app.updateBgImage(defaultBg);
              this.setData({ bgImage: defaultBg, bgLabel: defaultLabel });
            }
            wx.showToast({ title: '已删除' });
          }
        }
      },
    });
  },

  // Idle Days
  showIdlePicker() { this.setData({ showIdlePicker: true }); },
  hideIdlePicker() { this.setData({ showIdlePicker: false }); },
  selectIdleDays(e) {
    const days = parseInt(e.currentTarget.dataset.days);
    if (!isNaN(days) && days > 0) {
      app.updateIdleDays(days);
      this.setData({ idleDays: days, showIdlePicker: false });
      wx.showToast({ title: '已更新为 ' + days + ' 天' });
    }
  },

  // Prevent overlay close when tapping sheet content
  preventBubble() { /* do nothing, just catch tap */ },
});
