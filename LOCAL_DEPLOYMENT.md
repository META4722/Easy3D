# 3D打印平台 - 本地部署指南

## 环境要求

- Node.js 18+ 
- Bun (已安装)
- Supabase 账号

## 部署步骤

### 1. 克隆并安装依赖

```bash
cd 3d-printing-platform
bun install
```

### 2. 设置 Supabase 数据库

#### 2.1 创建 Supabase 项目
1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project" 创建新项目
4. 选择组织，输入项目名称（如：3d-printing-platform）
5. 设置数据库密码
6. 选择地区（建议选择离你最近的）
7. 等待项目创建完成

#### 2.2 获取项目配置
项目创建完成后：
1. 进入项目 Dashboard
2. 点击左侧 "Settings" → "API"
3. 复制以下信息：
   - Project URL
   - anon public key
   - service_role key

#### 2.3 更新环境变量
编辑 `.env.local` 文件，替换以下配置：

```bash
# 替换为你的真实 Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 其他配置保持不变
FAST3D_API_KEY=demo_fast3d_api_key
NEXTAUTH_SECRET=demo_secret_for_development_only
NEXTAUTH_URL=http://localhost:3000
```

#### 2.4 初始化数据库
1. 在 Supabase Dashboard 中，点击左侧 "SQL Editor"
2. 点击 "New Query"
3. 复制 `supabase/schema.sql` 文件的内容
4. 粘贴到查询编辑器中
5. 点击 "Run" 执行 SQL

### 3. 启动开发服务器

```bash
bun run dev
```

服务器将在 http://localhost:3000 启动

### 4. 验证部署

打开浏览器访问 http://localhost:3000，你应该能看到：
- 3D打印平台首页
- 导航到 `/generate` 页面测试AI生成功能
- 注册/登录功能正常工作

## 功能说明

### 当前可用功能
- ✅ 用户注册/登录
- ✅ AI模型生成界面（演示模式）
- ✅ 3D模型预览
- ✅ 订单管理界面
- ✅ 管理后台

### 需要额外配置的功能
- ❌ Fast3D API（需要真实API密钥）
- ❌ 支付集成
- ❌ 打印机集成

## 故障排除

### 常见问题

1. **Supabase 连接失败**
   - 检查 `.env.local` 中的配置是否正确
   - 确认 Supabase 项目状态正常

2. **依赖安装失败**
   ```bash
   rm -rf node_modules
   rm bun.lockb
   bun install
   ```

3. **端口被占用**
   ```bash
   # 使用其他端口
   bun run dev -- -p 3001
   ```

4. **TypeScript 错误**
   ```bash
   bun run lint
   ```

### 开发命令

```bash
# 开发模式
bun run dev

# 构建生产版本
bun run build

# 启动生产服务器
bun run start

# 代码检查
bun run lint

# 代码格式化
bun run format
```

## 下一步

1. 配置真实的 Fast3D API 密钥以启用AI生成功能
2. 集成支付系统（Stripe/支付宝等）
3. 配置文件存储（Supabase Storage）
4. 部署到生产环境

## 技术支持

如遇到问题，请检查：
- Node.js 和 Bun 版本
- Supabase 项目状态
- 环境变量配置
- 网络连接