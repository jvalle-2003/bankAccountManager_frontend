// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 1. Obtenemos la cookie del token
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // 2. Definir rutas públicas (que no requieren login)
    const isPublicPage = pathname.startsWith('/auth');

    // 3. CASO A: Si el usuario NO tiene token y quiere entrar a una página privada
    if (!token && !isPublicPage) {
        // Redirigir al login
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 4. CASO B: Si el usuario YA tiene token e intenta ir al login
    if (token && isPublicPage) {
        // Redirigir al dashboard (o la página que desees)
        return NextResponse.redirect(new URL('/pages/crud', request.url));
    }

    return NextResponse.next();
}

// Configurar en qué rutas se debe ejecutar este middleware
export const config = {
    matcher: [
        /*
         * Coincide con todas las rutas excepto:
         * - api (rutas de backend internas de next)
         * - _next/static (archivos estáticos)
         * - _next/image (optimización de imágenes)
         * - favicon.ico (icono)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};