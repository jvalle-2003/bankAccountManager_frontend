/* eslint-disable @next/next/no-img-element */

import React, { useContext, useEffect, useState } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { PermissionsService } from '@/src/service/permissions.service';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const [userRole, setUserRole] = useState<number>(1);
    const [userPermissionIds, setUserPermissionIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserPermissions();
    }, []);

    const loadUserPermissions = async () => {
        try {
            // Obtener usuario de sessionStorage
            const userSession = sessionStorage.getItem('user');
            
            if (userSession) {
                const user = JSON.parse(userSession);
                const roleId = user.role_id || user.roleId || 1;
                setUserRole(roleId);
                
                console.log('Rol del usuario:', roleId);
                
                // Si no es administrador, cargar sus permisos (IDs)
                if (roleId !== 1) {
                    try {
                        const permissions = await PermissionsService.getPermissionsByRole(roleId);
                        console.log('Respuesta original del endpoint:', permissions);
                        
                        // Extraer los IDs de los permisos correctamente
                        let permissionIds: number[] = [];
                        if (Array.isArray(permissions)) {
                            permissionIds = permissions.map((p: any) => {
                                // Si es un número, usarlo directamente
                                if (typeof p === 'number') return p;
                                // Si es un objeto con id_permission o permission_id
                                if (typeof p === 'object' && p !== null) {
                                    return p.permission_id ?? p.id_permission ?? p.permissionId ?? null;
                                }
                                return null;
                            }).filter((id: number | null) => id !== null);
                        }
                        
                        console.log('IDs de permisos procesados:', permissionIds);
                        setUserPermissionIds(permissionIds);
                    } catch (error) {
                        console.error('Error cargando permisos:', error);
                        setUserPermissionIds([]);
                    }
                } else {
                    console.log('Usuario administrador - acceso total');
                }
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mapeo de permisos con los IDs REALES de tu base de datos
    const getPermissionIdByName = (permissionName: string): number => {
        const permissionMap: { [key: string]: number } = {
            // Dashboard
            'VIEW_DASHBOARD': 0,
            'VIEW_DATA_MATCH': 1,
            
            // Configuración - Monedas
            'VIEW_CURRENCIES': 2,
            'CREATE_CURRENCY': 3,
            'EDIT_CURRENCY': 4,
            'DELETE_CURRENCY': 5,
            
            // Configuración - Bancos
            'VIEW_BANKS': 6,
            'CREATE_BANK': 7,
            'EDIT_BANK': 8,
            'DELETE_BANK': 9,
            
            // Configuración - Tipos de Cuentas
            'VIEW_ACCOUNT_TYPES': 10,
            'CREATE_ACCOUNT_TYPE': 11,
            'EDIT_ACCOUNT_TYPE': 12,
            'DELETE_ACCOUNT_TYPE': 13,
            
            // Configuración - Cuentas Bancarias
            'VIEW_BANK_ACCOUNTS': 14,
            'CREATE_BANK_ACCOUNT': 15,
            'EDIT_BANK_ACCOUNT': 16,
            'DELETE_BANK_ACCOUNT': 17,
            
            // Operaciones - Periodos
            'VIEW_PERIODS': 18,
            'CREATE_PERIOD': 19,
            'EDIT_PERIOD': 20,
            'DELETE_PERIOD': 21,
            
            // Operaciones - Conciliaciones
            'VIEW_RECONCILIATIONS': 22,
            'CREATE_RECONCILIATION': 23,
            'EDIT_RECONCILIATION': 24,
            'DELETE_RECONCILIATION': 25,
            'EXPORT_RECONCILIATION': 26,
            
            // Seguridad - Permisos
            'VIEW_PERMISSIONS': 27,
            'CREATE_PERMISSION': 28,
            'EDIT_PERMISSION': 29,
            'DELETE_PERMISSION': 30,
            'ASSIGN_PERMISSION': 31,
            
            // Operaciones - Categorías
            'VIEW_CATEGORIES': 32,
            'CREATE_CATEGORY': 33,
            'EDIT_CATEGORY': 34,
            'DELETE_CATEGORY': 35,
            
            // Operaciones - Transacciones
            'VIEW_TRANSACTIONS': 36,
            'CREATE_TRANSACTION': 37,
            'EDIT_TRANSACTION': 38,
            'DELETE_TRANSACTION': 39,
            'RECONCILE_TRANSACTION': 40,
            
            // Reportes
            'VIEW_BALANCE_HISTORY': 41,
            'EXPORT_BALANCE_HISTORY': 42,
            
            // Seguridad - Usuarios
            'VIEW_USERS': 43,
            'CREATE_USER': 44,
            'EDIT_USER': 45,
            'DELETE_USER': 46,
            'ASSIGN_ROLE': 47,
            
            // Seguridad - Roles
            'VIEW_ROLES': 48,
            'CREATE_ROLE': 49,
            'EDIT_ROLE': 50,
            'DELETE_ROLE': 51,
            
            // Seguridad - Auditoría
            'VIEW_AUDIT': 52,
            'EXPORT_AUDIT': 53
        };
        return permissionMap[permissionName] ?? -1;
    };

    // Función para verificar si tiene permiso
    const hasPermission = (permissionName: string): boolean => {
        if (loading) return false;
        // Administrador (role_id = 1) tiene todos los permisos
        if (userRole === 1) return true;
        
        // Obtener el ID del permiso
        const permissionId = getPermissionIdByName(permissionName);
        if (permissionId === -1) return false;
        
        // Verificar si el ID está en la lista de permisos del usuario
        return userPermissionIds.includes(permissionId);
    };

    // Configuración del menú
    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [
                { 
                    label: 'Dashboard', 
                    icon: 'pi pi-fw pi-th-large', 
                    to: '/pages/dashboard',
                    requiredPermission: 'VIEW_DASHBOARD'
                },
                { 
                    label: 'Comparación de Datos', 
                    icon: 'pi pi-fw pi-copy',
                    to: '/pages/dataMatch',
                    requiredPermission: 'VIEW_DATA_MATCH'
                }
            ]
        },
        {
            label: 'Operaciones',
            icon: 'pi pi-fw pi-briefcase',
            items: [
                { 
                    label: 'Moneda', 
                    icon: 'pi pi-fw pi-money-bill', 
                    to: '/pages/currencies',
                    requiredPermission: 'VIEW_CURRENCIES'
                },
                { 
                    label: 'Bancos', 
                    icon: 'pi pi-fw pi-building', 
                    to: '/pages/banks',
                    requiredPermission: 'VIEW_BANKS'
                },
                { 
                    label: 'Tipos de Cuentas', 
                    icon: 'pi pi-fw pi-list', 
                    to: '/pages/accountType',
                    requiredPermission: 'VIEW_ACCOUNT_TYPES'
                },
                { 
                    label: 'Cuentas Bancarias', 
                    icon: 'pi pi-fw pi-wallet', 
                    to: '/pages/crud',
                    requiredPermission: 'VIEW_BANK_ACCOUNTS'
                },
                { 
                    label: 'Periodos', 
                    icon: 'pi pi-fw pi-calendar', 
                    to: '/pages/periods',
                    requiredPermission: 'VIEW_PERIODS'
                },
                { 
                    label: 'Conciliaciones', 
                    icon: 'pi pi-fw pi-check-circle', 
                    to: '/pages/reconciliations',
                    requiredPermission: 'VIEW_RECONCILIATIONS'
                },
                { 
                    label: 'Permisos', 
                    icon: 'pi pi-fw pi-key', 
                    to: '/pages/permissions',
                    requiredPermission: 'VIEW_PERMISSIONS'
                },
                { 
                    label: 'Categorias', 
                    icon: 'pi pi-fw pi-tags', 
                    to: '/pages/categories',
                    requiredPermission: 'VIEW_CATEGORIES'
                },
                { 
                    label: 'Transacciones', 
                    icon: 'pi pi-fw pi-chart-line', 
                    to: '/pages/transactions',
                    requiredPermission: 'VIEW_TRANSACTIONS'
                },
                { 
                    label: 'Historial de Saldos', 
                    icon: 'pi pi-fw pi-chart-line', 
                    to: '/pages/balance-history',
                    requiredPermission: 'VIEW_BALANCE_HISTORY'
                },
                { 
                    label: 'Usuarios', 
                    icon: 'pi pi-fw pi-users', 
                    to: '/pages/users',
                    requiredPermission: 'VIEW_USERS'
                },
                { 
                    label: 'Roles', 
                    icon: 'pi pi-fw pi-exclamation-circle', 
                    to: '/pages/role',
                    requiredPermission: 'VIEW_ROLES'
                },
                { 
                    label: 'Auditoria', 
                    icon: 'pi pi-fw pi-shield', 
                    to: '/pages/audit',
                    requiredPermission: 'VIEW_AUDIT'
                }
            ]
        },
    ];

    // Filtrar el menú por permisos
    const filterMenuByPermissions = (items: AppMenuItem[]): AppMenuItem[] => {
        return items
            .map(item => {
                if (item.items) {
                    const filteredSubItems = item.items.filter(subItem => {
                        if (!subItem.requiredPermission) return true;
                        return hasPermission(subItem.requiredPermission);
                    });
                    
                    if (filteredSubItems.length === 0) return null;
                    return { ...item, items: filteredSubItems };
                }
                
                if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
                    return null;
                }
                
                return item;
            })
            .filter(item => item !== null) as AppMenuItem[];
    };

    const visibleModel = filterMenuByPermissions(model);

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center p-4">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            </div>
        );
    }

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {visibleModel.map((item, i) => {
                    return !item?.seperator ? 
                        <AppMenuitem item={item} root={true} index={i} key={item.label} /> : 
                        <li className="menu-separator" key={i}></li>;
                })}
            
            
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;