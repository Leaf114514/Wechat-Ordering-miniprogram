const config = require('../../config/index')
const dishService = require('../../services/dishService')
const orderService = require('../../services/orderService')
const adminService = require('../../services/adminService')
const userService = require('../../services/userService')
const { CATEGORY_LIST, USER_ROLE, PAGE_ROUTES } = require('../../constants/index')
const {
  feedback,
  navigation,
  modal,
  media,
  page: pageActions
} = require('../../utils/wechat/index')

/**
 * 创建后台菜品表单的默认值。
 * @returns {Object} 默认表单对象。
 */
function createDefaultDishForm() {
  return {
    _id: '',
    name: '',
    category: CATEGORY_LIST[1],
    price: '',
    stock: '',
    description: '',
    image: '',
    isAvailable: true,
    isManualRecommend: false
  }
}

Page({
  data: {
    currentUser: null,
    isLoggedIn: false,
    isAdmin: false,
    activeTab: 'recommend',
    tabs: [
      { key: 'recommend', text: '首页推荐' },
      { key: 'dishes', text: '菜品管理' },
      { key: 'orders', text: '订单处理' },
      { key: 'stats', text: '数据统计' }
    ],
    dishList: [],
    orderList: [],
    dashboard: null,
    recommendCount: 0,
    editorVisible: false,
    formData: createDefaultDishForm(),
    categoryOptions: CATEGORY_LIST.slice(1),
    useMockData: config.useMockData,
    loading: true,
    errorMessage: ''
  },

  /**
   * 页面加载时记录当前激活标签并同步后台状态。
   * @param {Object} options - 页面参数。
   */
  async onLoad(options) {
    this.setData({
      activeTab: options.tab || 'recommend'
    })
    await this.syncAdminState()
  },

  /**
   * 页面显示时重新同步后台数据。
   */
  async onShow() {
    await this.syncAdminState()
  },

  /**
   * 后台页支持下拉刷新。
   */
  async onPullDownRefresh() {
    await pageActions.withPullDownRefresh(() => this.syncAdminState())
  },

  /**
   * 同步当前登录状态和管理员权限。
   */
  async syncAdminState() {
    const app = getApp()
    const currentUser = userService.getCachedUser()
    const isLoggedIn = Boolean(currentUser)
    const isAdmin = Boolean(currentUser && currentUser.role === USER_ROLE.ADMIN)

    this.setData({
      currentUser,
      isLoggedIn,
      isAdmin,
      useMockData: app.globalData.useMockData
    })

    if (isAdmin) {
      await this.loadAdminData()
      return
    }

    this.setData({
      loading: false,
      errorMessage: '',
      dishList: [],
      orderList: [],
      dashboard: null
    })
  },

  /**
   * 拉取后台页面所需的全部数据。
   */
  async loadAdminData() {
    this.setData({
      loading: true,
      errorMessage: ''
    })

    try {
      const [dishList, orderList, dashboard] = await Promise.all([
        dishService.getAllDishes(true),
        orderService.getOrders({ role: USER_ROLE.ADMIN, status: 'all' }),
        adminService.getDashboard()
      ])

      this.setData({
        dishList,
        orderList,
        dashboard,
        recommendCount: dishList.filter((item) => item.isManualRecommend).length
      })
    } catch (error) {
      const errorMessage = error.message || '后台数据加载失败'
      this.setData({
        errorMessage
      })
      feedback.showError(errorMessage)
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 统一执行后台操作，并在成功后刷新数据。
   * @param {Function} task - 具体业务任务。
   * @param {string} successMessage - 成功提示文案。
   * @param {string} loadingMessage - 可选 loading 文案。
   */
  async runAdminAction(task, successMessage, loadingMessage) {
    try {
      if (loadingMessage) {
        await feedback.withLoading(loadingMessage, task)
      } else {
        await task()
      }

      feedback.showSuccess(successMessage)
      await this.loadAdminData()
    } catch (error) {
      feedback.showError(error.message || '操作失败')
    }
  },

  /**
   * 切换后台标签页。
   * @param {Object} event - 点击事件对象。
   */
  handleTabTap(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  },

  /**
   * 切换首页推荐状态。
   * @param {Object} event - 点击事件对象。
   */
  async handleRecommendToggle(event) {
    const dish = this.data.dishList[
      Number(event.currentTarget.dataset.index)
    ]

    if (!dish) {
      return
    }

    await this.runAdminAction(() => {
      return adminService.setManualRecommend(dish._id, !dish.isManualRecommend)
    }, '首页推荐已更新')
  },

  /**
   * 打开新增菜品编辑器。
   */
  openCreateEditor() {
    this.setData({
      editorVisible: true,
      formData: createDefaultDishForm()
    })
  },

  /**
   * 打开编辑菜品编辑器。
   * @param {Object} event - 点击事件对象。
   */
  openEditEditor(event) {
    const dish = this.data.dishList[
      Number(event.currentTarget.dataset.index)
    ]

    this.setData({
      editorVisible: true,
      formData: Object.assign({}, dish)
    })
  },

  /**
   * 关闭编辑器弹窗。
   */
  closeEditor() {
    this.setData({
      editorVisible: false,
      formData: createDefaultDishForm()
    })
  },

  /**
   * 更新表单字段。
   * @param {Object} event - 输入事件对象。
   */
  handleFieldInput(event) {
    const field = event.currentTarget.dataset.field
    const formData = Object.assign({}, this.data.formData, {
      [field]: event.detail.value
    })

    this.setData({ formData })
  },

  /**
   * 处理分类选择变更。
   * @param {Object} event - picker 事件对象。
   */
  handleCategoryChange(event) {
    const index = Number(event.detail.value)
    const formData = Object.assign({}, this.data.formData, {
      category: this.data.categoryOptions[index]
    })

    this.setData({ formData })
  },

  /**
   * 为菜品选择图片。
   * 当前版本优先支持 mock 与本地临时图片预览，真实环境可继续接入上传云存储。
   */
  async handleChooseImage() {
    try {
      const image = await media.chooseSingleImage()
      if (!image) {
        return
      }

      this.setData({
        formData: Object.assign({}, this.data.formData, {
          image
        })
      })
    } catch (error) {
      feedback.showError(error.message || '选择图片失败')
    }
  },

  /**
   * 切换表单中的推荐状态。
   */
  handleFormRecommendSwitch() {
    const formData = Object.assign({}, this.data.formData, {
      isManualRecommend: !this.data.formData.isManualRecommend
    })

    this.setData({ formData })
  },

  /**
   * 提交菜品表单。
   */
  async submitDishForm() {
    try {
      await feedback.withLoading('正在保存菜品', () => {
        return adminService.saveDish(this.data.formData)
      })
      this.setData({ editorVisible: false })
      feedback.showSuccess('菜品已保存')
      await this.loadAdminData()
    } catch (error) {
      feedback.showError(error.message || '保存失败')
    }
  },

  /**
   * 切换菜品上下架状态。
   * @param {Object} event - 点击事件对象。
   */
  async handleDishToggle(event) {
    const dish = this.data.dishList[
      Number(event.currentTarget.dataset.index)
    ]

    if (!dish) {
      return
    }

    const confirmed = await modal.confirm({
      title: dish.isAvailable ? '下架菜品' : '上架菜品',
      content: dish.isAvailable
        ? '下架后用户将无法继续点到这道菜，确认继续吗？'
        : '确认重新上架这道菜吗？'
    })

    if (!confirmed) {
      return
    }

    await this.runAdminAction(() => {
      return adminService.toggleDishStatus(dish._id, !dish.isAvailable)
    }, '菜品状态已更新')
  },

  /**
   * 处理后台订单状态流转。
   * @param {Object} event - 订单操作事件对象。
   */
  async handleOrderAction(event) {
    const order = this.data.orderList[
      Number(event.currentTarget.dataset.index)
    ]
    const action = event.currentTarget.dataset.action

    if (!order) {
      return
    }

    const confirmed = await modal.confirm({
      title: '处理订单',
      content: `确认执行“${action === 'completed' ? '完成出餐' : action === 'cancelled' ? '取消订单' : '开始制作'}”吗？`
    })

    if (!confirmed) {
      return
    }

    await this.runAdminAction(() => {
      return orderService.updateOrderStatus({
        orderId: order._id,
        nextStatus: action
      })
    }, '订单已处理')
  },

  /**
   * 在 mock 模式下切换到管理员身份。
   */
  async promoteMockAdmin() {
    await userService.switchMockRole(USER_ROLE.ADMIN)
    await this.syncAdminState()
    feedback.showSuccess('已切换为管理员演示身份')
  },

  /**
   * 跳转到个人中心。
   */
  goUserTab() {
    navigation.switchTab(PAGE_ROUTES.USER)
  },

  /**
   * 返回首页。
   */
  goHomeTab() {
    navigation.switchTab(PAGE_ROUTES.HOME)
  },

  /**
   * 阻止弹窗内容区域点击冒泡。
   */
  noop() {}
})
