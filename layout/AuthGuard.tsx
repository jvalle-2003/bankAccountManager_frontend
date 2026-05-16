'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // 1. Buscamos al usuario en la memoria del navegador
        const user = sessionStorage.getItem('user');

        if (!user) {
            // 2. Si NO hay usuario, lo sacamos inmediatamente al login
            router.push('/auth/login');
        } else {
            // 3. Si SÍ hay usuario, le damos permiso de ver la página
            setIsAuthorized(true);
        }
    }, [router]);

    // Mientras hace la verificación (son milisegundos), no mostramos la tabla
    // Esto evita que la página "parpadee" antes de sacarlo
    if (!isAuthorized) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            </div>
        );
    }

    // Si está autorizado, mostramos el contenido normal (la tabla, el dashboard, etc.)
    return <>{children}</>;
}