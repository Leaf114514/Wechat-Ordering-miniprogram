# 微信点餐小程序 API 能力地图

## 1. 文档目标

这份文档只保留当前点餐项目真正高频、与业务直接相关的微信 API，方便在开发和联调时快速定位：

- 哪个能力已经接入
- 具体解决什么业务问题
- 代码封装放在哪一层
- 后续还能往哪里扩展

项目整体遵循“页面层不直接散写 `wx.*`，统一经 `miniprogram/utils/wechat/` 能力层封装后再使用”的原则。

## 2. 当前已接入的核心 API

| API | 作用 | 业务场景 | 封装位置 | 页面/服务使用位置 |
| --- | --- | --- | --- | --- |
| `wx.login` | 获取微信登录 `code` | 微信登录、换取用户态 | `miniprogram/utils/wechat/auth.js` | `miniprogram/services/userService.js` |
| `wx.showToast` | 轻量提示反馈 | 登录成功、保存成功、错误提示 | `miniprogram/utils/wechat/feedback.js` | 所有页面 |
| `wx.showLoading` / `wx.hideLoading` | 统一加载反馈 | 下单、支付、保存菜品、后台处理订单 | `miniprogram/utils/wechat/feedback.js` | 所有页面 |
| `wx.showModal` | 确认弹窗 | 删除购物车条目、取消订单、退出登录 | `miniprogram/utils/wechat/modal.js` | `pages/order`、`pages/orders`、`pages/user`、`pages/admin` |
| `wx.navigateTo` | 打开非 tabBar 页面 | 进入订单页、进入后台页 | `miniprogram/utils/wechat/navigation.js` | 首页、个人中心、后台 |
| `wx.switchTab` | 切换 tabBar 页面 | 首页、点餐、我的之间切换 | `miniprogram/utils/wechat/navigation.js` | 多页面通用 |
| `wx.navigateBack` | 返回上一级页面 | 通用导航回退能力 | `miniprogram/utils/wechat/navigation.js` | 预留通用能力 |
| `wx.redirectTo` | 替换当前页面跳转 | 通用重定向能力 | `miniprogram/utils/wechat/navigation.js` | 预留通用能力 |
| `wx.getStorageSync` / `wx.setStorageSync` / `wx.removeStorageSync` | 本地缓存持久化 | 购物车、当前用户、Mock 数据、幂等 token | `miniprogram/utils/wechat/storage.js` | `cartService`、`mockStore`、`userService`、`orderService` |
| `wx.stopPullDownRefresh` | 结束下拉刷新 | 首页、点餐页、订单页、后台页刷新完成 | `miniprogram/utils/wechat/page.js` | 多页面通用 |
| `wx.cloud.init` | 初始化云开发 | 小程序启动时连接云开发环境 | `miniprogram/utils/wechat/cloud.js` | `miniprogram/app.js` |
| `wx.cloud.database` | 获取云数据库实例 | 菜品、订单、用户、统计查询 | `miniprogram/utils/wechat/cloud.js` | `miniprogram/services/cloudService.js` |
| `wx.cloud.callFunction` | 调用云函数 | 登录、下单、更新订单状态、后台统计 | `miniprogram/utils/wechat/cloud.js` | 各业务 service |

## 3. 已接入的增强能力

这些能力不是点餐闭环的最低必需项，但能明显提升体验，因此已经做了统一封装：

| API | 作用 | 业务场景 | 封装位置 |
| --- | --- | --- | --- |
| `wx.chooseMedia` | 选择本地图片 | 管理员选择菜品图片 | `miniprogram/utils/wechat/media.js` |
| `wx.previewImage` | 预览大图 | 用户预览菜品图 | `miniprogram/utils/wechat/media.js` |
| `wx.openLocation` | 打开地图定位 | 首页、点餐页、个人中心查看门店位置 | `miniprogram/utils/wechat/location.js` |
| `wx.requestPayment` | 发起支付 | 订单支付流程 | `miniprogram/utils/wechat/payment.js` |

### 支付降级说明

当前版本为了保证“完整可运行”，支付能力采用如下策略：

- 真实商户参数未接入时，`requestPayment` 自动支持 `mock` 模式
- 页面层和业务层不需要感知真实支付与模拟支付差异
- 支付成功后仍会完整走订单状态流转，保证演示链路闭环

## 4. 各能力层职责划分

### `miniprogram/utils/wechat/auth.js`

- 只负责登录凭证获取
- 不处理用户资料同步
- 不处理业务角色判断

### `miniprogram/utils/wechat/feedback.js`

- 只负责 toast 和 loading
- 统一成功、失败、加载反馈
- 避免页面重复写 `showLoading/hideLoading`

### `miniprogram/utils/wechat/modal.js`

- 只负责确认弹窗
- 页面层通过 `await confirm()` 拿结果
- 不混入业务判断

### `miniprogram/utils/wechat/navigation.js`

- 只负责页面跳转
- 兼容字符串和对象两种调用方式
- 页面层无需直接关心原生路由差异

### `miniprogram/utils/wechat/storage.js`

- 只负责本地缓存
- 屏蔽 `try/catch`
- 统一兜底逻辑

### `miniprogram/utils/wechat/cloud.js`

- 只负责云开发基础能力
- 不处理具体业务表结构
- 由 `services/cloudService.js` 进一步适配业务层

### `miniprogram/utils/wechat/media.js`

- 只负责媒体选择与预览
- 不做业务上传逻辑
- 后续若接入云存储，可继续扩展为“选择 + 上传”双阶段能力

### `miniprogram/utils/wechat/location.js`

- 只负责地图位置选择与打开
- 当前主要用于门店导航

### `miniprogram/utils/wechat/payment.js`

- 只负责支付请求
- 当前内置 mock 降级，保证项目可演示

## 5. 为什么这样封装

这样做的核心收益：

1. 页面层只关心“发生了什么交互”，不直接依赖底层 API 细节
2. service 层只关心“业务怎么流转”，不会和页面提示、路由强耦合
3. Mock / 云开发切换时，页面层几乎不用改
4. 后续如果把云开发切换成自建后端，也能把改动控制在能力层和 service 层

## 6. 下一阶段可继续接入的能力

如果项目继续往“正式商用版本”推进，建议下一步优先补齐：

| API | 建议时机 | 可落地场景 |
| --- | --- | --- |
| `wx.chooseAddress` | 做外卖配送时 | 选择收货地址 |
| `wx.chooseLocation` | 做到店自提多门店时 | 选择取餐门店或自定义取餐点 |
| `wx.requestSubscribeMessage` | 需要订单通知时 | 支付成功、制作完成、可取餐提醒 |
| `wx.uploadFile` | 图片需要持久化时 | 管理员上传菜品图到云存储 |

## 7. 官方文档入口

- 微信小程序 API 总览：https://developers.weixin.qq.com/miniprogram/dev/api/
- `wx.login`：https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html
- `wx.showToast`：https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showToast.html
- `wx.showLoading`：https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showLoading.html
- `wx.hideLoading`：https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.hideLoading.html
- `wx.showModal`：https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showModal.html
- `wx.navigateTo`：https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html
- `wx.switchTab`：https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.switchTab.html
- `wx.redirectTo`：https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.redirectTo.html
- `wx.navigateBack`：https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateBack.html
- `wx.getStorageSync`：https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageSync.html
- `wx.setStorageSync`：https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorageSync.html
- `wx.removeStorageSync`：https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.removeStorageSync.html
- `wx.stopPullDownRefresh`：https://developers.weixin.qq.com/miniprogram/dev/api/ui/pull-down-refresh/wx.stopPullDownRefresh.html
- `wx.chooseMedia`：https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseMedia.html
- `wx.previewImage`：https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.previewImage.html
- `wx.openLocation`：https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.openLocation.html
- `wx.requestPayment`：https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html
