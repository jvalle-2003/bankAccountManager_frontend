/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        // SECCIÓN DASHBOARD AÑADIDA
        {
            label: 'Home',
            items: [
                { label: 'Dashboard', 
                    icon: 'pi pi-fw pi-th-large', 
                    to: '/pages/dashboard' },
                { 
                label: 'Comparación de Datos', 
                icon: 'pi pi-fw pi-copy', // Icono de comparación/copia
                to: '/pages/dataMatch' 
            }
            ]
        },
        {
            label: 'Operaciones',
            icon: 'pi pi-fw pi-briefcase',
            to: '/pages',
            items: [
                
                {
                    label: 'Moneda',
                    icon: 'pi pi-fw pi-money-bill',
                    to: '/pages/currencies'
                },
                { 
                    label: 'Bancos', 
                    icon: 'pi pi-fw pi-building', 
                    to: '/pages/banks' 
                },
                { 
                    label: 'Tipos de Cuentas', 
                    icon: 'pi pi-fw pi-list', 
                    to: '/pages/accountType' 
                },
                { 
                    label: 'Cuentas Bancarias', 
                    icon: 'pi pi-fw pi-wallet', 
                    to: '/pages/crud' 
                },
                { 
                    label: 'Periodos', 
                    icon: 'pi pi-fw pi-building', 
                    to: '/pages/periods' 
                },
                { 
                    label: 'Conciliaciones', 
                    icon: 'pi pi-fw pi-list', 
                    to: '/pages/reconciliations' 
                },
                { 
                    label: 'Permisos', 
                    icon: 'pi pi-fw pi-wallet', 
                    to: '/pages/permissions' 
                },
                { 
                    label: 'Categorias', 
                    icon: 'pi pi-fw pi-wallet', 
                    to: '/pages/categories' 
                },
                { 
                    label: 'Transacciones', 
                    icon: 'pi pi-fw pi-wallet', 
                    to: '/pages/transactions' 
                },
                { 
                    label: 'Historial de Saldos', 
                    icon: 'pi pi-fw pi-wallet', 
                    to: '/pages/balance-history' 
                },
                
                {
                    label: 'Usuarios',
                    icon: 'pi pi-fw pi-users',
                    to: '/pages/users'
                },
                {
                    label: 'Roles',
                    icon: 'pi pi-fw pi-exclamation-circle',
                    to: '/pages/role'
                },
                {
                    label: 'Auditoria',
                    icon: 'pi pi-fw pi-shield',
                    to: '/pages/audit'
                }
            ]
        },
        
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}

            </ul>
        </MenuProvider>
    );
};

export default AppMenu;