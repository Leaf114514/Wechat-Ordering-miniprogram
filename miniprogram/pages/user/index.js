const config = require('../../config/index')
const userService = require('../../services/userService')
const orderService = require('../../services/orderService')
const recommendService = require('../../services/recommendService')
const { DEFAULT_AVATAR_URL } = require('../../constants/index')

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
   * 页面加载。
   */
  async onLoad() {
    await this.syncUserPage()
  },

  /**
   * 页面展示时刷新用户状态。
   */
  async onShow() {
    await this.syncUserPage()
  },

  /**
   * 同步用户页数据。
   */
  async syncUserPage() {
    const app = getApp()
    const currentUser = userService.getCachedUser()

    if (!currentUser) {
      this.setData({
        currentUser: null,
        hasLogin: false,
        isAdmin: false,
        metrics: null,
        recommendList: [],
        draftAvatarUrl: DEFAULT_AVATAR_URL,
        draftNickname: '',
        useMockData: app.globalData.useMockData,
        cloudEnvId: app.globalData.cloudEnvId || '未配置'
      })
      return
    }

    this.setData({
      currentUser,
      hasLogin: true,
      isAdmin: currentUser.role === 'admin',
      draftAvatarUrl: currentUser.avatarUrl || DEFAULT_AVATAR_URL,
      draftNickname: currentUser.nickname || '',
      useMockData: app.globalData.useMockData,
      cloudEnvId: app.globalData.cloudEnvId || '未配置'
    })

    await this.loadUserModules(currentUser)
  },

  /**
   * 加载登录后的模块数据。
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
      wx.showToast({
        title: error.message || '个人信息加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 选择微信头像。
   * @param {Object} event - 事件对象。
   */
  handleChooseAvatar(event) {
    this.setData({
      draftAvatarUrl: event.detail.avatarUrl || DEFAULT_AVATAR_URL
    })
  },

  /**
   * 输入微信昵称。
   * @param {Object} event - 事件对象。
   */
  handleNickNameInput(event) {
    this.setData({
      draftNickname: event.detail.value
    })
  },

  /**
   * 执行微信登录。
   */
  async handleWechatLogin() {
    wx.showLoading({ title: '登录中' })
    try {
      await userService.loginWithWechatProfile({
        avatarUrl: this.data.draftAvatarUrl,
        nickname: this.data.draftNickname
      })
      wx.hideLoading()
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
      await this.syncUserPage()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    }
  },

  /**
   * 退出当前登录。
   */
  async handleLogout() {
    userService.logoutCurrentUser()
    await this.syncUserPage()
    wx.showToast({
      title: '已退出登录',
      icon: 'none'
    })
  },

  /**
   * 打开功能入口。
   * @param {Object} event - 事件对象。
   */
  handleOpenFeature(event) {
    const item = this.data.featureList[
      Number(event.currentTarget.dataset.index)
    ]
    if (item.placeholder) {
      wx.showToast({
        title: '模板模块，后续可继续扩展',
        icon: 'none'
      })
      return
    }

    if (item.isTab) {
      wx.switchTab({ url: item.url })
      return
    }

    wx.navigateTo({ url: item.url })
  },

  /**
   * 打开管理员页面。
   */
  openAdminPage() {
    wx.navigateTo({ url: '/pages/admin/index' })
  },

  /**
   * 切换 Mock 身份。
   * @param {Object} event - 事件对象。
   */
  async handleMockRoleSwitch(event) {
    const role = event.currentTarget.dataset.role
    await userService.switchMockRole(role)
    await this.syncUserPage()
    wx.showToast({
      title: '演示身份已切换',
      icon: 'success'
    })
  }
})
