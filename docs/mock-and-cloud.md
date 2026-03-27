# Mock 与云开发切换说明

## 1. 切换开关

项目通过 `miniprogram/config/index.js` 中的 `cloudEnvId` 控制模式：

- `cloudEnvId` 为空：自动启用 Mock 模式
- `cloudEnvId` 有值：优先尝试初始化云开发
- 云开发初始化失败：自动回退到 Mock 模式

## 2. 页面层为什么不需要感知切换

页面统一只调用 service 层，例如：

- `userService`
- `dishService`
- `orderService`
- `adminService`
- `recommendService`

service 层内部再判断：

- 走本地 `mockStore`
- 还是走云数据库 / 云函数

这样可以避免页面层出现大量：

```js
if (isMock) {
  ...
} else {
  ...
}
```

## 3. Mock 模式包含什么

Mock 模式已包含：

- 模拟用户
- 模拟菜品
- 模拟订单
- 模拟管理员身份
- 模拟支付成功流程

这样即使没有配置云开发环境，也能完整演示：

- 登录
- 点餐
- 下单
- 支付
- 查看订单
- 再来一单
- 后台管理

## 4. 云开发模式需要准备什么

至少需要完成：

1. 配置正确的 `cloudEnvId`
2. 部署以下云函数：
   - `loginUser`
   - `placeOrder`
   - `updateOrderStatus`
   - `manageDish`
   - `adminDashboard`
   - `recommendDishes`
3. 初始化以下集合：
   - `users`
   - `dishes`
   - `orders`
4. 导入 `database/seed/` 下的初始化数据

## 5. 支付为什么仍支持 Mock 降级

真实微信支付需要：

- 商户号
- 统一下单接口
- 支付签名参数

这些条件通常依赖正式后端和商户配置，因此当前项目先保证：

- 业务闭环可运行
- 页面交互完整
- 状态流转真实

等后续接入正式支付时，只需要替换 `utils/wechat/payment.js` 的实现和支付参数来源。
