import app from './app';
import dotenv from 'dotenv';
import path from 'path';

// 根据 NODE_ENV 加载对应的环境配置
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production'
  : '.env.development';

dotenv.config({
  path: path.resolve(process.cwd(), envFile)
});

const port = process.env.PORT || 3002;
const isDev = process.env.NODE_ENV === 'development';

app.listen(port, () => {
  if (isDev) {
    console.log(`开发服务器运行在: http://localhost:${port}`);
  } else {
    console.log(`生产服务器已启动，监听端口: ${port}`);
  }
  console.log(`当前环境: ${process.env.NODE_ENV}`);
}); 