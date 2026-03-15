const { formatCurrency } = require('../../utils/formatter')

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    dish: {
      type: Object,
      value: null
    }
  },

  data: {
    selectedMap: {},
    quantity: 1,
    finalPriceText: '0.00'
  },

  observers: {
    'visible, dish': function (visible, dish) {
      if (visible && dish) {
        this.initializeState(dish)
      }
    }
  },

  methods: {
    /**
     * 阻止内容区点击冒泡。
     */
    noop() {},

    /**
     * 初始化规格选择状态。
     * @param {Object} dish - 菜品对象。
     */
    initializeState(dish) {
      const selectedMap = {}
      ;(dish.specs || []).forEach((group) => {
        const firstOption = group.options && group.options[0]
        if (firstOption) {
          selectedMap[group.name] = firstOption.label
        }
      })

      this.setData({
        selectedMap,
        quantity: 1
      })
      this.refreshPrice()
    },

    /**
     * 更新规格选择。
     * @param {Object} event - 事件对象。
     */
    handleOptionTap(event) {
      const groupName = event.currentTarget.dataset.group
      const optionLabel = event.currentTarget.dataset.option
      const selectedMap = Object.assign({}, this.data.selectedMap, {
        [groupName]: optionLabel
      })

      this.setData({ selectedMap })
      this.refreshPrice()
    },

    /**
     * 减少数量。
     */
    decrease() {
      if (this.data.quantity <= 1) {
        return
      }

      this.setData({ quantity: this.data.quantity - 1 })
      this.refreshPrice()
    },

    /**
     * 增加数量。
     */
    increase() {
      this.setData({ quantity: this.data.quantity + 1 })
      this.refreshPrice()
    },

    /**
     * 计算当前总价。
     */
    refreshPrice() {
      const dish = this.properties.dish || {}
      let finalPrice = Number(dish.price || 0)

      ;(dish.specs || []).forEach((group) => {
        const selectedLabel = this.data.selectedMap[group.name]
        const selectedOption = (group.options || []).find((option) => {
          return option.label === selectedLabel
        })
        finalPrice += Number(selectedOption && selectedOption.delta || 0)
      })

      finalPrice *= this.data.quantity
      this.setData({
        finalPriceText: formatCurrency(finalPrice)
      })
    },

    /**
     * 关闭弹窗。
     */
    close() {
      this.triggerEvent('close')
    },

    /**
     * 确认规格选择。
     */
    confirm() {
      const dish = this.properties.dish || {}
      const selections = (dish.specs || []).map((group) => {
        const selectedLabel = this.data.selectedMap[group.name]
        const selectedOption = (group.options || []).find((option) => {
          return option.label === selectedLabel
        }) || { label: selectedLabel, delta: 0 }

        return {
          groupName: group.name,
          optionLabel: selectedOption.label,
          delta: selectedOption.delta || 0
        }
      })

      this.triggerEvent('confirm', {
        dish,
        selections,
        quantity: this.data.quantity,
        totalPriceText: this.data.finalPriceText
      })
    }
  }
})
