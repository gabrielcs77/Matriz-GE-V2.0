import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    console.log('Middleware - Path:', req.nextUrl.pathname);
    console.log('Middleware - Token:', req.nextauth.token);
    
    // Se o usuário está autenticado e tenta acessar /login, redireciona para /menu
    if (req.nextUrl.pathname === "/login" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/menu", req.url));
    }

    // Se o usuário está autenticado e tenta acessar apenas a raiz /, redireciona para /menu
    if (req.nextUrl.pathname === "/" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/menu", req.url));
    }

    // Para todas as outras rotas autenticadas (como /matriz), permite o acesso direto
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Se a rota é /login, permite acesso mesmo sem autenticação
        if (req.nextUrl.pathname === "/login") {
          return true;
        }
        // Para todas as outras rotas, requer autenticação
        return !!token;
      },
    },
  }
);

// Protege apenas as rotas que precisamos
export const config = {
  matcher: ['/', '/login', '/menu', '/matriz']
}; 