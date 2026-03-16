const config = require('../../config/index')
const userService = require('../../services/userService')
const orderService = require('../../services/orderService')
const recommendService = require('../../services/recommendService')
const { feedback, navigation } = require('../../utils/wechat')

Page({
  data: {
    currentUser: null,
    metrics: null,
    recommendList: [],
    useMockData: config.useMockData,
    cloudEnvId: config.cloudEnvId || '未配置'
  },

  /**
   * 页面加载时初始化用户中心数据。
   */
  async onLoad() {
    await this.initializePage()
  },

  /**
   * 页面重新显示时刷新当前用户数据。
   */
  async onShow() {
    if (!this.data.currentUser) {
      return
    }

    await this.loadPageData(this.data.currentUser)
  },

  /**
   * 初始化 profile 页面需要的基础信息。
   */
  async initializePage() {
    const app = getApp()
    const currentUser = await userService.ensureCurrentUser()

    this.setData({
      currentUser,
      useMockData: app.globalData.useMockData,
      cloudEnvId: app.globalData.cloudEnvId || '未配置'
    })

    if (!currentUser) {
      return
    }

    await this.loadPageData(currentUser)
  },

  /**
   * 加载用户统计和推荐数据。
   * @param {Object} currentUser - 当前用户。
   */
  async loadPageData(currentUser) {
    try {
      const [metrics, recommendList] = await Promise.all([
        orderService.getOrderMetrics(currentUser._id),
        recommendService.getPersonalRecommendations({
          userId: currentUser._id,
          limit: 4
        })
      ])

      this.setData({ metrics, recommendList })
    } catch (error) {
      feedback.showError(error.message || '个人中心数据加载失败')
    }
  },

  /**
   * 切换到普通用户演示身份。
   */
  async switchCustomer() {
    const currentUser = await userService.switchMockRole('customer')
    this.setData({ currentUser })
    if (!currentUser) {
      return
    }
    await this.loadPageData(currentUser)
  },

  /**
   * 切换到管理员演示身份。
   */
  async switchAdmin() {
    const currentUser = await userService.switchMockRole('admin')
    this.setData({ currentUser })
    if (!currentUser) {
      return
    }
    await this.loadPageData(currentUser)
  },

  /**
   * 处理页面内跳转。
   * @param {Object} event - 点击事件对象。
   */
  handleNavigate(event) {
    navigation.navigateTo(event.currentTarget.dataset.url)
  }
})
