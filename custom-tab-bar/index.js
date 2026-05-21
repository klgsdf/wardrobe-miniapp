// ===== 自定义底部导航栏 =====

Component({
  data: {
    activeIndex: 0,
    __theme: 'cream-morandi',
    navItems: [
      { pagePath: '/pages/home/home', text: '首页', icon: '/images/home.png', iconActive: '/images/home.png' },
      { pagePath: '/pages/closet/closet', text: '衣柜', icon: '/images/layout-grid.png', iconActive: '/images/layout-grid.png' },
      { pagePath: '/pages/clothes/clothes', text: '衣物', icon: '/images/shirt.png', iconActive: '/images/shirt.png' },
      { pagePath: '/pages/diary/diary', text: '日记', icon: '/images/calendar.png', iconActive: '/images/calendar.png' },
    ],
  },

  lifetimes: {
    attached() {
      this.syncTheme();
      this.syncActiveIndex();
    },
  },

  pageLifetimes: {
    show() {
      this.syncTheme();
      this.syncActiveIndex();
    },
  },

  methods: {
    /** 同步当前主题 */
    syncTheme() {
      const app = getApp();
      if (app && app.globalData && app.globalData.state) {
        const theme = app.globalData.state.theme || 'cream-morandi';
        this.setData({ __theme: theme });
      }
    },

    /** 同步当前激活索引 */
    syncActiveIndex() {
      const pages = getCurrentPages();
      if (pages.length === 0) return;
      const currentPath = '/' + pages[pages.length - 1].route;
      const idx = this.data.navItems.findIndex(item => item.pagePath === currentPath);
      if (idx !== -1 && idx !== this.data.activeIndex) {
        this.setData({ activeIndex: idx });
      }
      // 同步主题
      const app = getApp();
      if (app && app.globalData && app.globalData.state) {
        const theme = app.globalData.state.theme || 'cream-morandi';
        if (theme !== this.data.__theme) {
          this.setData({ __theme: theme });
        }
      }
    },

    /** 切换页面 */
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.navItems[index];
      if (!item) return;

      // 更新激活状态
      this.setData({ activeIndex: index });

      // 切换 tab
      wx.switchTab({ url: item.pagePath });
    },

    /** 点击 ADD 按钮 */
    onAddTap() {
      wx.navigateTo({ url: '/pages/add-clothes/add-clothes' });
    },
  },
});
