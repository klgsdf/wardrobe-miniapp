const app = getApp();
const WEEKDAYS = ['日','一','二','三','四','五','六'];

Page({
  data: {
    __theme: 'cream-morandi',
    weekdays: WEEKDAYS,
    currentMonth: { year: 2026, month: 5, monthName: '2026年 5月' },
    selectedDate: '2026-05-17',
    calendarDays: [],
    todayEntries: [],
    diaryOutfits: [],
    clothingItems: [],
    showDetailModal: false,
    modalEntry: null,
    modalItems: [],
    showItemDetailSheet: false,
    detailItem: null,
    detailWardrobeName: '',
    detailZoneName: '',
  },

  onLoad() {
    this.loadState();
    this.buildCalendar();
  },

  onShow() {
    this.loadState();
    this.buildCalendar();
    this.syncTabBar();
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ activeIndex: 3 });
      const theme = this.data.__theme || 'cream-morandi';
      this.getTabBar().setData({ __theme: theme });
    }
  },

  onThemeChange(theme) {
    this.setData({ __theme: theme });
  },

  loadState() {
    const s = app.getState();
    this.setData({
      __theme: s.theme,
      diaryOutfits: s.diaryOutfits || [],
      clothingItems: s.clothingItems || [],
    });
  },

  buildCalendar() {
    const { year, month } = this.data.currentMonth;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0 });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr: ds,
        isToday: ds === '2026-05-17',
        hasEntry: this.data.diaryOutfits.some(e => e.date === ds),
      });
    }

    this.setData({ calendarDays: days });
    this.filterEntries();
  },

  filterEntries() {
    const entries = this.data.diaryOutfits.filter(e => e.date === this.data.selectedDate);
    // 为每个条目补充关联的衣物信息
    const enrichedEntries = entries.map(entry => {
      const relatedItems = (entry.clothingItemIds || []).map(id => {
        return this.data.clothingItems.find(c => c.id === id);
      }).filter(Boolean);
      return { ...entry, relatedItems };
    });
    this.setData({ todayEntries: enrichedEntries });
  },

  selectDate(e) {
    const day = e.currentTarget.dataset.day;
    if (day <= 0) return;
    this.setData({ selectedDate: e.currentTarget.dataset.date });
    this.filterEntries();
  },

  prevMonth() {
    const m = this.data.currentMonth;
    const d = new Date(m.year, m.month - 2, 1);
    this.setData({
      currentMonth: {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        monthName: d.getFullYear() + '年 ' + (d.getMonth() + 1) + '月',
      },
    });
    this.buildCalendar();
  },

  nextMonth() {
    const m = this.data.currentMonth;
    const d = new Date(m.year, m.month, 1);
    this.setData({
      currentMonth: {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        monthName: d.getFullYear() + '年 ' + (d.getMonth() + 1) + '月',
      },
    });
    this.buildCalendar();
  },

  deleteEntry(e) {
    // 阻止事件冒泡，避免触发卡片点击
    e.stopPropagation && e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: (res) => {
        if (res.confirm) {
          app.deleteDiaryOutfit(id);
          this.loadState();
          this.buildCalendar();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  goToAddDiary() {
    wx.navigateTo({ url: '/pages/add-diary/add-diary' });
  },

  goToDiaryDetail(e) {
    const id = e.currentTarget.dataset.id;
    const entry = this.data.todayEntries.find(item => item.id === id);
    if (!entry) return;
    const items = (entry.clothingItemIds || []).map(cid => {
      return this.data.clothingItems.find(c => c.id === cid);
    }).filter(Boolean);
    this.setData({
      showDetailModal: true,
      modalEntry: entry,
      modalItems: items,
    });
  },

  closeDetailModal() {
    this.setData({ showDetailModal: false, modalEntry: null, modalItems: [] });
  },

  editModalEntry() {
    const entry = this.data.modalEntry;
    if (!entry) return;
    this.closeDetailModal();
    wx.navigateTo({ url: `/pages/add-diary/add-diary?id=${entry.id}` });
  },

  shareEntry() {
    const entry = this.data.modalEntry;
    if (!entry) return;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
    wx.showToast({ title: '点击右上角分享', icon: 'none' });
  },

  deleteModalEntry() {
    const entry = this.data.modalEntry;
    if (!entry) return;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这套穿搭记录吗？',
      confirmColor: '#C17C74',
      success: (res) => {
        if (res.confirm) {
          app.deleteDiaryOutfit(entry.id);
          this.closeDetailModal();
          this.loadState();
          this.buildCalendar();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
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
          this.loadState();
          this.buildCalendar();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  preventBubble() {
    // 阻止事件冒泡，防止点击弹窗内容时关闭弹窗
  },
});
