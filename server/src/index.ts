import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// 详细的请求日志中间件
app.use((req, res, next) => {
  console.log('\n--- 请求开始 ---');
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`方法: ${req.method}`);
  console.log(`路径: ${req.path}`);
  console.log(`完整URL: ${req.url}`);
  console.log('查询参数:', req.query);
  console.log('请求头:', req.headers);
  console.log('请求体:', req.body);
  console.log('--- 请求详情结束 ---\n');
  
  // 记录响应
  const originalSend = res.send;
  res.send = function (body) {
    console.log('\n--- 响应开始 ---');
    console.log('状态码:', res.statusCode);
    console.log('响应头:', res.getHeaders());
    console.log('响应体:', body);
    console.log('--- 响应结束 ---\n');
    return originalSend.call(this, body);
  };
  
  next();
});

// 配置 CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://rich-text-editor-omega.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
};

// CORS 预检请求处理
app.options('*', (req, res, next) => {
  console.log('\n--- CORS 预检请求 ---');
  console.log('请求头:', req.headers);
  console.log('CORS 配置:', corsOptions);
  next();
}, cors(corsOptions));

app.use(cors(corsOptions));
app.use(express.json());

// 路由配置
console.log('配置认证路由: /auth/*');
app.use('/auth', authRoutes);

// 404 处理中间件
app.use((req, res, next) => {
  console.log(`\n!!! 404 错误 - 未找到路由: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: '未找到路由',
    method: req.method,
    path: req.path,
    url: req.url
  });
});

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('\n!!! 服务器错误 !!!');
  console.error('错误详情:', err);
  console.error('请求信息:', {
    method: req.method,
    path: req.path,
    headers: req.headers
  });
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
    path: req.path,
    method: req.method
  });
});

// 启动服务器
app.listen(port, () => {
  console.log('\n=== 服务器启动 ===');
  console.log(`服务器运行在端口: ${port}`);
  console.log('环境配置:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: port,
    CORS_ORIGIN: process.env.CORS_ORIGIN
  });
  console.log('=== 服务器启动完成 ===\n');
}); 