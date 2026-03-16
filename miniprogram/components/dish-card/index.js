Component({
  properties: {
    dish: {
      type: Object,
      value: {}
    }
  },

  methods: {
    /**
     * 统一派发菜品卡片事件。
     * 组件层只负责透传菜品数据，页面层再决定具体业务动作。
     * @param {string} eventName - 自定义事件名称。
     */
    emitDishEvent(eventName) {
      this.triggerEvent(eventName, {
        dish: this.properties.dish
      })
    },

    /**
     * 点击菜品图片或卡片主体时，统一打开详情/规格弹窗。
     */
    handleTap() {
      this.emitDishEvent('dishselect')
    },

    /**
     * 点击加购按钮。
     */
    handleAdd() {
      this.emitDishEvent('dishadd')
    }
  }
})
