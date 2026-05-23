Page({
  data: {
    __theme: 'cream-morandi',
    
    // 动画状态
    phase: 0,              // 当前阶段 (0-3)
    progress: 0,           // 总体进度 (0-100)
    stitchProgress: 0,     // 缝线动画进度
    isComplete: false,     // 是否完成
    
    // 显示控制
    showStitches: true,    // 显示缝线
    showClothPieces: false, // 显示布料碎片
    showNeckline: false,   // 显示领口
    showBody: false,       // 显示上衣主体
    showPants: false,      // 显示裤子
    showPocket: false,     // 显示口袋
    showBrand: false,      // 显示品牌名
    showWelcomeText: false, // 显示欢迎文字
    
    // 动画参数
    logoOffset: 0,         // logo偏移
    clothScale: 0.8,       // 服装缩放
    clothOpacity: 0,       // 服装透明度
    clothGroupOpacity: 1,  // 服装组整体透明度（用于淡出）
    
    // 尺寸相关
    svgSize: 240,          // SVG尺寸
    center: 120,           // 中心点
    
    // 文本
    phaseText: '正在初始化...',
    progressText: '0',
    
    // 缝线路径数据
    stitchLines: [],
    
    // 布料碎片数据
    clothPieces: [],
    
    // 欢迎文字字符数组
    welcomeChars: []
  },

  // 阶段提示文字
  phaseTexts: [
    '正在初始化...',
    '正在准备缝线...',
    '正在绘制服装轮廓...',
    '正在填充颜色和细节...',
    '即将进入衣语集'
  ],

  onLoad() {
    const app = getApp();
    const state = app.getState();
    this.setData({ __theme: state.theme });

    // 初始化尺寸
    this.initSize();
    
    // 初始化数据
    this.initData();
    
    // 启动动画
    this.startAnimation();
  },

  // 初始化尺寸
  initSize() {
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.windowWidth;
    
    let svgSize = 240;
    if (screenWidth <= 375) {
      svgSize = 200;
    } else if (screenWidth >= 415) {
      svgSize = 280;
    }
    
    this.setData({
      svgSize,
      center: svgSize / 2
    });
  },

  // 初始化数据
  initData() {
    const { svgSize, center } = this.data;
    
    // 缝线路径（从中心向四周辐射）
    const stitchLines = [
      { path: `M ${center} ${center} Q ${center - 30} ${center - 40} ${center / 2 - 10} ${center / 2 - 10}` },
      { path: `M ${center} ${center} Q ${center + 30} ${center - 40} ${center * 1.5 + 10} ${center / 2 - 10}` },
      { path: `M ${center} ${center} Q ${center - 50} ${center} 10 ${center}` },
      { path: `M ${center} ${center} Q ${center + 50} ${center} ${svgSize - 10} ${center}` },
      { path: `M ${center} ${center} Q ${center - 30} ${center + 40} ${center / 2 - 10} ${center * 1.5 + 10}` },
      { path: `M ${center} ${center} Q ${center + 30} ${center + 40} ${center * 1.5 + 10} ${center * 1.5 + 10}` },
      { path: `M ${center} ${center} Q ${center} ${center - 50} ${center} 10` }
    ];
    
    // 布料碎片
    const clothPieces = [
      { color: '#F5E1DA', top: '20%', left: '55%', rotate: 15, w: 0.35, h: 0.4, clip: 'polygon(20% 0%, 80% 10%, 100% 70%, 0% 90%)', float: 'clothFloat1', delay: 100 },
      { color: '#C5D1DC', top: '15%', left: '10%', rotate: -10, w: 0.3, h: 0.35, clip: 'polygon(10% 10%, 90% 0%, 80% 100%, 20% 80%)', float: 'clothFloat2', delay: 250 },
      { color: '#E8DFD0', top: '50%', left: '45%', rotate: 20, w: 0.32, h: 0.38, clip: 'polygon(0% 20%, 100% 0%, 90% 90%, 10% 100%)', float: 'clothFloat3', delay: 400 },
      { color: '#D4E5D2', top: '10%', left: '35%', rotate: -5, w: 0.28, h: 0.32, clip: 'polygon(15% 5%, 85% 0%, 100% 80%, 5% 100%)', float: 'clothFloat4', delay: 150 },
      { color: '#E0D4E8', top: '45%', left: '8%', rotate: 25, w: 0.3, h: 0.36, clip: 'polygon(10% 0%, 90% 15%, 80% 100%, 0% 85%)', float: 'clothFloat5', delay: 350 }
    ];
    
    // 欢迎文字字符数组（带延迟）
    const welcomeText = '欢迎进入衣语集';
    const welcomeChars = welcomeText.split('').map((char, index) => ({
      char,
      delay: (index * 0.1).toFixed(2)
    }));
    
    this.setData({ stitchLines, clothPieces, welcomeChars });
  },

  // 启动动画
  startAnimation() {
    const startTime = Date.now();
    const totalDuration = 4800; // 4.8秒总时长（包含淡出和欢迎文字）
    let currentPhase = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / totalDuration) * 100, 100);
      
      // 更新总体进度
      this.setData({ progress, progressText: Math.round(progress).toString() });
      
      // 阶段0: 0-1.2秒，缝线动画
      if (elapsed < 1200) {
        if (currentPhase !== 0) {
          currentPhase = 0;
          this.setData({ phase: 0, phaseText: this.phaseTexts[0] });
        }
        const stitchProgress = Math.min((elapsed / 800) * 100, 100);
        this.setData({ stitchProgress });
      }
      
      // 阶段1: 1.2-2.8秒，绘制轮廓
      if (elapsed >= 1200 && elapsed < 2800 && currentPhase < 1) {
        currentPhase = 1;
        this.setData({
          phase: 1,
          phaseText: this.phaseTexts[1],
          showStitches: false,
          showClothPieces: true,
          showNeckline: true
        });
        
        setTimeout(() => {
          this.setData({ showBody: true });
        }, 100);
      }
      
      // 阶段2: 2.8-3.6秒，填充颜色
      if (elapsed >= 2800 && elapsed < 3600 && currentPhase < 2) {
        currentPhase = 2;
        this.setData({
          phase: 2,
          phaseText: this.phaseTexts[2],
          showClothPieces: false,
          showBrand: true,
          clothScale: 1,
          clothOpacity: 1
        });
        
        setTimeout(() => { this.setData({ showNeckline: true }); }, 0);
        setTimeout(() => { this.setData({ showPants: true }); }, 200);
        setTimeout(() => { this.setData({ showBody: true }); }, 400);
        setTimeout(() => { this.setData({ showPocket: true }); }, 600);
      }
      
      // 阶段3: 3.6-4.0秒，完成动画
      if (elapsed >= 3600 && elapsed < 4000 && currentPhase < 3) {
        currentPhase = 3;
        this.setData({
          phase: 3,
          phaseText: this.phaseTexts[3],
          clothScale: 1.05
        });
        
        setTimeout(() => {
          this.setData({ clothScale: 1 });
        }, 300);
        
        setTimeout(() => {
          this.setData({ showBrand: true });
        }, 0);
      }
      
      // 完成阶段: 4.0-4.8秒，衣物淡出 + 欢迎文字显示
      if (elapsed >= 4000 && elapsed < 4800 && !this.data.isComplete) {
        // 衣物淡出效果（0.5秒）
        if (elapsed >= 4000 && elapsed < 4500) {
          const fadeProgress = (elapsed - 4000) / 500;
          const clothGroupOpacity = Math.max(0, 1 - fadeProgress);
          this.setData({ clothGroupOpacity });
        } else if (elapsed >= 4500) {
          this.setData({ clothGroupOpacity: 0 });
        }
        
        // 显示欢迎文字
        if (elapsed >= 4200 && !this.data.showWelcomeText) {
          this.setData({ showWelcomeText: true });
        }
      }
      
      // 最终完成
      if (elapsed >= 4800 && !this.data.isComplete) {
        this.setData({
          isComplete: true,
          phaseText: this.phaseTexts[4],
          progress: 100,
          progressText: '100',
          clothGroupOpacity: 0
        });
        
        setTimeout(() => {
          this.navigateToHome();
        }, 800);
        return;
      }
      
      // 继续动画
      if (elapsed < totalDuration + 2000) {
        this.animationTimer = setTimeout(animate, 16); // ~60fps
      }
    };
    
    animate();
  },

  // 页面点击事件
  onPageTap() {
    if (!this.data.isComplete) {
      this.skipAnimation();
    }
  },

  // 跳过动画
  skipAnimation() {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
    
    this.setData({
      phase: 3,
      showStitches: false,
      showClothPieces: false,
      showBrand: true,
      showWelcomeText: true,
      showNeckline: true,
      showBody: true,
      showPants: true,
      showPocket: true,
      clothScale: 1,
      clothOpacity: 1,
      clothGroupOpacity: 0,
      progress: 100,
      progressText: '100',
      isComplete: true,
      phaseText: this.phaseTexts[4]
    });
    
    setTimeout(() => {
      this.navigateToHome();
    }, 800);
  },

  // 跳转到首页
  navigateToHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  },

  onUnload() {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
  }
});
