# Rich Text Editor

在线文档编辑器，支持富文本编辑和 Markdown 导出。

## 功能特点

- 💡 富文本编辑器（基于 TipTap）
- 🔄 Markdown 导出
- 👥 多用户支持
- 🔒 用户认证与授权
- 📱 响应式设计

## 项目架构

项目采用 Monorepo 结构，使用 npm workspaces 管理：

```
rich-text-editor/
├── client/                 # 前端项目 (Next.js)
│   ├── src/               # 源代码
│   ├── public/            # 静态资源
│   └── package.json       # 前端依赖配置
├── server/                # 后端项目 (Node.js + Express)
│   ├── src/              # 源代码
│   ├── prisma/           # 数据库模型
│   └── package.json      # 后端依赖配置
└── package.json          # 项目根目录配置
```

## 技术栈

### 前端
- Next.js 15.1.4 - React 框架
- TipTap - 富文本编辑器
- Tailwind CSS - 样式框架
- TypeScript - 类型系统

### 后端
- Node.js - 运行环境
- Express - Web 框架
- MongoDB - 数据库
- Prisma - ORM
- TypeScript - 类型系统

## 开发环境设置

1. 克隆项目：
```bash
git clone [项目地址]
cd rich-text-editor
```

2. 安装依赖：
```bash
npm install        # 安装工作区依赖
```

3. 环境变量配置：

前端（client 目录）：
- 复制 `client/.env.example` 到 `client/.env.development`（开发环境）
- 复制 `client/.env.example` 到 `client/.env.production`（生产环境）
- 根据环境修改相应的配置：
  ```env
  # 开发环境 (.env.development)
  NEXT_PUBLIC_API_URL=http://localhost:3002/api  # 本地开发时的后端 API 地址

  # 生产环境 (.env.production)
  NEXT_PUBLIC_API_URL=/api  # 生产环境 API 地址，使用相对路径
  ```

后端（server 目录）：
- 复制 `server/.env.example` 到 `server/.env.development`（开发环境）
- 复制 `server/.env.example` 到 `server/.env.production`（生产环境）
- 根据环境修改相应的配置：
  ```env
  # 开发环境 (.env.development)
  PORT=3002
  NODE_ENV=development
  DATABASE_URL="你的 MongoDB 连接字符串"
  JWT_SECRET=dev-secret-key  # 开发环境密钥
  JWT_EXPIRES_IN=7d
  CORS_ORIGIN=http://localhost:3000

  # 生产环境 (.env.production)
  PORT=3002
  NODE_ENV=production
  DATABASE_URL="你的 MongoDB 连接字符串"
  JWT_SECRET=prod-secret-key  # 生产环境使用更复杂的密钥
  JWT_EXPIRES_IN=7d
  CORS_ORIGIN=https://your-domain.com
  ```

注意：
- 所有环境文件（除了 .env.example）都已添加到 .gitignore
- 确保不要提交包含敏感信息的环境文件
- 生产环境应使用更安全的密钥值
- 前端在 Vercel 部署时会自动使用 .env.production 的配置

4. 数据库设置：
```bash
cd server
npm run prisma:generate  # 生成 Prisma 客户端
npm run prisma:push     # 同步数据库架构
```

## 启动开发环境

你可以选择以下任一方式启动项目：

1. 同时启动所有服务：
```bash
npm run dev  # 在根目录运行，将同时启动前端和后端
```

2. 分别启动服务：
```bash
# 启动前端（在 client 目录或根目录）
npm run client  # 或 cd client && npm run dev

# 启动后端（在 server 目录或根目录）
npm run server  # 或 cd server && npm run dev

# 启动 Prisma Studio（在 server 目录）
cd server && npm run prisma:studio
```

服务访问地址：
- 前端: http://localhost:3000
- 后端 API: http://localhost:3002
- Prisma Studio: http://localhost:5555

## 注意事项

1. 开发规范
- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 提交前运行测试

2. 依赖管理
- 添加前端依赖：`npm install package-name -w @rich-text-editor/client`
- 添加后端依赖：`npm install package-name -w @rich-text-editor/server`
- 添加公共依赖：`npm install package-name -w`

3. 数据库
- 使用 Prisma Studio 可以方便地查看和修改数据
- 修改数据库模型后需要运行 `prisma:generate` 和 `prisma:push`

4. 环境变量
- 项目使用不同的环境文件（.env.development 和 .env.production）区分开发和生产环境
- 所有环境文件（除了 .env.example）都已添加到 .gitignore
- 确保在部署前正确配置生产环境的环境变量
- 前端在 Vercel 部署时会自动使用 .env.production 的配置
- 后端部署时需要确保环境变量与 .env.production 中的配置一致

## 部署

前端项目已部署在 Vercel 上。后端部署说明待补充。

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交改动
4. 推送到分支
5. 创建 Pull Request

## 许可证

[MIT License](LICENSE)
