import { useEffect, useState } from 'react';

export type PermissionName = 
    | 'CREAR_CONCILIACION'
    | 'VER_CONCILIACIONES'
    | 'EDITAR_CONCILIACION'
    | 'ELIMINAR_CONCILIACION'
    | 'CREAR_TRANSACCION'
    | 'VER_TRANSACCIONES'
    | 'EDITAR_TRANSACCION'
    | 'CANCELAR_TRANSACCION'
    | 'CREAR_USUARIO'
    | 'VER_USUARIOS'
    | 'EDITAR_USUARIO'
    | 'ELIMINAR_USUARIO'
    | 'CREAR_HISTORIAL'
    | 'VER_HISTORIAL'
    | 'EDITAR_HISTORIAL'
    | 'ELIMINAR_HISTORIAL';

interface User {
    user_id: number;
    username: string;
    email: string;
    first_name: string;
    first_surname: string;
    role_id: number;
    role_name?: string;
}

// ==========================================
// PERMISOS POR ROL - ACTUALIZADO CON TUS ROLES REALES
// ==========================================
const ROLE_PERMISSIONS: Record<number, PermissionName[]> = {
    2: [ // ADMIN - todos los permisos
        'CREAR_CONCILIACION', 'VER_CONCILIACIONES', 'EDITAR_CONCILIACION', 'ELIMINAR_CONCILIACION',
        'CREAR_TRANSACCION', 'VER_TRANSACCIONES', 'EDITAR_TRANSACCION', 'CANCELAR_TRANSACCION',
        'CREAR_USUARIO', 'VER_USUARIOS', 'EDITAR_USUARIO', 'ELIMINAR_USUARIO',
        'CREAR_HISTORIAL', 'VER_HISTORIAL', 'EDITAR_HISTORIAL', 'ELIMINAR_HISTORIAL'
    ],
    3: [ // USUARIO - solo lectura
        'VER_CONCILIACIONES',
        'VER_TRANSACCIONES',
        'VER_HISTORIAL'
    ],
    4: [ // GERENTE - ver y editar (sin crear ni eliminar)
        'VER_CONCILIACIONES', 'EDITAR_CONCILIACION',
        'VER_TRANSACCIONES', 'EDITAR_TRANSACCION',
        'VER_HISTORIAL', 'EDITAR_HISTORIAL',
        'VER_USUARIOS'
    ],
    5: [ // ANALISTA - ver y crear (sin editar ni eliminar)
        'CREAR_CONCILIACION', 'VER_CONCILIACIONES',
        'CREAR_TRANSACCION', 'VER_TRANSACCIONES',
        'CREAR_HISTORIAL', 'VER_HISTORIAL'
    ],
};

export const usePermission = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
            } catch (error) {
                console.error('Error parsing user:', error);
            }
        }
        setLoading(false);
    }, []);

    const hasPermission = (permission: PermissionName): boolean => {
        if (!user) return false;
        
        // ADMIN (role_id = 2) tiene todos los permisos
        if (user.role_id === 2) return true;
        
        const userPermissions = ROLE_PERMISSIONS[user.role_id] || [];
        return userPermissions.includes(permission);
    };

    const hasAnyPermission = (permissions: PermissionName[]): boolean => {
        return permissions.some(p => hasPermission(p));
    };

    const hasAllPermissions = (permissions: PermissionName[]): boolean => {
        return permissions.every(p => hasPermission(p));
    };

    const isAdmin = (): boolean => user?.role_id === 2;
    const isReadOnly = (): boolean => user?.role_id === 3;
    const getUserRole = (): number | null => user?.role_id || null;

    return {
        user,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAdmin,
        isReadOnly,
        getUserRole,
    };
};