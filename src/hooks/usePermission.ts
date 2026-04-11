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
    | 'ELIMINAR_HISTORIAL'
    | 'EXPORTAR_REPORTES';  // 👈 NUEVO PERMISO

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
// PERMISOS POR ROL
// ==========================================
const ROLE_PERMISSIONS: Record<number, PermissionName[]> = {
    2: [ // ADMIN - todos los permisos
        'CREAR_CONCILIACION', 'VER_CONCILIACIONES', 'EDITAR_CONCILIACION', 'ELIMINAR_CONCILIACION',
        'CREAR_TRANSACCION', 'VER_TRANSACCIONES', 'EDITAR_TRANSACCION', 'CANCELAR_TRANSACCION',
        'CREAR_USUARIO', 'VER_USUARIOS', 'EDITAR_USUARIO', 'ELIMINAR_USUARIO',
        'CREAR_HISTORIAL', 'VER_HISTORIAL', 'EDITAR_HISTORIAL', 'ELIMINAR_HISTORIAL',
        'EXPORTAR_REPORTES'  // 👈 ADMIN puede exportar
    ],
    3: [ // USUARIO - solo lectura (NO puede exportar)
        'VER_CONCILIACIONES',
        'VER_TRANSACCIONES',
        'VER_HISTORIAL'
        // 👈 NO tiene EXPORTAR_REPORTES
    ],
    4: [ // GERENTE - ver y editar
        'VER_CONCILIACIONES', 'EDITAR_CONCILIACION',
        'VER_TRANSACCIONES', 'EDITAR_TRANSACCION',
        'VER_HISTORIAL', 'EDITAR_HISTORIAL',
        'VER_USUARIOS',
        'EXPORTAR_REPORTES'  // 👈 GERENTE puede exportar
    ],
    5: [ // ANALISTA - ver y crear
        'CREAR_CONCILIACION', 'VER_CONCILIACIONES',
        'CREAR_TRANSACCION', 'VER_TRANSACCIONES',
        'CREAR_HISTORIAL', 'VER_HISTORIAL',
        'EXPORTAR_REPORTES'  // 👈 ANALISTA puede exportar
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