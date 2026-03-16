const config = require('../../config/index')
const dishService = require('../../services/dishService')
const recommendService = require('../../services/recommendService')
const userService = require('../../services/userService')
const { PAGE_ROUTES, USER_ROLE } = require('../../constants/index')
const {
  feedback,
  navigation,
  page: pageActions,
  location
} = require('../../utils/wechat/index')

Page({
  data: {
    currentUser: null,
    isAdmin: false,
    loading: true,
    errorMessage: '',
    manualRecommendList: [],
    personalRecommendList: [],
    topSalesList: [],
    restaurantProfile: config.restaurantProfile
  },

  /**
   * 页面首次加载时拉取首页数据。
   */
  async onLoad() {
    await this.loadPageData()
  },

  /**
   * 页面重新展示时同步最新数据，保证登录态与推荐内容实时更新。
   */
  async onShow() {
    await this.loadPageData()
  },

  /**
   * 首页支持下拉刷新，并在结束时统一关闭刷新动画。
   */
  async onPullDownRefresh() {
    await pageActions.withPullDownRefresh(() => this.loadPageData())
  },

  /**
   * 加载首页所需的用户、推荐和热销数据。
   */
  async loadPageData() {
    const currentUser = userService.getCachedUser()

    this.setData({
      currentUser,
      isAdmin: Boolean(currentUser && currentUser.role === USER_ROLE.ADMIN),
      loading: true,
      errorMessage: ''
    })

    try {
      const [manualRecommendList, topSalesList, personalRecommendList] =
        await Promise.all([
          dishService.getManualRecommendDishes(4),
          dishService.getTopSalesDishes(6),
          currentUser
            ? recommendService.getPersonalRecommendations({
              userId: currentUser._id,
              limit: 3
            })
            : Promise.resolve([])
        ])

      this.setData({
        manualRecommendList,
        topSalesList,
        personalRecommendList
      })
    } catch (error) {
      const errorMessage = error.message || '首页数据加载失败'
      this.setData({
        errorMessage
      })
      feedback.showError(errorMessage)
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 跳转到点餐页。
   */
  goOrderTab() {
    navigation.switchTab(PAGE_ROUTES.ORDER)
  },

  /**
   * 跳转到个人中心。
   */
  goUserTab() {
    navigation.switchTab(PAGE_ROUTES.USER)
  },

  /**
   * 打开订单列表，未登录时先引导到个人中心。
   */
  openOrdersPage() {
    const currentUser = userService.getCachedUser()
    if (!currentUser) {
      feedback.showError('请先登录后查看订单')
      navigation.switchTabLater(PAGE_ROUTES.USER, 300)
      return
    }

    navigation.navigateTo(PAGE_ROUTES.ORDERS)
  },

  /**
   * 打开门店定位，提升真实点餐场景下的到店体验。
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
   * 打开后台推荐管理页，仅管理员可见入口。
   */
  openRecommendManager() {
    navigation.navigateTo(`${PAGE_ROUTES.ADMIN}?tab=recommend`)
  }
})
