const app = getApp();
const { STYLE_OPTIONS, SEASON_OPTIONS, CATEGORY_CONFIG } = require('../../utils/data');

// 色带颜色配置（按视觉图片排列）
const COLOR_RIBBON_FIRST = [
  { color: '#FFFFFF', name: '白色' },
  { color: '#1A1A1A', name: '黑色' },
  { color: '#9E9E9E', name: '灰色' },
  { color: '#8D6E63', name: '棕色' },
  { color: '#F5F5DC', name: '米色' },
  { color: '#EF5350', name: '红色' },
  { color: '#FF9800', name: '橙色' },
  { color: '#FFEB3B', name: '黄色' },
];

const COLOR_RIBBON_SECOND = [
  { color: '#66BB6A', name: '绿色' },
  { color: '#42A5F5', name: '蓝色' },
  { color: '#AB47BC', name: '紫色' },
  { color: '#EC407A', name: '粉色' },
];

// 分类图标映射（使用emoji作为简单图标）
const CATEGORY_ICONS = {
  '上衣': '👕',
  '下装': '👖',
  '全身装': '👗',
  '内衣类': '🧦',
  '配饰服饰': '🧣',
  '鞋类': '👟',
};

Page({
  data: {
    __theme: 'cream-morandi',
    image: '',
    name: '',
    category: '',
    subCategory: '',
    colors: [],
    seasons: [],
    style: '',
    notes: '',
    wardrobeId: '',
    zoneId: '',
    wardrobes: [],

    // 弹窗显示状态
    showCategoryPicker: false,
    showSeasonPicker: false,
    showStylePicker: false,
    showWardrobeModal: false,
    showAiOverlay: false,

    // AI状态
    aiStatus: 'scanning',
    aiResult: { category: '', color: '', style: '' },

    // 选项数据
    styleOptions: STYLE_OPTIONS,
    seasonOptions: SEASON_OPTIONS,
    categoryConfig: CATEGORY_CONFIG,

    // 色带数据
    colorRibbon: [],
    colorRibbonSecond: [],
    selectedColorNames: '',

    // 分类列表（带图标）
    categoryList: [],

    // 季节显示文本
    seasonText: '',

    // 子分类列表（当前选中分类的）
    subCategoryList: [],

    // 季节选中状态（用于WXML渲染）
    seasonCards: [],

    // 衣柜选择步骤
    wardrobeStep: 'wardrobe',
    selectedWardrobeName: '',
    zones: [],
  },

  onLoad() {
    const s = app.getState();
    this.setData({
      __theme: s.theme,
      wardrobes: s.wardrobes,
    });
    this.initData();
  },

  // ===== 初始化数据 =====
  initData() {
    const categoryList = Object.keys(CATEGORY_CONFIG).map(name => ({
      name,
      icon: CATEGORY_ICONS[name] || '👔',
    }));

    const colorRibbon = COLOR_RIBBON_FIRST.map(item => ({
      ...item,
      active: false,
    }));

    const colorRibbonSecond = COLOR_RIBBON_SECOND.map(item => ({
      ...item,
      active: false,
    }));

    this.setData({ categoryList, colorRibbon, colorRibbonSecond });
  },

  // ===== 图片选择 =====
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ image: res.tempFiles[0].tempFilePath });
      },
    });
  },

  // ===== AI 识别 =====
  aiRecognize() {
    if (!this.data.image) {
      wx.showToast({ title: '请先上传图片', icon: 'none' });
      return;
    }
    this.setData({
      showAiOverlay: true,
      aiStatus: 'scanning',
      aiResult: { category: '', color: '', style: '' },
    });

    setTimeout(() => {
      this.setData({ aiResult: { category: '上衣', color: '蓝色系', style: '' } });
    }, 600);
    setTimeout(() => {
      this.setData({ aiResult: { category: '上衣', color: '蓝色系', style: '休闲' } });
    }, 1200);

    setTimeout(() => {
      this.setData({ aiStatus: 'success' });
      setTimeout(() => {
        this.setData({
          showAiOverlay: false,
          name: 'AI识别-时尚单品',
          category: '上衣',
          subCategory: 'T恤',
          colors: ['#42A5F5'],
          seasons: ['春', '夏'],
          style: '休闲',
        });
        this.updateColorRibbon();
        this.updateSeasonData();
        wx.showToast({ title: 'AI识别成功' });
      }, 1200);
    }, 3000);
  },

  // ===== 名称输入 =====
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  // ===== 备注输入 =====
  onNotesInput(e) {
    this.setData({ notes: e.detail.value });
  },

  // ===== 分类选择 =====
  showCategoryPicker() {
    this.setData({ showCategoryPicker: true });
  },
  hideCategoryPicker() {
    this.setData({ showCategoryPicker: false });
  },
  selectCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    const subCategoryList = CATEGORY_CONFIG[cat] ? CATEGORY_CONFIG[cat].subCategories : [];
    this.setData({
      category: cat,
      subCategory: '',
      subCategoryList,
      showCategoryPicker: false,
    });
  },
  selectSubCategory(e) {
    const sub = e.currentTarget.dataset.sub;
    this.setData({ subCategory: sub });
  },

  // ===== 季节选择 =====
  showSeasonPicker() {
    this.setData({ showSeasonPicker: true });
  },
  hideSeasonPicker() {
    this.setData({ showSeasonPicker: false });
  },
  toggleSeason(e) {
    const s = e.currentTarget.dataset.s;
    const idx = this.data.seasons.indexOf(s);
    const seasons = idx !== -1
      ? this.data.seasons.slice(0, idx).concat(this.data.seasons.slice(idx + 1))
      : this.data.seasons.concat([s]);
    this.setData({ seasons });
    this.updateSeasonData();
  },
  updateSeasonData() {
    const d = this.data;
    const seasonText = d.seasons.join('、') || '';
    const seasonCards = SEASON_OPTIONS.map(s => ({
      name: s,
      active: d.seasons.indexOf(s) !== -1,
    }));
    this.setData({ seasonText, seasonCards });
  },

  // ===== 风格选择 =====
  showStylePicker() {
    this.setData({ showStylePicker: true });
  },
  hideStylePicker() {
    this.setData({ showStylePicker: false });
  },
  selectStyle(e) {
    const s = e.currentTarget.dataset.s;
    this.setData({ style: s, showStylePicker: false });
  },

  // ===== 颜色选择（色带模式） =====
  toggleColor(e) {
    const c = e.currentTarget.dataset.c;
    const idx = this.data.colors.indexOf(c);
    const colors = idx !== -1
      ? this.data.colors.slice(0, idx).concat(this.data.colors.slice(idx + 1))
      : this.data.colors.concat([c]);
    this.setData({ colors });
    this.updateColorRibbon();
  },
  updateColorRibbon() {
    const d = this.data;
    const allColors = [...COLOR_RIBBON_FIRST, ...COLOR_RIBBON_SECOND];
    const colorMap = {};
    allColors.forEach(item => { colorMap[item.color] = item.name; });

    const colorRibbon = COLOR_RIBBON_FIRST.map(item => ({
      ...item,
      active: d.colors.indexOf(item.color) !== -1,
    }));
    const colorRibbonSecond = COLOR_RIBBON_SECOND.map(item => ({
      ...item,
      active: d.colors.indexOf(item.color) !== -1,
    }));

    const selectedNames = d.colors.map(c => colorMap[c] || c).filter(Boolean);
    const selectedColorNames = selectedNames.length ? selectedNames.join('、') : '';

    this.setData({ colorRibbon, colorRibbonSecond, selectedColorNames });
  },

  // ===== 确认按钮点击 -> 弹出衣柜选择 =====
  onConfirmTap() {
    if (!this.data.name.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }
    if (!this.data.category) {
      wx.showToast({ title: '请选择种类', icon: 'none' });
      return;
    }
    if (!this.data.style) {
      wx.showToast({ title: '请选择风格', icon: 'none' });
      return;
    }

    // 打开衣柜选择弹窗
    this.setData({
      showWardrobeModal: true,
      wardrobeStep: 'wardrobe',
      wardrobeId: '',
      zoneId: '',
    });
  },

  // ===== 衣柜选择弹窗 =====
  hideWardrobeModal() {
    this.setData({ showWardrobeModal: false });
  },
  selectWardrobe(e) {
    const id = e.currentTarget.dataset.id;
    const w = this.data.wardrobes.find(x => x.id === id);
    if (!w) return;

    // 如果该衣柜没有分区，直接选中
    if (!w.zones || w.zones.length === 0) {
      this.setData({
        wardrobeId: id,
        zoneId: '',
        selectedWardrobeName: w.name,
      });
      return;
    }

    // 有分区则进入分区选择
    this.setData({
      wardrobeId: id,
      selectedWardrobeName: w.name,
      zones: w.zones || [],
      wardrobeStep: 'zone',
    });
  },
  backToWardrobe() {
    this.setData({
      wardrobeStep: 'wardrobe',
      zoneId: '',
    });
  },
  selectZone(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ zoneId: id });
  },

  // ===== 最终提交 =====
  finalSubmit() {
    if (!this.data.wardrobeId) {
      wx.showToast({ title: '请选择衣柜', icon: 'none' });
      return;
    }

    const item = {
      id: 'c' + Date.now(),
      name: this.data.name.trim(),
      image: this.data.image || '/images/cloth-1.jpg',
      category: this.data.category,
      subCategory: this.data.subCategory || this.data.category,
      colors: this.data.colors.length ? this.data.colors : ['#808080'],
      seasons: this.data.seasons.length ? this.data.seasons : ['春'],
      style: this.data.style,
      notes: this.data.notes,
      zoneId: this.data.zoneId || '',
      wardrobeId: this.data.wardrobeId,
    };

    app.addClothingItem(item);
    this.setData({ showWardrobeModal: false });
    wx.showToast({ title: '添加成功' });
    setTimeout(() => {
      wx.navigateBack();
    }, 800);
  },

  // ===== 取消 =====
  cancel() {
    wx.navigateBack();
  },

  // ===== 阻止冒泡 =====
  preventBubble() {
    // 什么都不做，只是阻止事件冒泡
  },
});
