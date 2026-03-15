const config = require('../../config/index')
const dishService = require('../../services/dishService')
const userService = require('../../services/userService')

Page({
  data: {
    currentUser: null,
    isAdmin: false,
    manualRecommendList: [],
    topSalesList: [],
    restaurantProfile: config.restaurantProfile
  },

  /**
   * 页面加载。
   */
  async onLoad() {
    await this.loadPageData()
  },

  /**
   * 页面展示时刷新数据。
   */
  async onShow() {
    await this.loadPageData()
  },

  /**
   * 下拉刷新首页。
   */
  async onPullDownRefresh() {
    await this.loadPageData()
    wx.stopPullDownRefresh()
  },

  /**
   * 加载首页数据。
   */
  async loadPageData() {
    try {
      const currentUser = userService.getCachedUser()
      const [manualRecommendList, topSalesList] = await Promise.all([
        dishService.getManualRecommendDishes(4),
        dishService.getTopSalesDishes(8)
      ])

      this.setData({
        currentUser,
        isAdmin: Boolean(currentUser && currentUser.role === 'admin'),
        manualRecommendList,
        topSalesList
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '首页数据加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 跳转到点餐页。
   */
  goOrderTab() {
    wx.switchTab({ url: '/pages/order/index' })
  },

  /**
   * 跳转到用户页。
   */
  goUserTab() {
    wx.switchTab({ url: '/pages/user/index' })
  },

  /**
   * 打开订单列表。
   */
  openOrdersPage() {
    const currentUser = userService.getCachedUser()
    if (!currentUser) {
      wx.showToast({
        title: '请先登录后查看订单',
        icon: 'none'
      })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/user/index' })
      }, 400)
      return
    }

    wx.navigateTo({ url: '/pages/orders/index' })
  },

  /**
   * 打开管理员推荐配置页。
   */
  openRecommendManager() {
    wx.navigateTo({ url: '/pages/admin/index?tab=recommend' })
  }
})
