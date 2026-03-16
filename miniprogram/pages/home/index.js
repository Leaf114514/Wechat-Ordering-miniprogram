const config = require('../../config/index')
const dishService = require('../../services/dishService')
const userService = require('../../services/userService')
const { feedback, navigation, page: pageActions } = require('../../utils/wechat')

Page({
  data: {
    currentUser: null,
    isAdmin: false,
    manualRecommendList: [],
    topSalesList: [],
    restaurantProfile: config.restaurantProfile
  },

  /**
   * 页面初次加载时拉取首页数据。
   */
  async onLoad() {
    await this.loadPageData()
  },

  /**
   * 页面重新展示时同步最新首页数据。
   */
  async onShow() {
    await this.loadPageData()
  },

  /**
   * 处理首页下拉刷新，并在结束后统一关闭刷新动画。
   */
  async onPullDownRefresh() {
    await pageActions.withPullDownRefresh(() => this.loadPageData())
  },

  /**
   * 加载首页展示所需的用户、推荐和热销数据。
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
      feedback.showError(error.message || '首页数据加载失败')
    }
  },

  /**
   * 跳转到点餐 tab。
   */
  goOrderTab() {
    navigation.switchTab('/pages/order/index')
  },

  /**
   * 跳转到个人中心 tab。
   */
  goUserTab() {
    navigation.switchTab('/pages/user/index')
  },

  /**
   * 打开订单列表，未登录时先引导到个人中心。
   */
  openOrdersPage() {
    const currentUser = userService.getCachedUser()
    if (!currentUser) {
      feedback.showError('请先登录后查看订单')
      navigation.switchTabLater('/pages/user/index', 400)
      return
    }

    navigation.navigateTo('/pages/orders/index')
  },

  /**
   * 打开后台推荐管理页。
   */
  openRecommendManager() {
    navigation.navigateTo('/pages/admin/index?tab=recommend')
  }
})
