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
        // {
        //     label: 'Home',
        //     items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        // },
        // {
        //     label: 'UI Components',
        //     items: [
        //         { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', to: '/uikit/formlayout' },
        //         { label: 'Input', icon: 'pi pi-fw pi-check-square', to: '/uikit/input' },
        //         { label: 'Float Label', icon: 'pi pi-fw pi-bookmark', to: '/uikit/floatlabel' },
        //         { label: 'Invalid State', icon: 'pi pi-fw pi-exclamation-circle', to: '/uikit/invalidstate' },
        //         { label: 'Button', icon: 'pi pi-fw pi-mobile', to: '/uikit/button', class: 'rotated-icon' },
        //         { label: 'Table', icon: 'pi pi-fw pi-table', to: '/uikit/table' },
        //         { label: 'List', icon: 'pi pi-fw pi-list', to: '/uikit/list' },
        //         { label: 'Tree', icon: 'pi pi-fw pi-share-alt', to: '/uikit/tree' },
        //         { label: 'Panel', icon: 'pi pi-fw pi-tablet', to: '/uikit/panel' },
        //         { label: 'Overlay', icon: 'pi pi-fw pi-clone', to: '/uikit/overlay' },
        //         { label: 'Media', icon: 'pi pi-fw pi-image', to: '/uikit/media' },
        //         { label: 'Menu', icon: 'pi pi-fw pi-bars', to: '/uikit/menu', preventExact: true },
        //         { label: 'Message', icon: 'pi pi-fw pi-comment', to: '/uikit/message' },
        //         { label: 'File', icon: 'pi pi-fw pi-file', to: '/uikit/file' },
        //         { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/charts' },
        //         { label: 'Misc', icon: 'pi pi-fw pi-circle', to: '/uikit/misc' }
        //     ]
        // },
        // {
        //     label: 'Prime Blocks',
        //     items: [
        //         { label: 'Free Blocks', icon: 'pi pi-fw pi-eye', to: '/blocks', badge: 'NEW' },
        //         { label: 'All Blocks', icon: 'pi pi-fw pi-globe', url: 'https://blocks.primereact.org', target: '_blank' }
        //     ]
        // },
        // {
        //     label: 'Utilities',
        //     items: [
        //         { label: 'PrimeIcons', icon: 'pi pi-fw pi-prime', to: '/utilities/icons' },
        //         { label: 'PrimeFlex', icon: 'pi pi-fw pi-desktop', url: 'https://primeflex.org/', target: '_blank' }
        //     ]
        // },
        {
            label: 'Operaciones',
            icon: 'pi pi-fw pi-briefcase',
            to: '/pages',
            items: [
                // {
                //     label: 'Landing',
                //     icon: 'pi pi-fw pi-globe',
                //     to: '/landing'
                // },
                // {
                //     label: 'Auth',
                //     icon: 'pi pi-fw pi-user',
                //     items: [
                //         {
                //             label: 'Login',
                //             icon: 'pi pi-fw pi-sign-in',
                //             to: '/auth/login'
                //         },
                //         {
                //             label: 'Error',
                //             icon: 'pi pi-fw pi-times-circle',
                //             to: '/auth/error'
                //         },
                //         {
                //             label: 'Access Denied',
                //             icon: 'pi pi-fw pi-lock',
                //             to: '/auth/access'
                //         }
                //     ]
                // },
                // {
                //     label: 'Crud',
                //     icon: 'pi pi-fw pi-pencil',
                //     to: '/pages/crud'
                // },
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
                // {
                //     label: 'Timeline',
                //     icon: 'pi pi-fw pi-calendar',
                //     to: '/pages/timeline'
                // },
                // {
                //     label: 'Not Found',
                //     icon: 'pi pi-fw pi-exclamation-circle',
                //     to: '/pages/notfound'
                // },
                // {
                //     label: 'Empty',
                //     icon: 'pi pi-fw pi-circle-off',
                //     to: '/pages/empty'
                // }
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
        // {
        //     label: 'Hierarchy',
        //     items: [
        //         {
        //             label: 'Submenu 1',
        //             icon: 'pi pi-fw pi-bookmark',
        //             items: [
        //                 {
        //                     label: 'Submenu 1.1',
        //                     icon: 'pi pi-fw pi-bookmark',
        //                     items: [
        //                         { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
        //                         { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
        //                         { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
        //                     ]
        //                 },
        //                 {
        //                     label: 'Submenu 1.2',
        //                     icon: 'pi pi-fw pi-bookmark',
        //                     items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
        //                 }
        //             ]
        //         },
        //         {
        //             label: 'Submenu 2',
        //             icon: 'pi pi-fw pi-bookmark',
        //             items: [
        //                 {
        //                     label: 'Submenu 2.1',
        //                     icon: 'pi pi-fw pi-bookmark',
        //                     items: [
        //                         { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
        //                         { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
        //                     ]
        //                 },
        //                 {
        //                     label: 'Submenu 2.2',
        //                     icon: 'pi pi-fw pi-bookmark',
        //                     items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
        //                 }
        //             ]
        //         }
        //     ]
        // },
        // {
        //     label: 'Get Started',
        //     items: [
        //         {
        //             label: 'Documentation',
        //             icon: 'pi pi-fw pi-question',
        //             to: '/documentation'
        //         },
        //         {
        //             label: 'Figma',
        //             url: 'https://www.dropbox.com/scl/fi/bhfwymnk8wu0g5530ceas/sakai-2023.fig?rlkey=u0c8n6xgn44db9t4zkd1brr3l&dl=0',
        //             icon: 'pi pi-fw pi-pencil',
        //             target: '_blank'
        //         },
        //         {
        //             label: 'View Source',
        //             icon: 'pi pi-fw pi-search',
        //             url: 'https://github.com/primefaces/sakai-react',
        //             target: '_blank'
        //         }
        //     ]
        // }
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
