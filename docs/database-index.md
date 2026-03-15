# 数据库与索引建议

## 集合设计

### dishes

建议字段：

- `name`：菜品名称
- `category`：分类
- `price`：售价
- `originPrice`：原价
- `stock`：库存
- `sales`：销量
- `image`：图片路径或云存储 fileID
- `isAvailable`：是否上架
- `specs`：规格数组
- `createdAt` / `updatedAt`

推荐索引：

1. `category + isAvailable + sales` 复合索引，用于首页分类检索与热销排序
2. `isAvailable + updatedAt` 复合索引，用于后台上下架列表
3. `sales` 单字段索引，用于热销榜与推荐降级策略

### orders

建议字段：

- `userId`：关联用户文档 ID
- `openId`：下单用户 openId
- `status`：订单状态
- `items`：订单菜品明细
- `totalPrice`：总价
- `dedupToken`：幂等 token
- `statusTimeline`：状态时间线
- `stockRollbacked`：库存是否回滚
- `createdAt` / `updatedAt`

推荐索引：

1. `userId + createdAt` 复合索引，用于用户订单列表
2. `status + createdAt` 复合索引，用于后台待处理订单
3. `dedupToken` 唯一索引，用于服务端防重复下单
4. `openId + status` 复合索引，用于用户订单授权校验与状态筛选

### users

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

1. `openId` 唯一索引，用于登录初始化
2. `role + updatedAt` 复合索引，用于管理员权限查询
3. `orderCount` 单字段索引，用于用户分层运营

## 事务与安全建议

- 下单与取消订单务必走云函数事务，避免库存与订单状态不一致。
- 建议在 `orders.dedupToken` 上启用唯一索引，配合客户端防重守卫双层兜底。
- 管理员写操作全部经云函数执行，并在服务端二次校验 `role=admin`。
