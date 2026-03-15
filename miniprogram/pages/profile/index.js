const config = require('../../config/index')
const userService = require('../../services/userService')
const orderService = require('../../services/orderService')
const recommendService = require('../../services/recommendService')

Page({
  data: {
    currentUser: null,
    metrics: null,
    recommendList: [],
    useMockData: config.useMockData,
    cloudEnvId: config.cloudEnvId || '未配置'
  },

  /**
   * 页面加载。
   */
  async onLoad() {
    await this.initializePage()
  },

  /**
   * 页面显示时刷新数据。
   */
  async onShow() {
    if (this.data.currentUser) {
      await this.loadPageData(this.data.currentUser)
    }
  },

  /**
   * 初始化用户中心。
   */
  async initializePage() {
    const app = getApp()
    const currentUser = await userService.ensureCurrentUser()
    this.setData({
      currentUser,
      useMockData: app.globalData.useMockData,
      cloudEnvId: app.globalData.cloudEnvId || '未配置'
    })
    await this.loadPageData(currentUser)
  },

  /**
   * 加载用户中心数据。
   * @param {Object} currentUser - 当前用户。
   */
  async loadPageData(currentUser) {
    const [metrics, recommendList] = await Promise.all([
      orderService.getOrderMetrics(currentUser._id),
      recommendService.getPersonalRecommendations({
        userId: currentUser._id,
        limit: 4
      })
    ])
    this.setData({ metrics, recommendList })
  },

  /**
   * 切换演示普通用户。
   */
  async switchCustomer() {
    const currentUser = await userService.switchMockRole('customer')
    this.setData({ currentUser })
    await this.loadPageData(currentUser)
  },

  /**
   * 切换演示管理员。
   */
  async switchAdmin() {
    const currentUser = await userService.switchMockRole('admin')
    this.setData({ currentUser })
    await this.loadPageData(currentUser)
  },

  /**
   * 页面跳转。
   * @param {Object} event - 事件对象。
   */
  handleNavigate(event) {
    wx.navigateTo({ url: event.currentTarget.dataset.url })
  }
})
