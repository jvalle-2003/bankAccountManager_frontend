'use client';

import { useEffect, useState } from 'react';

interface Permission {
    module: string;
    action: string;
}

export const usePermissions = () => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    // Cargar permisos desde localStorage al montar el hook
    useEffect(() => {
        const stored = localStorage.getItem('permissions');
        if (stored) {
            try {
                setPermissions(JSON.parse(stored));
            } catch (e) {
                console.error('Error parsing permissions', e);
                setPermissions([]);
            }
        }
        setLoading(false);
    }, []);

    // Guardar permisos (se llamará después del login)
    const setUserPermissions = (perms: Permission[]) => {
        localStorage.setItem('permissions', JSON.stringify(perms));
        setPermissions(perms);
    };

    // Limpiar permisos (logout)
    const clearPermissions = () => {
        localStorage.removeItem('permissions');
        setPermissions([]);
    };

    // Verificar si tiene un permiso específico
    const can = (module: string, action: string): boolean => {
        if (!module || !action) return false;
        return permissions.some(p => p.module === module && p.action === action);
    };

    // Verificar si tiene acceso a un módulo (al menos una acción)
    const canAccessModule = (module: string): boolean => {
        return permissions.some(p => p.module === module);
    };

    return {
        permissions,
        loading,
        can,
        canAccessModule,
        setUserPermissions,
        clearPermissions,
    };
};