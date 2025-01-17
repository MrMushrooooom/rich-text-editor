import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 获取当前用户信息
router.get('/user', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req.user as any).id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 注册
router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').optional().trim(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name } = req.body;

      // 检查邮箱是否已被注册
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: '该邮箱已被注册' });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      // 生成 JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      res.status(500).json({ error: '注册失败' });
    }
  }
);

// 登录
router.post('/login',
  body('email').isEmail(),
  body('password').exists(),
  async (req: Request, res: Response) => {
    console.log('\n=== 登录请求开始 ===');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('验证错误:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      console.log('尝试查找用户:', email);

      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.log('用户不存在:', email);
        return res.status(401).json({ error: '邮箱或密码错误' });
      }

      console.log('用户存在，验证密码');
      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('密码验证失败');
        return res.status(401).json({ error: '邮箱或密码错误' });
      }

      console.log('密码验证成功，生成 token');
      // 生成 JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('登录成功，返回响应');
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('\n!!! 登录过程中发生错误 !!!');
      console.error('错误详情:', error);
      console.error('请求体:', req.body);
      console.error('Prisma 错误:', error instanceof Error ? error.message : '未知错误');
      console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
      
      // 设置响应头
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'https://rich-text-editor-omega.vercel.app');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
      res.setHeader('Vary', 'Origin');

      res.status(500).json({ 
        error: '登录失败', 
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined 
      });
    } finally {
      console.log('=== 登录请求结束 ===\n');
    }
  }
);

export default router; 