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

// 常用颜色调色板
const QUICK_PALETTE = [
  '#FFFFFF', '#1A1A1A', '#9E9E9E', '#F5F5DC',
  '#EF5350', '#FF9800', '#FFEB3B', '#66BB6A',
  '#42A5F5', '#1976D2', '#AB47BC', '#EC407A',
  '#00BCD4', '#795548', '#607D8B', '#8D6E63',
];

// 季节颜色配置
const SEASON_COLORS = {
  '春': { bg: '#E8F5E9', activeBg: '#66BB6A', activeShadow: 'rgba(102, 187, 106, 0.3)', text: '#2E7D32' },
  '夏': { bg: '#FFF3E0', activeBg: '#FF9800', activeShadow: 'rgba(255, 152, 0, 0.3)', text: '#EF6C00' },
  '秋': { bg: '#FFF8E1', activeBg: '#FF8F00', activeShadow: 'rgba(255, 143, 0, 0.3)', text: '#E65100' },
  '冬': { bg: '#E3F2FD', activeBg: '#42A5F5', activeShadow: 'rgba(66, 165, 245, 0.3)', text: '#1565C0' },
};

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
    showColorPicker: false,
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

    // 颜色选择器弹窗数据
    pickerColor: '#00BCD4',
    pickerPureColor: '#00BCD4',
    pickerColorName: '青色',
    pickerHex: '00BCD4',
    pickerR: 0,
    pickerG: 188,
    pickerB: 212,
    hueThumbLeft: 50,
    pickerThumbX: 50,
    pickerThumbY: 30,
    pickerHue: 186,
    pickerSaturation: 1,
    pickerValue: 1,

    // 图片裁剪数据
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

    // 分类列表（带图标）
    categoryList: [],

    // 子分类列表（当前选中分类的）
    subCategoryList: [],

    // 季节选中状态（用于WXML渲染）
    seasonCards: [],

    // 衣柜选择步骤
    wardrobeStep: 'wardrobe',
    selectedWardrobeName: '',
    zones: [],

    // 提交按钮状态
    canSubmit: false,
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

    const seasonCards = SEASON_OPTIONS.map(s => {
      const config = SEASON_COLORS[s];
      return {
        name: s,
        active: false,
        bg: config.bg,
        shadow: 'transparent',
        text: config.text,
      };
    });

    this.setData({
      categoryList,
      colorRibbon,
      colorRibbonSecond,
      seasonCards,
    });
    this.initColorBlocks();
  },

  // ===== 更新提交按钮状态 =====
  updateSubmitState() {
    const d = this.data;
    const canSubmit = !!(d.name.trim() && d.category && d.style);
    this.setData({ canSubmit });
  },

  // ===== 图片选择（进入裁剪模式） =====
  chooseImage() {
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

  // 打开裁剪界面（边框可缩放+移动模式）
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
        }, () => {
          console.log('Cropper opened:', {
            containerW, containerH, imgW, imgH, imgX, imgY,
            frameW, frameH, frameX, frameY
          });
        });
      },
      fail: () => {
        this.setData({ image: src });
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
        isCropping: true,
        cropMode: 'scale',
        cropTouchDist: dist,
        cropStartFrameW: d.cropFrameW,
        cropStartFrameH: d.cropFrameH,
        cropStartFrameX: d.cropFrameX,
        cropStartFrameY: d.cropFrameY,
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
        isCropping: true,
        cropMode: 'resize',
        cropResizeHandle: handle,
        cropResizeEdge: edge,
        cropStartX: touch.clientX,
        cropStartY: touch.clientY,
        cropStartFrameW: d.cropFrameW,
        cropStartFrameH: d.cropFrameH,
        cropStartFrameX: d.cropFrameX,
        cropStartFrameY: d.cropFrameY,
      });
    } else {
      this.setData({
        isCropping: true,
        cropMode: 'move',
        cropStartX: touch.clientX,
        cropStartY: touch.clientY,
        cropStartFrameX: d.cropFrameX,
        cropStartFrameY: d.cropFrameY,
      });
    }
  },

  // 裁剪界面触摸移动（移动、缩放或调整边框）
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
      this.setData({
        cropFrameW: newW,
        cropFrameH: newH,
        cropFrameX: newX,
        cropFrameY: newY,
      });
    } else if (d.cropMode === 'resize' && touches.length === 1) {
      const touch = touches[0];
      const dx = touch.clientX - d.cropStartX;
      const dy = touch.clientY - d.cropStartY;
      let newX = d.cropStartFrameX;
      let newY = d.cropStartFrameY;
      let newW = d.cropStartFrameW;
      let newH = d.cropStartFrameH;
      const handle = d.cropResizeHandle;
      const edge = d.cropResizeEdge;
      if (handle === 'tl' || edge === 't' || edge === 'l') {
        if (handle === 'tl' || edge === 'l') {
          newX = d.cropStartFrameX + dx;
          newW = d.cropStartFrameW - dx;
        }
        if (handle === 'tl' || edge === 't') {
          newY = d.cropStartFrameY + dy;
          newH = d.cropStartFrameH - dy;
        }
      }
      if (handle === 'tr' || edge === 't' || edge === 'r') {
        if (handle === 'tr' || edge === 'r') {
          newW = d.cropStartFrameW + dx;
        }
        if (handle === 'tr' || edge === 't') {
          newY = d.cropStartFrameY + dy;
          newH = d.cropStartFrameH - dy;
        }
      }
      if (handle === 'bl' || edge === 'b' || edge === 'l') {
        if (handle === 'bl' || edge === 'l') {
          newX = d.cropStartFrameX + dx;
          newW = d.cropStartFrameW - dx;
        }
        if (handle === 'bl' || edge === 'b') {
          newH = d.cropStartFrameH + dy;
        }
      }
      if (handle === 'br' || edge === 'b' || edge === 'r') {
        if (handle === 'br' || edge === 'r') {
          newW = d.cropStartFrameW + dx;
        }
        if (handle === 'br' || edge === 'b') {
          newH = d.cropStartFrameH + dy;
        }
      }
      newW = Math.max(minFrameW, Math.min(d.cropContainerW - newX, newW));
      newH = Math.max(minFrameH, Math.min(d.cropContainerH - newY, newH));
      newX = Math.max(0, Math.min(d.cropContainerW - newW, newX));
      newY = Math.max(0, Math.min(d.cropContainerH - newH, newY));
      this.setData({
        cropFrameW: newW,
        cropFrameH: newH,
        cropFrameX: newX,
        cropFrameY: newY,
      });
    } else if (d.cropMode === 'move' && touches.length === 1) {
      const touch = touches[0];
      const dx = touch.clientX - d.cropStartX;
      const dy = touch.clientY - d.cropStartY;
      let newX = d.cropStartFrameX + dx;
      let newY = d.cropStartFrameY + dy;
      newX = Math.max(0, Math.min(d.cropContainerW - d.cropFrameW, newX));
      newY = Math.max(0, Math.min(d.cropContainerH - d.cropFrameH, newY));
      this.setData({
        cropFrameX: newX,
        cropFrameY: newY,
      });
    }
  },

  // 裁剪界面触摸结束
  onCropTouchEnd() {
    this.setData({ isCropping: false, cropMode: 'move', cropResizeHandle: '', cropResizeEdge: '' });
  },

  // 确认裁剪
  confirmCrop() {
    const d = this.data;
    // 使用 原始尺寸/显示尺寸 作为缩放因子，正确映射显示坐标到原始图片像素坐标
    const scaleX = d.cropImgNaturalW / d.cropImgW;
    const scaleY = d.cropImgNaturalH / d.cropImgH;
    const srcX = (d.cropFrameX - d.cropImgX) * scaleX;
    const srcY = (d.cropFrameY - d.cropImgY) * scaleY;
    const srcW = d.cropFrameW * scaleX;
    const srcH = d.cropFrameH * scaleY;
    const ctx = wx.createCanvasContext('cropCanvas');
    ctx.drawImage(d.cropSrc, srcX, srcY, srcW, srcH, 0, 0, 300, 400);
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'cropCanvas',
        width: 300,
        height: 400,
        destWidth: 300,
        destHeight: 400,
        success: (res) => {
          this.setData({
            image: res.tempFilePath,
            showCropper: false,
            cropSrc: '',
          });
        },
        fail: () => {
          this.setData({
            image: d.cropSrc,
            showCropper: false,
            cropSrc: '',
          });
        },
      });
    });
  },

  // 取消裁剪
  cancelCrop() {
    this.setData({
      showCropper: false,
      cropSrc: '',
    });
  },

  // ===== AI 识别（智谱 GLM-4V-Flash） =====
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

    // 1. 将图片转为 base64
    this._imageToBase64(this.data.image)
      .then(base64Data => {
        // 更新 AI 界面状态
        this.setData({
          aiResult: { category: '分析中...', color: '', style: '' },
        });
        return this._callZhipuVisionAPI(base64Data);
      })
      .then(result => {
        // 2. 逐步展示识别结果
        if (result.category) {
          this.setData({ aiResult: { ...this.data.aiResult, category: result.category } });
        }
        return new Promise(resolve => {
          setTimeout(() => {
            if (result.color) {
              this.setData({ aiResult: { ...this.data.aiResult, color: result.color } });
            }
            setTimeout(() => {
              if (result.style) {
                this.setData({ aiResult: { ...this.data.aiResult, style: result.style } });
              }
              resolve(result);
            }, 600);
          }, 600);
        });
      })
      .then(result => {
        // 3. 显示成功状态并应用结果
        this.setData({ aiStatus: 'success' });
        setTimeout(() => {
          this._applyAIResult(result);
        }, 1200);
      })
      .catch(err => {
        console.error('AI识别失败:', err);
        this.setData({ showAiOverlay: false });
        wx.showToast({ title: 'AI识别失败，请重试', icon: 'none' });
      });
  },

  /** 将本地图片路径转为 base64 字符串 */
  _imageToBase64(filePath) {
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager();
      fs.readFile({
        filePath,
        encoding: 'base64',
        success: (res) => {
          resolve(res.data);
        },
        fail: (err) => {
          console.error('读取图片失败:', err);
          reject(new Error('图片读取失败'));
        },
      });
    });
  },

  /** 调用智谱 GLM-4V-Flash 视觉模型识别衣物 */
  _callZhipuVisionAPI(base64Data) {
    const categories = Object.keys(CATEGORY_CONFIG).join('、');
    const styles = STYLE_OPTIONS.join('、');

    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 170679af4ee84c7babed1e641603fcc9.ZRcKuJPAiRI2bWk2',
        },
        data: {
          model: 'glm-4v-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Data}`,
                  },
                },
                {
                  type: 'text',
                  text: `请分析这张衣物图片，返回一个严格的JSON对象（不要包含任何其他文字或markdown标记），包含以下字段：\n- name: 给这件衣物起一个简短的中文名称（2-6个字）\n- category: 衣物种类，必须从以下选项中选择一个：${categories}\n- color: 衣物主要颜色中文名称，如"蓝色"、"白色"、"黑色"、"粉色"、"灰色"等\n- style: 衣物风格，必须从以下选项中选择一个：${styles}\n- season: 适合穿着的季节，从["春","夏","秋","冬"]中选择，用数组返回`,
                },
              ],
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices.length > 0) {
            const content = res.data.choices[0].message.content;
            console.log('智谱AI原始返回:', content);
            try {
              // 从返回内容中提取 JSON
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                resolve(parsed);
              } else {
                reject(new Error('无法从AI返回中提取JSON'));
              }
            } catch (e) {
              reject(new Error('解析AI结果失败: ' + e.message));
            }
          } else {
            console.error('API返回异常:', res);
            reject(new Error('API请求失败，状态码: ' + (res.statusCode || '未知')));
          }
        },
        fail: (err) => {
          console.error('API请求失败:', err);
          reject(new Error('网络请求失败，请检查网络设置'));
        },
      });
    });
  },

  /** 将AI识别结果应用到表单字段 */
  _applyAIResult(result) {
    // 颜色名称 → 十六进制映射表
    const colorNameToHex = {
      '白色': '#FFFFFF', '黑色': '#1A1A1A', '灰色': '#9E9E9E',
      '棕色': '#8D6E63', '米色': '#F5F5DC', '红色': '#EF5350',
      '橙色': '#FF9800', '黄色': '#FFEB3B', '绿色': '#66BB6A',
      '蓝色': '#42A5F5', '紫色': '#AB47BC', '粉色': '#EC407A',
      '深蓝': '#1976D2', '深灰': '#607D8B', '青色': '#00BCD4',
    };

    // 匹配颜色
    const colorHex = this._matchColorToHex(result.color, colorNameToHex);
    const colors = colorHex ? [colorHex] : [];

    // 匹配季节
    let seasons = [];
    if (Array.isArray(result.season)) {
      seasons = result.season.filter(s => SEASON_OPTIONS.includes(s));
    } else if (typeof result.season === 'string') {
      seasons = SEASON_OPTIONS.filter(s => result.season.includes(s));
    }

    // 验证分类
    const validCategory = CATEGORY_CONFIG[result.category] ? result.category : '';
    const subCategoryList = validCategory ? CATEGORY_CONFIG[validCategory].subCategories : [];

    // 验证风格
    const validStyle = STYLE_OPTIONS.includes(result.style) ? result.style : '';

    this.setData({
      showAiOverlay: false,
      name: result.name || 'AI识别单品',
      category: validCategory,
      subCategory: '',
      subCategoryList,
      colors,
      seasons,
      style: validStyle,
    });

    this.updateColorRibbon();
    this.updateSeasonData();
    this.updateSubmitState();
    wx.showToast({ title: 'AI识别成功', icon: 'success' });
  },

  /** 根据颜色名称模糊匹配到 hex 色值 */
  _matchColorToHex(colorName, mapping) {
    if (!colorName) return null;
    // 精确匹配
    if (mapping[colorName]) return mapping[colorName];
    // 模糊匹配：去掉"色"字后比较
    const cleanName = colorName.replace(/色/g, '');
    for (const [name, hex] of Object.entries(mapping)) {
      const cleanKey = name.replace(/色/g, '');
      if (cleanName.includes(cleanKey) || cleanKey.includes(cleanName)) {
        return hex;
      }
    }
    return null;
  },

  // ===== 名称输入 =====
  onNameInput(e) {
    this.setData({ name: e.detail.value });
    this.updateSubmitState();
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
    this.updateSubmitState();
  },
  selectSubCategory(e) {
    const sub = e.currentTarget.dataset.sub;
    this.setData({ subCategory: sub });
    this.updateSubmitState();
  },

  // ===== 季节选择 (inline) =====
  toggleSeason(e) {
    const s = e.currentTarget.dataset.s;
    const idx = this.data.seasons.indexOf(s);
    const seasons = idx !== -1
      ? this.data.seasons.slice(0, idx).concat(this.data.seasons.slice(idx + 1))
      : this.data.seasons.concat([s]);
    this.setData({ seasons });
    this.updateSeasonData();
  },

  /** 根据 seasons 数组同步更新 seasonCards 渲染数据 */
  updateSeasonData() {
    const seasons = this.data.seasons;
    const seasonCards = SEASON_OPTIONS.map(name => {
      const config = SEASON_COLORS[name];
      const isActive = seasons.indexOf(name) !== -1;
      return {
        name,
        active: isActive,
        bg: isActive ? config.activeBg : config.bg,
        shadow: isActive ? config.activeShadow : 'transparent',
        text: isActive ? '#FFFFFF' : config.text,
      };
    });
    this.setData({ seasonCards });
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
    this.updateSubmitState();
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

  // 颜色名称映射
  COLOR_NAMES: [
    { name: '红色', color: '#EF5350', hueRange: [345, 15] },
    { name: '橙色', color: '#FF9800', hueRange: [15, 45] },
    { name: '黄色', color: '#FFEB3B', hueRange: [45, 75] },
    { name: '绿色', color: '#66BB6A', hueRange: [75, 165] },
    { name: '青色', color: '#00BCD4', hueRange: [165, 195] },
    { name: '蓝色', color: '#42A5F5', hueRange: [195, 255] },
    { name: '紫色', color: '#AB47BC', hueRange: [255, 285] },
    { name: '粉色', color: '#EC407A', hueRange: [285, 345] },
  ],

  // 颜色块数据（用于弹窗色块网格）
  colorBlocks: [],

  initColorBlocks() {
    const blocks = this.COLOR_NAMES.map(item => ({
      name: item.name,
      color: item.color,
    }));
    this.setData({ colorBlocks: blocks });
  },

  // 根据色相获取颜色名称
  getColorNameByHue(hue) {
    const names = this.COLOR_NAMES;
    for (let i = 0; i < names.length; i++) {
      const [min, max] = names[i].hueRange;
      if (min > max) {
        if (hue >= min || hue <= max) return names[i];
      } else {
        if (hue >= min && hue <= max) return names[i];
      }
    }
    return names[4];
  },

  // ===== 颜色选择器弹窗 =====
  showColorPicker() {
    this.setData({ showColorPicker: true });
  },
  hideColorPicker() {
    this.setData({ showColorPicker: false });
  },

  // Hue slider interaction
  onHueTap(e) {
    const query = wx.createSelectorQuery().in(this);
    query.select('.color-hue-slider').boundingClientRect();
    query.exec((res) => {
      if (!res || !res[0]) return;
      const rect = res[0];
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      this.setHueFromPercent(percent);
    });
  },
  onHueMove(e) {
    const query = wx.createSelectorQuery().in(this);
    query.select('.color-hue-slider').boundingClientRect();
    query.exec((res) => {
      if (!res || !res[0]) return;
      const rect = res[0];
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      this.setHueFromPercent(percent);
    });
  },
  setHueFromPercent(percent) {
    const hue = (percent / 100) * 360;
    const d = this.data;
    const rgbPure = this.hsvToRgb(hue, 1, 1);
    const hexPure = this.rgbToHex(rgbPure.r, rgbPure.g, rgbPure.b);
    const rgb = this.hsvToRgb(hue, d.pickerSaturation, d.pickerValue);
    const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    const colorInfo = this.getColorNameByHue(hue);
    this.setData({
      pickerHue: hue,
      pickerPureColor: hexPure,
      pickerColor: hex,
      pickerColorName: colorInfo.name,
      pickerHex: hex.replace('#', ''),
      pickerR: rgb.r,
      pickerG: rgb.g,
      pickerB: rgb.b,
      hueThumbLeft: percent,
    });
  },

  // Gradient area interaction (saturation + value)
  onGradientTap(e) {
    const query = wx.createSelectorQuery().in(this);
    query.select('.color-gradient-area').boundingClientRect();
    query.exec((res) => {
      if (!res || !res[0]) return;
      const rect = res[0];
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.updateGradientPick(x, y, rect.width, rect.height);
    });
  },
  onGradientMove(e) {
    const query = wx.createSelectorQuery().in(this);
    query.select('.color-gradient-area').boundingClientRect();
    query.exec((res) => {
      if (!res || !res[0]) return;
      const rect = res[0];
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.updateGradientPick(x, y, rect.width, rect.height);
    });
  },
  updateGradientPick(x, y, width, height) {
    const sat = Math.max(0, Math.min(1, x / width));
    const val = Math.max(0, Math.min(1, 1 - y / height));
    const d = this.data;
    const rgb = this.hsvToRgb(d.pickerHue, sat, val);
    const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    const colorInfo = this.getColorNameByHue(d.pickerHue);
    this.setData({
      pickerColor: hex,
      pickerColorName: colorInfo.name,
      pickerHex: hex.replace('#', ''),
      pickerR: rgb.r,
      pickerG: rgb.g,
      pickerB: rgb.b,
      pickerSaturation: sat,
      pickerValue: val,
      pickerThumbX: sat * 100,
      pickerThumbY: (1 - val) * 100,
    });
  },

  // Confirm color pick
  confirmColorPick() {
    const c = this.data.pickerColor;
    const idx = this.data.colors.indexOf(c);
    const colors = idx !== -1
      ? this.data.colors.slice(0, idx).concat(this.data.colors.slice(idx + 1))
      : this.data.colors.concat([c]);
    this.setData({ colors, showColorPicker: false });
    this.updateColorRibbon();
  },

  // Color utils
  hsvToRgb(h, s, v) {
    let r = 0, g = 0, b = 0;
    const hh = ((h % 360) + 360) % 360;
    const i = Math.floor(hh / 60);
    const f = hh / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  },
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  },
  rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return {
      h: h * 360,
      s: max === 0 ? 0 : d / max,
      v: max,
    };
  },

  clearColors() {
    this.setData({ colors: [] });
    this.updateColorRibbon();
  },

  // ===== 确认按钮点击 -> 弹出衣柜选择 =====
  onConfirmTap() {
    if (!this.data.canSubmit) {
      if (!this.data.name.trim()) {
        wx.showToast({ title: '请输入名称', icon: 'none' });
      } else if (!this.data.category) {
        wx.showToast({ title: '请选择种类', icon: 'none' });
      } else if (!this.data.style) {
        wx.showToast({ title: '请选择风格', icon: 'none' });
      }
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
