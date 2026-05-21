Page({
  data: {
    __theme: 'cream-morandi',
  },

  onLoad() {
    const app = getApp();
    const state = app.getState();
    this.setData({ __theme: state.theme });

    // 2.8秒后跳转到主页
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/home/home' });
    }, 2800);
  },
});
