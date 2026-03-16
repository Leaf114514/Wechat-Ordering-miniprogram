# 数据库与索引建议

> 本文是数据库设计的简版索引建议，完整字段请参考 `docs/database-schema.md`。

## 集合设计

### `dishes`

建议字段：

- `name`：菜品名称
- `category`：分类
- `price`：售价
- `originPrice`：原价
- `stock`：库存
- `sales`：销量
- `image`：图片路径或云存储 fileID
- `isAvailable`：是否上架
- `isManualRecommend`：是否加入首页推荐
- `specs`：规格数组
- `createdAt` / `updatedAt`

推荐索引：

1. `category + isAvailable + sales`：用于点餐页分类筛选与热销排序
2. `isManualRecommend + isAvailable + updatedAt`：用于首页店长推荐
3. `sales`：用于热销榜与推荐降级排序

### `orders`

建议字段：

- `userId`：关联用户 ID
- `openId`：下单用户 openId
- `status`：订单状态
- `items`：订单明细
- `totalPrice`：总价
- `dedupToken`：幂等 token
- `statusTimeline`：状态时间线
- `stockRollbacked`：库存是否已回滚
- `createdAt` / `updatedAt`

推荐索引：

1. `userId + createdAt`：用户订单列表
2. `status + createdAt`：后台待处理订单
3. `dedupToken`：防重复下单
4. `openId + status`：用户授权校验与筛选

### `users`

建议字段：

- `openId`：微信 openId
- `nickname` / `avatarUrl`
- `role`：`customer` / `admin`
- `favoriteCategories`
- `orderCount`
- `totalSpend`
- `lastLoginAt`
- `createdAt` / `updatedAt`

推荐索引：

1. `openId`：登录初始化
2. `role + updatedAt`：管理员权限查询
3. `orderCount`：用户分层运营

## 事务与安全建议

- 下单与取消订单必须走云函数事务，避免库存与订单状态不一致
- 建议在 `orders.dedupToken` 上启用唯一索引
- 管理员写操作全部经云函数执行，并在服务端二次校验 `role=admin`
- 用户身份同步通过 `wx.login` + `wxContext.OPENID` 完成，不在前端持久化敏感凭证
