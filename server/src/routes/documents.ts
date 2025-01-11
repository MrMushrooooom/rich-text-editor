import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取所有文档
router.get('/', authenticateToken, async (req, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });
    res.json(documents);
  } catch (error) {
    console.error('获取文档失败:', error);
    res.status(500).json({ error: '获取文档失败' });
  }
});

// 获取单个文档
router.get('/:id', authenticateToken, async (req, res: Response) => {
  try {
    const document = await prisma.document.findUnique({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
      }
    });

    if (!document) {
      return res.status(404).json({ error: '文档不存在' });
    }

    res.json(document);
  } catch (error) {
    console.error('获取文档失败:', error);
    res.status(500).json({ error: '获取文档失败' });
  }
});

// 创建文档
router.post('/',
  authenticateToken,
  body('title').trim().notEmpty(),
  body('content').trim(),
  async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content } = req.body;
      const document = await prisma.document.create({
        data: {
          title: title || '未命名文档',
          content: content || '',
          userId: req.user.id
        },
        select: {
          id: true,
          title: true,
          content: true,
          updatedAt: true,
        }
      });
      res.status(201).json(document);
    } catch (error) {
      console.error('创建文档失败:', error);
      res.status(500).json({ error: '创建文档失败' });
    }
  }
);

// 更新文档
router.put('/:id',
  authenticateToken,
  body('title').trim().optional(),
  body('content').trim().optional(),
  async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content } = req.body;
      const document = await prisma.document.findUnique({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });

      if (!document) {
        return res.status(404).json({ error: '文档不存在' });
      }

      const updatedDocument = await prisma.document.update({
        where: { id: req.params.id },
        data: {
          title: title || document.title,
          content: content || document.content,
          updatedAt: new Date()
        },
        select: {
          id: true,
          title: true,
          content: true,
          updatedAt: true,
        }
      });

      res.json(updatedDocument);
    } catch (error) {
      console.error('更新文档失败:', error);
      res.status(500).json({ error: '更新文档失败' });
    }
  }
);

// 删除文档
router.delete('/:id', authenticateToken, async (req, res: Response) => {
  try {
    const document = await prisma.document.findUnique({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!document) {
      return res.status(404).json({ error: '文档不存在' });
    }

    await prisma.document.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('删除文档失败:', error);
    res.status(500).json({ error: '删除文档失败' });
  }
});

export default router; 