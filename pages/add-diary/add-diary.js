const app = getApp();
const { STYLE_OPTIONS } = require('../../utils/data');

Page({
  data: {
    __theme: 'cream-morandi',
    photos: [],
    name: '',
    style: '',
    note: '',
    selectedItemIds: [],
    clothingItems: [],
    showItemPicker: false,
    itemSearchQuery: '',
    styleOptions: STYLE_OPTIONS,
    // 辅助数据
    itemPickerList: [],
    selectedItemNames: [],
  },
  onLoad() {
    const s = app.getState();
    this.setData({ __theme: s.theme, clothingItems: s.clothingItems });
    this.computeItemPickerList();
  },

  // ===== 计算辅助数据 =====
  computeItemPickerList() {
    const d = this.data;
    const query = d.itemSearchQuery ? d.itemSearchQuery.toLowerCase() : '';
    let items = d.clothingItems;
    if (query) {
      items = items.filter(function(i) {
        return (i.name && i.name.toLowerCase().indexOf(query) !== -1) ||
               (i.category && i.category.indexOf(query) !== -1) ||
               (i.style && i.style.indexOf(query) !== -1);
      });
    }
    const itemPickerList = items.map(function(i) {
      return {
        id: i.id,
        name: i.name,
        image: i.image,
        category: i.category,
        selected: d.selectedItemIds.indexOf(i.id) !== -1,
      };
    });
    const selectedItems = d.clothingItems.filter(function(i) {
      return d.selectedItemIds.indexOf(i.id) !== -1;
    });
    const selectedItemNames = selectedItems.map(function(i) { return i.name; });
    this.setData({ itemPickerList, selectedItemNames });
  },
  choosePhoto() {
    const remain = 3 - this.data.photos.length;
    if (remain <= 0) { wx.showToast({ title: '最多3张', icon: 'none' }); return; }
    wx.chooseMedia({ count: remain, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: (res) => { const newPhotos = this.data.photos.concat(res.tempFiles.map(f=>f.tempFilePath)); this.setData({ photos: newPhotos }); }
    });
  },
  removePhoto(e) { const idx = e.currentTarget.dataset.idx; const photos = this.data.photos.filter((_,i)=>i!==idx); this.setData({ photos }); },
  onNameInput(e) { this.setData({ name: e.detail.value }); },
  selectStyle(e) { this.setData({ style: e.currentTarget.dataset.s }); },
  onNoteInput(e) { this.setData({ note: e.detail.value }); },
  toggleItemPicker() { this.setData({ showItemPicker: !this.data.showItemPicker, itemSearchQuery: '' }); },
  preventBubble() {
    // 阻止事件冒泡，防止点击弹窗内容时关闭弹窗
  },
  toggleItem(e) {
    const id = e.currentTarget.dataset.id;
    const idx = this.data.selectedItemIds.indexOf(id);
    const selected = idx !== -1 ? this.data.selectedItemIds.slice(0, idx).concat(this.data.selectedItemIds.slice(idx + 1)) : this.data.selectedItemIds.concat([id]);
    this.setData({ selectedItemIds: selected });
    this.computeItemPickerList();
  },
  onItemSearch(e) { this.setData({ itemSearchQuery: e.detail.value }); this.computeItemPickerList(); },
  submit() {
    if (!this.data.name.trim()) { wx.showToast({ title: '请输入名称', icon: 'none' }); return; }
    if (!this.data.style) { wx.showToast({ title: '请选择风格', icon: 'none' }); return; }
    const entry = {
      id: 'd'+Date.now(),
      name: this.data.name.trim(),
      photos: this.data.photos.length ? this.data.photos : ['/images/outfit-thumb-1.jpg'],
      style: this.data.style,
      note: this.data.note.trim(),
      clothingItemIds: this.data.selectedItemIds,
      date: '2026-05-17',
    };
    app.addDiaryOutfit(entry);
    wx.showToast({ title: '保存成功' });
    setTimeout(() => { wx.navigateBack(); }, 800);
  },
  cancel() { wx.navigateBack(); },
});
