import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// 打印所有请求的中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
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

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // 启用 OPTIONS 预检请求处理

app.use(express.json());

// 路由配置
app.use('/auth', authRoutes);

// 基本的健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    time: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      CORS_ORIGIN: process.env.CORS_ORIGIN
    },
    request: {
      path: req.path,
      method: req.method,
      headers: req.headers,
      origin: req.headers.origin
    }
  });
});

// 调试路由 - 显示所有环境变量
app.get('/api/debug', (req, res) => {
  res.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      CORS_ORIGIN: process.env.CORS_ORIGIN
    },
    request: {
      path: req.path,
      method: req.method,
      headers: req.headers,
      origin: req.headers.origin
    },
    vercel: {
      region: process.env.VERCEL_REGION,
      environment: process.env.VERCEL_ENV
    }
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: port,
    CORS_ORIGIN: process.env.CORS_ORIGIN
  });
}); 