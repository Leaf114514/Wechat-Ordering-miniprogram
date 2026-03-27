const config = require('../../config/index')
const userService = require('../../services/userService')
const orderService = require('../../services/orderService')
const recommendService = require('../../services/recommendService')
const { DEFAULT_AVATAR_URL, PAGE_ROUTES, USER_ROLE } = require('../../constants/index')
const {
  feedback,
  navigation,
  modal,
  location
} = require('../../utils/wechat/index')

/**
 * 构建未登录状态下的页面数据。
 * @param {Object} app - 小程序实例。
 * @returns {Object} 游客态页面数据。
 */
function buildGuestState(app) {
  return {
    currentUser: null,
    hasLogin: false,
    isAdmin: false,
    metrics: null,
    recommendList: [],
    draftAvatarUrl: DEFAULT_AVATAR_URL,
    draftNickname: '',
    useMockData: app.globalData.useMockData,
    cloudEnvId: app.globalData.cloudEnvId || '未配置',
    restaurantProfile: app.globalData.restaurantProfile
  }
}

/**
 * 构建已登录状态下的页面数据。
 * @param {Object} app - 小程序实例。
 * @param {Object} currentUser - 当前用户。
 * @returns {Object} 登录态页面数据。
 */
function buildLoggedState(app, currentUser) {
  return {
    currentUser,
    hasLogin: true,
    isAdmin: currentUser.role === USER_ROLE.ADMIN,
    metrics: null,
    recommendList: [],
    draftAvatarUrl: currentUser.avatarUrl || DEFAULT_AVATAR_URL,
    draftNickname: currentUser.nickname || '',
    useMockData: app.globalData.useMockData,
    cloudEnvId: app.globalData.cloudEnvId || '未配置',
    restaurantProfile: app.globalData.restaurantProfile
  }
}

Page({
  data: {
    currentUser: null,
    hasLogin: false,
    isAdmin: false,
    metrics: null,
    recommendList: [],
    defaultAvatarUrl: DEFAULT_AVATAR_URL,
    draftAvatarUrl: DEFAULT_AVATAR_URL,
    draftNickname: '',
    useMockData: config.useMockData,
    cloudEnvId: config.cloudEnvId || '未配置',
    restaurantProfile: config.restaurantProfile
  },

  /**
   * 页面首次加载时同步个人中心数据。
   */
  async onLoad() {
    await this.syncUserPage()
  },

  /**
   * 页面显示时刷新用户状态与模块数据。
   */
  async onShow() {
    await this.syncUserPage()
  },

  /**
   * 同步个人中心基础状态。
   */
  async syncUserPage() {
    const app = getApp()
    const currentUser = userService.getCachedUser()

    if (!currentUser) {
      this.setData(buildGuestState(app))
      return
    }

    this.setData(buildLoggedState(app, currentUser))
    await this.loadUserModules(currentUser)
  },

  /**
   * 加载登录后的统计与推荐数据。
   * @param {Object} currentUser - 当前用户。
   */
  async loadUserModules(currentUser) {
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
      feedback.showError(error.message || '个人信息加载失败')
    }
  },

  /**
   * 选择微信头像后同步到草稿状态。
   * @param {Object} event - 头像选择事件对象。
   */
  handleChooseAvatar(event) {
    this.setData({
      draftAvatarUrl: event.detail.avatarUrl || DEFAULT_AVATAR_URL
    })
  },

  /**
   * 输入微信昵称草稿。
   * @param {Object} event - 输入事件对象。
   */
  handleNickNameInput(event) {
    this.setData({
      draftNickname: event.detail.value
    })
  },

  /**
   * 发起微信登录，并在成功后刷新个人中心数据。
   */
  async handleWechatLogin() {
    try {
      await feedback.withLoading('登录中', () => {
        return userService.loginWithWechatProfile({
          avatarUrl: this.data.draftAvatarUrl,
          nickname: this.data.draftNickname
        })
      })
      feedback.showSuccess('登录成功')
      await this.syncUserPage()
    } catch (error) {
      feedback.showError(error.message || '登录失败')
    }
  },

  /**
   * 退出当前账号。
   */
  async handleLogout() {
    const confirmed = await modal.confirm({
      title: '退出登录',
      content: '退出后将清空当前登录态，但不会删除你的订单记录。'
    })

    if (!confirmed) {
      return
    }

    userService.logoutCurrentUser()
    await this.syncUserPage()
    feedback.showToast('已退出登录')
  },

  /**
   * 打开订单列表页。
   */
  openOrdersPage() {
    navigation.navigateTo(PAGE_ROUTES.ORDERS)
  },

  /**
   * 跳转到点餐页。
   */
  openOrderPage() {
    navigation.switchTab(PAGE_ROUTES.ORDER)
  },

  /**
   * 打开门店定位。
   */
  openStoreLocation() {
    const profile = this.data.restaurantProfile
    location.openLocation({
      latitude: profile.latitude,
      longitude: profile.longitude,
      name: profile.name,
      address: profile.address,
      scale: 16
    })
  },

  /**
   * 打开后台管理页。
   */
  openAdminPage() {
    navigation.navigateTo(PAGE_ROUTES.ADMIN)
  },

  /**
   * 在 mock 模式下切换演示身份。
   * @param {Object} event - 角色切换事件对象。
   */
  async handleMockRoleSwitch(event) {
    const role = event.currentTarget.dataset.role
    await userService.switchMockRole(role)
    await this.syncUserPage()
    feedback.showSuccess('演示身份已切换')
  }
})
