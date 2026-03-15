const dishService = require('../../services/dishService')
const orderService = require('../../services/orderService')
const adminService = require('../../services/adminService')
const userService = require('../../services/userService')
const { USER_ROLE, CATEGORY_LIST } = require('../../constants/index')

Page({
  data: {
    currentUser: null,
    isAdmin: false,
    activeTab: 'dishes',
    tabs: [
      { key: 'dishes', text: '菜品管理' },
      { key: 'orders', text: '订单处理' },
      { key: 'stats', text: '数据统计' }
    ],
    dishList: [],
    orderList: [],
    dashboard: null,
    editorVisible: false,
    formData: {
      _id: '',
      name: '',
      category: CATEGORY_LIST[1],
      price: '',
      stock: '',
      description: '',
      image: ''
    },
    categoryOptions: CATEGORY_LIST.slice(1)
  },

  /**
   * 页面加载。
   */
  async onLoad() {
    await this.initializePage()
  },

  /**
   * 页面展示时刷新数据。
   */
  async onShow() {
    if (this.data.currentUser) {
      await this.loadAdminData()
    }
  },

  /**
   * 初始化管理员页面。
   */
  async initializePage() {
    const currentUser = await userService.ensureCurrentUser()
    const isAdmin = currentUser.role === USER_ROLE.ADMIN
    this.setData({ currentUser, isAdmin })
    await this.loadAdminData()
  },

  /**
   * 根据权限加载后台数据。
   */
  async loadAdminData() {
    if (!this.data.isAdmin) {
      return
    }

    try {
      const [dishList, orderList, dashboard] = await Promise.all([
        dishService.getAllDishes(true),
        orderService.getOrders({ role: USER_ROLE.ADMIN, status: 'all' }),
        adminService.getDashboard()
      ])

      this.setData({ dishList, orderList, dashboard })
    } catch (error) {
      wx.showToast({
        title: error.message || '后台数据加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 切换演示管理员。
   */
  async promoteMockAdmin() {
    const currentUser = await userService.switchMockRole(USER_ROLE.ADMIN)
    this.setData({ currentUser, isAdmin: true })
    await this.loadAdminData()
  },

  /**
   * 切换后台标签。
   * @param {Object} event - 事件对象。
   */
  handleTabTap(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  },

  /**
   * 打开新增菜品弹窗。
   */
  openCreateEditor() {
    this.setData({
      editorVisible: true,
      formData: {
        _id: '',
        name: '',
        category: CATEGORY_LIST[1],
        price: '',
        stock: '',
        description: '',
        image: ''
      }
    })
  },

  /**
   * 打开编辑菜品弹窗。
   * @param {Object} event - 事件对象。
   */
  openEditEditor(event) {
    this.setData({
      editorVisible: true,
      formData: Object.assign({}, event.currentTarget.dataset.dish)
    })
  },

  /**
   * 关闭编辑弹窗。
   */
  closeEditor() {
    this.setData({ editorVisible: false })
  },

  /**
   * 绑定输入项。
   * @param {Object} event - 事件对象。
   */
  handleFieldInput(event) {
    const field = event.currentTarget.dataset.field
    const formData = Object.assign({}, this.data.formData, {
      [field]: event.detail.value
    })
    this.setData({ formData })
  },

  /**
   * 切换分类字段。
   * @param {Object} event - 事件对象。
   */
  handleCategoryChange(event) {
    const index = Number(event.detail.value)
    const formData = Object.assign({}, this.data.formData, {
      category: this.data.categoryOptions[index]
    })
    this.setData({ formData })
  },

  /**
   * 保存菜品。
   */
  async submitDishForm() {
    const formData = this.data.formData
    if (!formData.name || !formData.price || !formData.stock) {
      wx.showToast({ title: '请完整填写名称、价格、库存', icon: 'none' })
      return
    }

    wx.showLoading({ title: '正在保存' })
    try {
      await adminService.saveDish(formData)
      wx.hideLoading()
      this.setData({ editorVisible: false })
      wx.showToast({ title: '菜品已保存', icon: 'success' })
      await this.loadAdminData()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  },

  /**
   * 切换菜品状态。
   * @param {Object} event - 事件对象。
   */
  async handleDishToggle(event) {
    const dish = event.currentTarget.dataset.dish
    try {
      await adminService.toggleDishStatus(dish._id, !dish.isAvailable)
      wx.showToast({ title: '状态已更新', icon: 'success' })
      await this.loadAdminData()
    } catch (error) {
      wx.showToast({ title: error.message || '更新失败', icon: 'none' })
    }
  },

  /**
   * 更新订单状态。
   * @param {Object} event - 事件对象。
   */
  async handleOrderAction(event) {
    try {
      await orderService.updateOrderStatus({
        orderId: event.currentTarget.dataset.orderId,
        nextStatus: event.currentTarget.dataset.action
      })
      wx.showToast({ title: '订单已处理', icon: 'success' })
      await this.loadAdminData()
    } catch (error) {
      wx.showToast({ title: error.message || '处理失败', icon: 'none' })
    }
  },

  /**
   * 页面跳转。
   * @param {Object} event - 事件对象。
   */
  handleNavigate(event) {
    wx.navigateTo({ url: event.currentTarget.dataset.url })
  },

  /**
   * 阻止弹窗内容区点击冒泡。
   */
  noop() {}
})
