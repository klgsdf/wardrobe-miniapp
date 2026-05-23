const app = getApp();

// ===== API 配置 =====
const API_KEY = '170679af4ee84c7babed1e641603fcc9.ZRcKuJPAiRI2bWk2';
const API_BASE = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

Page({
  data: {
    __theme: 'cream-morandi',
    inputValue: '',
    hasInput: false,
    uploadedImage: '',          // 压缩后的图片临时路径
    uploadedImageBase64: '',    // base64 编码（用于 API）
    searchHistory: [],
    isAnalyzing: false,
    analysisStep: 0,            // 0-idle, 1-图片分析中, 2-生成方案中, 3-完成
    analysisStatusText: 'AI 正在为您搭配...',
    analysisStepText: '分析风格偏好 · 匹配色彩方案 · 生成穿搭建议',
    imageAnalysisResult: null,  // 图片 AI 分析结果（暂存，跳转时传递）
    clothingItems: [],
  },

  onLoad() {
    const s = app.getState();
    const history = wx.getStorageSync('aiSearchHistory') || [];
    this.setData({ __theme: s.theme, clothingItems: s.clothingItems, searchHistory: history });
  },

  // ===== 输入相关 =====
  onInput(e) {
    const val = e.detail.value;
    this.setData({ inputValue: val, hasInput: val.trim().length > 0 });
  },

  /** 点击历史记录标签 */
  addTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const base = this.data.inputValue.trim();
    const newVal = base ? base + '，' + tag : tag;
    this.setData({ inputValue: newVal, hasInput: newVal.trim().length > 0 });
  },

  clearHistory() {
    this.setData({ searchHistory: [] });
    wx.removeStorageSync('aiSearchHistory');
    wx.showToast({ title: '已清空', icon: 'none' });
  },

  resetInput() {
    this.setData({
      inputValue: '',
      hasInput: false,
      uploadedImage: '',
      uploadedImageBase64: '',
      isAnalyzing: false,
      analysisStep: 0,
      imageAnalysisResult: null,
    });
  },

  // ===== 图片上传与压缩 =====
  chooseImage() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempPath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '处理中...' });
        // 先压缩图片再设置预览
        that.compressImage(tempPath, function(compressedPath) {
          that.setData({ uploadedImage: compressedPath });
          // 转 base64 用于 API 调用
          that.imageToBase64(compressedPath, function(base64) {
            that.setData({ uploadedImageBase64: base64 });
            wx.hideLoading();
            wx.showToast({ title: '图片已就绪', icon: 'none' });
          });
        });
      },
      fail: function() {
        wx.showToast({ title: '取消选择', icon: 'none' });
      }
    });
  },

  /** Canvas 压缩图片：限制最大边长 1024px，质量 0.7 */
  compressImage(srcPath, callback) {
    const that = this;
    wx.getImageInfo({
      src: srcPath,
      success: function(info) {
        const MAX_SIZE = 1024;
        let w = info.width;
        let h = info.height;
        // 缩放至短边不超过 MAX_SIZE
        if (w > MAX_SIZE || h > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        // 使用 offscreen canvas 2D（新版 API）
        const query = wx.createSelectorQuery();
        query.select('#compressCanvas')
          .fields({ node: true, size: true })
          .exec(function(res2) {
            let canvas, ctx;
            if (res2 && res2[0] && res2[0].node) {
              canvas = res2[0].node;
              ctx = canvas.getContext('2d');
              canvas.width = w;
              canvas.height = h;
            } else {
              // 降级：使用旧版 canvas
              const ctxLegacy = wx.createCanvasContext('compressCanvas');
              // 旧版不支持动态尺寸，直接用原图
              callback(srcPath);
              return;
            }
            const img = canvas.createImage();
            img.onload = function() {
              ctx.clearRect(0, 0, w, h);
              ctx.drawImage(img, 0, 0, w, h);
              // 短暂延迟确保绘制完成
              setTimeout(function() {
                wx.canvasToTempFilePath({
                  canvas: canvas,
                  x: 0, y: 0, width: w, height: h,
                  destWidth: w, destHeight: h,
                  fileType: 'jpg',
                  quality: 0.7,
                  success: function(compressRes) {
                    callback(compressRes.tempFilePath);
                  },
                  fail: function() {
                    callback(srcPath);
                  }
                });
              }, 100);
            };
            img.onerror = function() {
              callback(srcPath);
            };
            img.src = srcPath;
          });
      },
      fail: function() {
        callback(srcPath);
      }
    });
  },

  /** 图片转 base64 */
  imageToBase64(filePath, callback) {
    const fs = wx.getFileSystemManager();
    try {
      const data = fs.readFileSync(filePath, 'base64');
      // 判断文件类型
      const ext = filePath.split('.').pop().toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      callback('data:' + mime + ';base64,' + data);
    } catch (e) {
      console.error('图片转 base64 失败:', e);
      callback('');
    }
  },

  /** 移除已上传图片 */
  removeImage() {
    this.setData({ uploadedImage: '', uploadedImageBase64: '', imageAnalysisResult: null });
  },

  // ===== 核心：AI 分析流程 =====
  submit() {
    const query = this.data.inputValue.trim();
    const hasImage = !!this.data.uploadedImageBase64;

    if (!query && !hasImage) {
      wx.showToast({ title: '请输入需求或上传图片', icon: 'none' });
      return;
    }

    // 保存搜索历史
    const searchQuery = query || '图片分析穿搭';
    const history = [searchQuery].concat(
      this.data.searchHistory.filter(function(h) { return h !== searchQuery; })
    ).slice(0, 10);
    this.setData({
      searchHistory: history,
      isAnalyzing: true,
      imageAnalysisResult: null,
      analysisStep: hasImage ? 1 : 2,
      analysisStatusText: hasImage ? '正在分析图片...' : '正在生成穿搭方案...',
      analysisStepText: hasImage ? 'AI 识别衣物属性中' : 'AI 综合分析中',
    });
    wx.setStorageSync('aiSearchHistory', history);

    const that = this;

    if (hasImage) {
      // 步骤 1：图片分析（CogView-3-Flash）
      this.analyzeImageWithAI(function(imageResult) {
        // 步骤 2：穿搭方案生成（GLM-4-Flash）
        that.setData({
          analysisStep: 2,
          analysisStatusText: '正在生成穿搭方案...',
          analysisStepText: 'AI 综合分析中',
          imageAnalysisResult: imageResult,
        });
        that.generateOutfitWithAI(query, imageResult);
      });
    } else {
      // 无图片，直接生成方案
      that.generateOutfitWithAI(query, null);
    }
  },

  /** API 请求封装 */
  apiRequest(model, messages, callback) {
    const that = this;
    wx.request({
      url: API_BASE,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
      },
      data: {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048,
      },
      timeout: 60000,
      success: function(res) {
        if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices.length > 0) {
          const content = res.data.choices[0].message.content;
          callback(null, content);
        } else {
          callback(res.data || 'API 请求失败', null);
        }
      },
      fail: function(err) {
        callback(err, null);
      }
    });
  },

  /** 使用 CogView-3-Flash 进行图片视觉分析 */
  analyzeImageWithAI(callback) {
    const that = this;
    const base64 = this.data.uploadedImageBase64;
    const userQuery = this.data.inputValue.trim();

    const userContent = [];
    userContent.push({
      type: 'image_url',
      image_url: { url: base64 }
    });
    userContent.push({
      type: 'text',
      text: '请详细分析这张图片中的服装穿搭，输出以下信息的 JSON 格式（仅输出 JSON，不要其他文字）：\n' +
        '{\n' +
        '  "style": "整体风格（如：休闲、职场、甜美、运动、简约、复古、街头等）",\n' +
        '  "colors": ["识别到的主要颜色 hex 值，如 #F5F5F5"],\n' +
        '  "categories": ["识别到的衣物品类，如：风衣、T恤、牛仔裤等"],\n' +
        '  "description": "对图片中穿搭的详细描述，100字以内"\n' +
        '}'
    });

    this.apiRequest('cogview-3-flash', [
      { role: 'user', content: userContent }
    ], function(err, content) {
      if (err) {
        console.error('图片分析失败:', err);
        // 分析失败，跳过图片结果，继续生成方案
        that.setData({ analysisStep: 2, analysisStatusText: '图片分析完成（部分）', analysisStepText: '进入方案生成' });
        callback(null);
      } else {
        // 尝试解析 JSON
        let result = null;
        try {
          const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          result = JSON.parse(cleaned);
        } catch (e) {
          console.error('JSON 解析失败:', e, '原始内容:', content);
          result = { description: content.substring(0, 200), style: '', colors: [], categories: [] };
        }
        callback(result);
      }
    });
  },

  /** 使用 GLM-4-Flash 生成穿搭建议 */
  generateOutfitWithAI(query, imageResult) {
    const that = this;
    const items = this.data.clothingItems;

    // 构建综合输入
    let wardrobeContext = '用户衣柜中的单品：\n';
    items.forEach(function(item, idx) {
      wardrobeContext += (idx + 1) + '. ' + item.name + '（' + item.category + ' - ' + (item.subCategory || '') + '，风格：' + item.style + '，颜色：' + (item.colors ? item.colors.join('、') : '未知') + '）\n';
    });

    let imageContext = '';
    if (imageResult) {
      imageContext = '\n用户上传的图片分析结果：\n';
      if (imageResult.style) imageContext += '- 风格：' + imageResult.style + '\n';
      if (imageResult.categories && imageResult.categories.length > 0) imageContext += '- 品类：' + imageResult.categories.join('、') + '\n';
      if (imageResult.description) imageContext += '- 描述：' + imageResult.description + '\n';
    }

    const systemPrompt = '你是一位专业的时尚穿搭顾问。你需要根据用户的需求、衣柜中的单品以及可选的图片参考，生成专业、实用的穿搭建议方案。\n\n请输出 JSON 格式（仅输出 JSON，不要其他文字）：\n{\n  "recommendation": {\n    "name": "方案名称（如：温柔知性风）",\n    "style": "风格标签",\n    "desc": "详细的穿搭建议描述，包含搭配思路、适用场合、配色逻辑等，200字左右",\n    "tags": ["风格标签1", "场景标签2", "季节标签3"],\n    "confidence": 95,\n    "categories": [\n      { "category": "上装", "matchedItemId": "c1" },\n      { "category": "下装", "matchedItemId": "c2" },\n      { "category": "鞋履", "matchedItemId": null }\n    ]\n  }\n}\n\n注意：\n- 只推荐 1 套方案\n- categories 中列出穿搭所需的所有单品种类\n- matchedItemId 从用户衣柜中选择最匹配的单品 ID，没有匹配则设为 null\n- 描述要专业、具体、有参考价值';

    const userMessage = '用户需求：' + (query || '根据图片推荐穿搭') + '\n\n' + wardrobeContext + imageContext + '\n请为上述需求推荐穿搭方案。';

    this.apiRequest('glm-4-flash', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], function(err, content) {
      if (err) {
        console.error('方案生成失败:', err);
        // API 失败时使用降级方案
        that.fallbackRecommendation(query);
      } else {
        // 解析 JSON 结果
        let aiResult = null;
        try {
          const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          aiResult = JSON.parse(cleaned);
        } catch (e) {
          console.error('JSON 解析失败:', e);
        }

        if (aiResult && aiResult.recommendation) {
          that.buildRecommendation(aiResult.recommendation);
        } else {
          // 解析失败，使用降级方案
          that.fallbackRecommendation(query);
        }
      }
    });
  },

  /** 将 AI 结果转换为页面数据 */
  buildRecommendation(aiRec) {
    const items = this.data.clothingItems;

    const categories = (aiRec.categories || []).map(function(c) {
      const matchedItem = c.matchedItemId ? items.find(function(i) { return i.id === c.matchedItemId; }) : null;
      return {
        category: c.category,
        matchedItem: matchedItem || null,
      };
    });

    const recommendation = {
      id: 'ai-rec-0',
      name: aiRec.name || 'AI 推荐搭配',
      style: aiRec.style || '',
      desc: aiRec.desc || '',
      tags: aiRec.tags || [],
      confidence: aiRec.confidence || 85,
      rankColor: '#3DBB8A',
      rankBg: 'rgba(61,187,138,0.15)',
      categories: categories,
    };

    app.globalData.aiResultData = {
      imageAnalysisResult: this.data.imageAnalysisResult,
      recommendation: recommendation,
    };
    this.setData({ isAnalyzing: false, analysisStep: 3 });
    wx.navigateTo({ url: '/pages/ai-result/ai-result' });
  },

  /** API 失败时的降级方案 */
  fallbackRecommendation(query) {
    const items = this.data.clothingItems;

    const categories = [
      { category: '上装', matchedItem: items[0] || null },
      { category: '下装', matchedItem: items[3] || null },
      { category: '鞋履', matchedItem: null },
      { category: '配饰', matchedItem: items[5] || null },
    ];

    const recommendation = {
      id: 'rec-0',
      name: '温柔知性风',
      style: '职场',
      desc: '这套搭配以「温柔知性」为核心风格，米白色宽松西装外套营造出干练又不失柔和的气场，内搭浅蓝色丝绸衬衫增添一抹清新亮色。卡其色高腰阔腿裤拉长腿部比例，整体造型非常适合春季职场通勤或商务休闲场合。',
      tags: ['职场', '温柔知性', '春季穿搭', '商务休闲'],
      confidence: 92,
      rankColor: '#3DBB8A',
      rankBg: 'rgba(61,187,138,0.15)',
      categories: categories,
    };

    app.globalData.aiResultData = {
      imageAnalysisResult: this.data.imageAnalysisResult,
      recommendation: recommendation,
    };
    this.setData({ isAnalyzing: false, analysisStep: 3 });
    wx.navigateTo({ url: '/pages/ai-result/ai-result' });
  },

  goBack() { wx.navigateBack(); },
});
