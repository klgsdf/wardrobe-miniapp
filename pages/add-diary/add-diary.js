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

    // ===== 图片裁剪数据（复用 add-clothes 逻辑） =====
    showCropper: false,
    cropSrc: '',
    cropContainerW: 0,
    cropContainerH: 0,
    cropFrameW: 0,
    cropFrameH: 0,
    cropFrameX: 0,
    cropFrameY: 0,
    cropImgW: 0,
    cropImgH: 0,
    cropImgX: 0,
    cropImgY: 0,
    cropImgNaturalW: 0,
    cropImgNaturalH: 0,
    isCropping: false,
    cropMode: 'move',
    cropStartX: 0,
    cropStartY: 0,
    cropStartFrameX: 0,
    cropStartFrameY: 0,
    cropStartFrameW: 0,
    cropStartFrameH: 0,
    cropTouchDist: 0,
    cropResizeHandle: '',
    cropResizeEdge: '',
  },
  onLoad() {
    const s = app.getState();
    this.setData({ __theme: s.theme, clothingItems: s.clothingItems });
    this.computeItemPickerList();
  },

  onShow() {
    const s = app.getState();
    if (s.clothingItems !== this.data.clothingItems) {
      this.setData({ clothingItems: s.clothingItems });
      this.computeItemPickerList();
    }
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
        subCategory: i.subCategory || '',
        selected: d.selectedItemIds.indexOf(i.id) !== -1,
      };
    });
    const selectedItems = d.clothingItems.filter(function(i) {
      return d.selectedItemIds.indexOf(i.id) !== -1;
    }).map(function(i) {
      return { id: i.id, name: i.name, category: i.category };
    });
    const selectedItemNames = selectedItems.map(function(i) { return i.name; });
    this.setData({ itemPickerList, selectedItems, selectedItemNames });
  },

  // ===== 图片选择（进入裁剪模式） =====
  choosePhoto() {
    const remain = 3 - this.data.photos.length;
    if (remain <= 0) { wx.showToast({ title: '最多3张', icon: 'none' }); return; }
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (tempFilePath) {
          this.openCropper(tempFilePath);
        }
      },
      fail: (err) => {
        console.log('chooseMedia fail:', err);
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: (res2) => {
            this.openCropper(res2.tempFilePaths[0]);
          },
        });
      },
    });
  },

  // 打开裁剪界面
  openCropper(src) {
    wx.getImageInfo({
      src,
      success: (info) => {
        const sysInfo = wx.getSystemInfoSync();
        const screenW = sysInfo.windowWidth;
        const containerW = screenW - 40;
        const containerH = containerW / (3 / 4);
        const imgRatio = info.width / info.height;
        const containerRatio = containerW / containerH;
        let imgW, imgH, imgX, imgY;
        if (imgRatio > containerRatio) {
          imgW = containerW;
          imgH = imgW / imgRatio;
          imgX = 0;
          imgY = (containerH - imgH) / 2;
        } else {
          imgH = containerH;
          imgW = imgH * imgRatio;
          imgX = (containerW - imgW) / 2;
          imgY = 0;
        }
        const frameW = Math.min(containerW, imgW);
        const frameH = Math.min(containerH, imgH);
        const frameX = imgX > 0 ? imgX : 0;
        const frameY = imgY > 0 ? imgY : 0;
        this.setData({
          showCropper: true,
          cropSrc: src,
          cropContainerW: containerW,
          cropContainerH: containerH,
          cropFrameW: frameW,
          cropFrameH: frameH,
          cropFrameX: frameX,
          cropFrameY: frameY,
          cropImgW: imgW,
          cropImgH: imgH,
          cropImgX: imgX,
          cropImgY: imgY,
          cropImgNaturalW: info.width,
          cropImgNaturalH: info.height,
          isCropping: false,
          cropMode: 'move',
        });
      },
      fail: () => {
        const newPhotos = this.data.photos.concat([src]);
        this.setData({ photos: newPhotos });
      },
    });
  },

  // 裁剪界面触摸开始
  onCropTouchStart(e) {
    const touches = e.touches;
    const d = this.data;
    if (touches.length === 2) {
      const dist = Math.hypot(
        touches[1].clientX - touches[0].clientX,
        touches[1].clientY - touches[0].clientY
      );
      this.setData({
        isCropping: true, cropMode: 'scale', cropTouchDist: dist,
        cropStartFrameW: d.cropFrameW, cropStartFrameH: d.cropFrameH,
        cropStartFrameX: d.cropFrameX, cropStartFrameY: d.cropFrameY,
      });
      return;
    }
    const touch = touches[0];
    const target = e.target;
    const dataset = target ? target.dataset : {};
    const handle = dataset.handle || '';
    const edge = dataset.edge || '';
    if (handle || edge) {
      this.setData({
        isCropping: true, cropMode: 'resize',
        cropResizeHandle: handle, cropResizeEdge: edge,
        cropStartX: touch.clientX, cropStartY: touch.clientY,
        cropStartFrameW: d.cropFrameW, cropStartFrameH: d.cropFrameH,
        cropStartFrameX: d.cropFrameX, cropStartFrameY: d.cropFrameY,
      });
    } else {
      this.setData({
        isCropping: true, cropMode: 'move',
        cropStartX: touch.clientX, cropStartY: touch.clientY,
        cropStartFrameX: d.cropFrameX, cropStartFrameY: d.cropFrameY,
      });
    }
  },

  // 裁剪界面触摸移动
  onCropTouchMove(e) {
    if (!this.data.isCropping) return;
    const d = this.data;
    const touches = e.touches;
    const minFrameW = 80;
    const minFrameH = minFrameW / (3 / 4);
    if (d.cropMode === 'scale' && touches.length === 2) {
      const dist = Math.hypot(
        touches[1].clientX - touches[0].clientX,
        touches[1].clientY - touches[0].clientY
      );
      const ratio = dist / d.cropTouchDist;
      let newW = d.cropStartFrameW * ratio;
      let newH = d.cropStartFrameH * ratio;
      newW = Math.max(minFrameW, Math.min(d.cropContainerW, newW));
      newH = Math.max(minFrameH, Math.min(d.cropContainerH, newH));
      const cx = d.cropStartFrameX + d.cropStartFrameW / 2;
      const cy = d.cropStartFrameY + d.cropStartFrameH / 2;
      let newX = cx - newW / 2;
      let newY = cy - newH / 2;
      newX = Math.max(0, Math.min(d.cropContainerW - newW, newX));
      newY = Math.max(0, Math.min(d.cropContainerH - newH, newY));
      this.setData({ cropFrameW: newW, cropFrameH: newH, cropFrameX: newX, cropFrameY: newY });
    } else if (d.cropMode === 'resize' && touches.length === 1) {
      const touch = touches[0];
      const dx = touch.clientX - d.cropStartX;
      const dy = touch.clientY - d.cropStartY;
      let newX = d.cropStartFrameX, newY = d.cropStartFrameY;
      let newW = d.cropStartFrameW, newH = d.cropStartFrameH;
      const handle = d.cropResizeHandle, edge = d.cropResizeEdge;
      if (handle === 'tl' || edge === 't' || edge === 'l') {
        if (handle === 'tl' || edge === 'l') { newX = d.cropStartFrameX + dx; newW = d.cropStartFrameW - dx; }
        if (handle === 'tl' || edge === 't') { newY = d.cropStartFrameY + dy; newH = d.cropStartFrameH - dy; }
      }
      if (handle === 'tr' || edge === 't' || edge === 'r') {
        if (handle === 'tr' || edge === 'r') { newW = d.cropStartFrameW + dx; }
        if (handle === 'tr' || edge === 't') { newY = d.cropStartFrameY + dy; newH = d.cropStartFrameH - dy; }
      }
      if (handle === 'bl' || edge === 'b' || edge === 'l') {
        if (handle === 'bl' || edge === 'l') { newX = d.cropStartFrameX + dx; newW = d.cropStartFrameW - dx; }
        if (handle === 'bl' || edge === 'b') { newH = d.cropStartFrameH + dy; }
      }
      if (handle === 'br' || edge === 'b' || edge === 'r') {
        if (handle === 'br' || edge === 'r') { newW = d.cropStartFrameW + dx; }
        if (handle === 'br' || edge === 'b') { newH = d.cropStartFrameH + dy; }
      }
      newW = Math.max(minFrameW, Math.min(d.cropContainerW - newX, newW));
      newH = Math.max(minFrameH, Math.min(d.cropContainerH - newY, newH));
      newX = Math.max(0, Math.min(d.cropContainerW - newW, newX));
      newY = Math.max(0, Math.min(d.cropContainerH - newH, newY));
      this.setData({ cropFrameW: newW, cropFrameH: newH, cropFrameX: newX, cropFrameY: newY });
    } else if (d.cropMode === 'move' && touches.length === 1) {
      const touch = touches[0];
      const dx = touch.clientX - d.cropStartX;
      const dy = touch.clientY - d.cropStartY;
      let newX = d.cropStartFrameX + dx;
      let newY = d.cropStartFrameY + dy;
      newX = Math.max(0, Math.min(d.cropContainerW - d.cropFrameW, newX));
      newY = Math.max(0, Math.min(d.cropContainerH - d.cropFrameH, newY));
      this.setData({ cropFrameX: newX, cropFrameY: newY });
    }
  },

  // 裁剪界面触摸结束
  onCropTouchEnd() {
    this.setData({ isCropping: false, cropMode: 'move', cropResizeHandle: '', cropResizeEdge: '' });
  },

  // 确认裁剪
  confirmCrop() {
    const d = this.data;
    const scaleX = d.cropImgNaturalW / d.cropImgW;
    const scaleY = d.cropImgNaturalH / d.cropImgH;
    const srcX = (d.cropFrameX - d.cropImgX) * scaleX;
    const srcY = (d.cropFrameY - d.cropImgY) * scaleY;
    const srcW = d.cropFrameW * scaleX;
    const srcH = d.cropFrameH * scaleY;
    const ctx = wx.createCanvasContext('diaryCropCanvas');
    ctx.drawImage(d.cropSrc, srcX, srcY, srcW, srcH, 0, 0, 300, 400);
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'diaryCropCanvas',
        width: 300, height: 400, destWidth: 300, destHeight: 400,
        success: (res) => {
          const newPhotos = this.data.photos.concat([res.tempFilePath]);
          this.setData({ photos: newPhotos, showCropper: false, cropSrc: '' });
        },
        fail: () => {
          const newPhotos = this.data.photos.concat([d.cropSrc]);
          this.setData({ photos: newPhotos, showCropper: false, cropSrc: '' });
        },
      });
    });
  },

  // 取消裁剪
  cancelCrop() {
    this.setData({ showCropper: false, cropSrc: '' });
  },

  removePhoto(e) { const idx = e.currentTarget.dataset.idx; const photos = this.data.photos.filter((_,i)=>i!==idx); this.setData({ photos }); },
  onNameInput(e) { this.setData({ name: e.detail.value }); },
  selectStyle(e) { this.setData({ style: e.currentTarget.dataset.s }); },
  onNoteInput(e) { this.setData({ note: e.detail.value }); },
  toggleItemPicker() {
    const opening = !this.data.showItemPicker;
    this.setData({ showItemPicker: opening, itemSearchQuery: '' });
    if (opening) { this.computeItemPickerList(); }
  },
  preventBubble() {},
  toggleItem(e) {
    const id = e.currentTarget.dataset.id;
    const idx = this.data.selectedItemIds.indexOf(id);
    const selected = idx !== -1 ? this.data.selectedItemIds.slice(0, idx).concat(this.data.selectedItemIds.slice(idx + 1)) : this.data.selectedItemIds.concat([id]);
    this.setData({ selectedItemIds: selected });
    this.computeItemPickerList();
  },
  onItemSearch(e) { this.setData({ itemSearchQuery: e.detail.value }); this.computeItemPickerList(); },
  removeSelectedItem(e) {
    const id = e.currentTarget.dataset.id;
    const idx = this.data.selectedItemIds.indexOf(id);
    if (idx !== -1) {
      const selected = this.data.selectedItemIds.slice(0, idx).concat(this.data.selectedItemIds.slice(idx + 1));
      this.setData({ selectedItemIds: selected });
      this.computeItemPickerList();
    }
  },
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
