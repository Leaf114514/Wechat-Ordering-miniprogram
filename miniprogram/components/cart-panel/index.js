Component({
  properties: {
    items: {
      type: Array,
      value: []
    },
    summary: {
      type: Object,
      value: {
        totalCount: 0,
        totalPriceText: '0.00'
      }
    }
  },

  data: {
    expanded: false,
    touchStartX: 0,
    activeSwipeKey: '',
    animatedKey: ''
  },

  methods: {
    /**
     * 展开或收起购物车面板。
     */
    togglePanel() {
      if (!this.properties.items.length) {
        return
      }

      this.setData({
        expanded: !this.data.expanded,
        activeSwipeKey: ''
      })
    },

    /**
     * 记录滑动起点。
     * @param {Object} event - 事件对象。
     */
    handleTouchStart(event) {
      this.setData({
        touchStartX: event.changedTouches[0].clientX
      })
    },

    /**
     * 判断是否显示删除按钮。
     * @param {Object} event - 事件对象。
     */
    handleTouchEnd(event) {
      const endX = event.changedTouches[0].clientX
      const delta = this.data.touchStartX - endX
      const itemKey = event.currentTarget.dataset.key

      this.setData({
        activeSwipeKey: delta > 36 ? itemKey : ''
      })
    },

    /**
     * 调整商品数量。
     * @param {Object} event - 事件对象。
     */
    changeQuantity(event) {
      const itemKey = event.currentTarget.dataset.key
      const delta = Number(event.currentTarget.dataset.delta)
      this.setData({ animatedKey: itemKey })
      setTimeout(() => {
        this.setData({ animatedKey: '' })
      }, 220)

      this.triggerEvent('change', {
        type: 'quantity',
        itemKey,
        delta
      })
    },

    /**
     * 删除购物车条目。
     * @param {Object} event - 事件对象。
     */
    deleteItem(event) {
      const itemKey = event.currentTarget.dataset.key
      this.setData({ activeSwipeKey: '' })
      this.triggerEvent('change', {
        type: 'delete',
        itemKey
      })
    },

    /**
     * 触发结算。
     */
    checkout() {
      this.triggerEvent('checkout')
    }
  }
})
