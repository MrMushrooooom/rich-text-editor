import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import documentRoutes from './routes/documents';
import authRoutes from './routes/auth';

const app = express();

// 环境变量
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// CORS 配置
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

// 中间件
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined')); // 开发环境使用详细日志
app.use(express.json());
app.use(cookieParser());

// 路由
app.use('/api/documents', documentRoutes);
app.use('/api/auth', authRoutes);

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
});

export default app; 