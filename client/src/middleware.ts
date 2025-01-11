import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 获取当前路径
  const path = request.nextUrl.pathname
  
  // 定义公开路径
  const isPublicPath = path === '/login'
  
  // 从 cookies 中获取 token
  const token = request.cookies.get('auth-token')?.value || ''
  
  // 如果访问登录页面且已经有 token，重定向到首页
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // 如果访问需要认证的页面但没有 token，重定向到登录页
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

// 配置需要进行认证检查的路径
export const config = {
  matcher: [
    '/',
    '/login',
    '/documents/:path*'
  ]
} 