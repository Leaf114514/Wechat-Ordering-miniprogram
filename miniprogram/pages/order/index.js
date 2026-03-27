const config = require('../../config/index')
const dishService = require('../../services/dishService')
const cartService = require('../../services/cartService')
const orderService = require('../../services/orderService')
const userService = require('../../services/userService')
const { PAGE_ROUTES } = require('../../constants/index')
const {
  feedback,
  navigation,
  page: pageActions,
  modal,
  location
} = require('../../utils/wechat/index')

/**
 * 在需要登录的场景中统一提示并跳转到个人中心。
 * 该逻辑仅服务当前点餐页，因此保留在页面局部，避免过度抽象。
 * @param {string} message - 提示文案。
 */
function redirectToUserTabWithMessage(message) {
  feedback.showError(message)
  navigation.switchTabLater(PAGE_ROUTES.USER, 300)
}

Page({
  data: {
    categories: [],
    activeCategory: '全部',
    dishList: [],
    cartItems: [],
    cartSummary: {
      totalCount: 0,
      totalPrice: 0,
      totalPriceText: '0.00'
    },
    currentUser: null,
    isLoggedIn: false,
    activeDish: null,
    specPopupVisible: false,
    pageNo: 1,
    hasMore: true,
    loading: true,
    loadingMore: false,
    errorMessage: '',
    remark: '',
    restaurantProfile: config.restaurantProfile
  },

  /**
   * 页面加载时初始化分类、菜品和用户状态。
   */
  async onLoad() {
    await this.initializePage()
  },

  /**
   * 页面展示时同步购物车和登录态。
   */
  onShow() {
    this.syncCartState()
    this.syncUserState()
  },

  /**
   * 处理下拉刷新。
   */
  async onPullDownRefresh() {
    await pageActions.withPullDownRefresh(() => this.reloadDishFeed())
  },

  /**
   * 触底时继续加载下一页菜品。
   */
  async onReachBottom() {
    if (!this.data.hasMore || this.data.loadingMore || this.data.loading) {
      return
    }

    await this.loadDishFeed(false)
  },

  /**
   * 初始化点餐页核心数据。
   */
  async initializePage() {
    try {
      const categories = await dishService.getCategoryList()
      this.setData({ categories })
      await this.reloadDishFeed()
      this.syncCartState()
      this.syncUserState()
    } catch (error) {
      const errorMessage = error.message || '点餐页初始化失败'
      this.setData({
        loading: false,
        errorMessage
      })
      feedback.showError(errorMessage)
    }
  },

  /**
   * 同步当前登录状态。
   */
  syncUserState() {
    const currentUser = userService.getCachedUser()
    this.setData({
      currentUser,
      isLoggedIn: Boolean(currentUser)
    })
  },

  /**
   * 从第一页重新拉取菜品列表。
   */
  async reloadDishFeed() {
    this.setData({
      pageNo: 1,
      dishList: [],
      hasMore: true,
      errorMessage: ''
    })
    await this.loadDishFeed(true)
  },

  /**
   * 加载菜品流数据。
   * @param {boolean} reset - 是否从第一页开始加载。
   */
  async loadDishFeed(reset) {
    const pageNo = reset ? 1 : this.data.pageNo + 1

    this.setData(reset ? { loading: true } : { loadingMore: true })

    try {
      const result = await dishService.getHomeFeed({
        category: this.data.activeCategory,
        pageNo,
        pageSize: config.pageSize
      })
      const dishList = reset
        ? result.list
        : this.data.dishList.concat(result.list)

      this.setData({
        pageNo,
        dishList,
        hasMore: result.hasMore,
        errorMessage: ''
      })
    } catch (error) {
      const errorMessage = error.message || '菜品加载失败'
      this.setData({
        errorMessage
      })
      feedback.showError(errorMessage)
    } finally {
      this.setData({
        loading: false,
        loadingMore: false
      })
    }
  },

  /**
   * 切换菜品分类并刷新列表。
   * @param {Object} event - 点击事件对象。
   */
  async handleCategoryTap(event) {
    const category = event.currentTarget.dataset.category
    if (category === this.data.activeCategory) {
      return
    }

    this.setData({ activeCategory: category })
    await this.reloadDishFeed()
  },

  /**
   * 打开规格弹窗。
   * @param {Object} event - 菜品卡片事件对象。
   */
  handleDishSelect(event) {
    const dish = event.detail.dish
    this.setData({
      activeDish: dish,
      specPopupVisible: true
    })
  },

  /**
   * 快速加购。
   * 有规格的菜品仍走规格弹窗，避免页面层直接拼装复杂商品数据。
   * @param {Object} event - 菜品事件对象。
   */
  handleAddDish(event) {
    const dish = event.detail.dish
    if (dish.specs && dish.specs.length) {
      this.handleDishSelect(event)
      return
    }

    try {
      cartService.addCartItem(dish, [], 1)
      this.syncCartState()
      feedback.showSuccess('已加入购物车')
    } catch (error) {
      feedback.showError(error.message || '加入购物车失败')
    }
  },

  /**
   * 关闭规格弹窗。
   */
  handleSpecClose() {
    this.setData({ specPopupVisible: false })
  },

  /**
   * 确认规格选择并加入购物车。
   * @param {Object} event - 规格弹窗确认事件。
   */
  handleSpecConfirm(event) {
    const detail = event.detail

    try {
      cartService.addCartItem(detail.dish, detail.selections, detail.quantity)
      this.setData({ specPopupVisible: false })
      this.syncCartState()
      feedback.showSuccess('加入成功')
    } catch (error) {
      feedback.showError(error.message || '加入购物车失败')
    }
  },

  /**
   * 同步购物车视图数据。
   */
  syncCartState() {
    const cartItems = cartService.getCartItems()
    const cartSummary = cartService.getCartSummary(cartItems)
    this.setData({ cartItems, cartSummary })
  },

  /**
   * 处理购物车数量变更或删除动作。
   * @param {Object} event - 购物车组件事件。
   */
  async handleCartChange(event) {
    const detail = event.detail

    if (detail.type === 'quantity') {
      try {
        cartService.updateCartCount(detail.itemKey, detail.delta)
        this.syncCartState()
      } catch (error) {
        feedback.showError(error.message || '购物车更新失败')
      }
      return
    }

    if (detail.type === 'delete') {
      const confirmed = await modal.confirm({
        title: '移除菜品',
        content: '确认将这份菜品从购物车中移除吗？'
      })

      if (!confirmed) {
        return
      }

      cartService.removeCartItem(detail.itemKey)
      this.syncCartState()
      feedback.showSuccess('已移除')
    }
  },

  /**
   * 记录订单备注输入。
   * @param {Object} event - 输入事件对象。
   */
  handleRemarkInput(event) {
    this.setData({ remark: event.detail.value })
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
   * 提交订单，并在成功后清空购物车与跳转订单页。
   */
  async handleCheckout() {
    if (!this.data.cartItems.length) {
      feedback.showError('购物车还是空的，先选几道喜欢的菜吧')
      return
    }

    if (!this.data.isLoggedIn) {
      redirectToUserTabWithMessage('请先登录后再下单')
      return
    }

    try {
      const result = await feedback.withLoading('正在创建订单', () => {
        return orderService.placeOrder({
          cartItems: this.data.cartItems,
          totalPrice: this.data.cartSummary.totalPrice,
          remark: this.data.remark
        })
      })

      cartService.clearCartItems()
      this.syncCartState()
      this.setData({ remark: '' })
      feedback.showSuccess(`下单成功，合计 ¥${result.totalPriceText}`)
      await this.reloadDishFeed()
      navigation.navigateTo(PAGE_ROUTES.ORDERS)
    } catch (error) {
      feedback.showError(error.message || '创建订单失败')
    }
  },

  /**
   * 打开订单列表页，未登录时先引导登录。
   */
  openOrdersPage() {
    if (!this.data.isLoggedIn) {
      redirectToUserTabWithMessage('请先登录后查看订单')
      return
    }

    navigation.navigateTo(PAGE_ROUTES.ORDERS)
  },

  /**
   * 跳转到个人中心。
   */
  goUserTab() {
    navigation.switchTab(PAGE_ROUTES.USER)
  }
})
