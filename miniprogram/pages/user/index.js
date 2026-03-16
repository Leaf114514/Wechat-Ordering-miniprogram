const config = require('../../config/index')
const userService = require('../../services/userService')
const orderService = require('../../services/orderService')
const recommendService = require('../../services/recommendService')
const { DEFAULT_AVATAR_URL } = require('../../constants/index')
const { feedback, navigation } = require('../../utils/wechat')

/**
 * 构建未登录状态下的页面数据。
 * @param {Object} app - 小程序实例。
 * @returns {Object} 适用于 setData 的状态对象。
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
    cloudEnvId: app.globalData.cloudEnvId || '未配置'
  }
}

/**
 * 构建已登录状态下的页面数据。
 * @param {Object} app - 小程序实例。
 * @param {Object} currentUser - 当前用户。
 * @returns {Object} 适用于 setData 的状态对象。
 */
function buildLoggedState(app, currentUser) {
  return {
    currentUser,
    hasLogin: true,
    isAdmin: currentUser.role === 'admin',
    draftAvatarUrl: currentUser.avatarUrl || DEFAULT_AVATAR_URL,
    draftNickname: currentUser.nickname || '',
    useMockData: app.globalData.useMockData,
    cloudEnvId: app.globalData.cloudEnvId || '未配置'
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
    featureList: [
      {
        key: 'orders',
        title: '我的订单',
        tip: '查看订单状态与历史记录',
        url: '/pages/orders/index',
        isTab: false
      },
      {
        key: 'order',
        title: '开始点餐',
        tip: '浏览菜品并加入购物车',
        url: '/pages/order/index',
        isTab: true
      },
      {
        key: 'coupon',
        title: '会员权益',
        tip: '模板模块，可扩展积分与优惠券',
        placeholder: true
      },
      {
        key: 'profile',
        title: '收货信息',
        tip: '模板模块，可扩展地址与发票',
        placeholder: true
      }
    ]
  },

  /**
   * 页面初次加载时同步个人中心数据。
   */
  async onLoad() {
    await this.syncUserPage()
  },

  /**
   * 页面显示时刷新用户状态和模块数据。
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
   * 加载登录后的统计和推荐数据。
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
   * 退出当前账号并恢复游客态页面。
   */
  async handleLogout() {
    userService.logoutCurrentUser()
    await this.syncUserPage()
    feedback.showToast('已退出登录')
  },

  /**
   * 打开个人中心功能入口。
   * @param {Object} event - 点击事件对象。
   */
  handleOpenFeature(event) {
    const item = this.data.featureList[
      Number(event.currentTarget.dataset.index)
    ]

    if (item.placeholder) {
      feedback.showError('模板模块，后续可继续扩展')
      return
    }

    navigation.open(item)
  },

  /**
   * 打开后台管理页面。
   */
  openAdminPage() {
    navigation.navigateTo('/pages/admin/index')
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
