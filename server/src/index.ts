import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 配置 CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://rich-text-editor-omega.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

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

// 路由配置
console.log('配置认证路由: /api/auth/* 和 /auth/*');
app.use('/api/auth', authRoutes);  // 处理带 /api 前缀的请求
app.use('/auth', authRoutes);      // 保持原有路由以兼容

// 404 处理中间件
app.use((req, res) => {
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

  // 设置响应头
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'https://rich-text-editor-omega.vercel.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
  res.setHeader('Vary', 'Origin');

  // 发送错误响应
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
  console.log('完整环境变量:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: port,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_REGION: process.env.VERCEL_REGION
  });
  console.log('=== 服务器启动完成 ===\n');
}); 