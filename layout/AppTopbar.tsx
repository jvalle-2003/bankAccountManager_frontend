/* eslint-disable @next/next/no-img-element */
'use client'; // Agregamos 'use client' porque usamos hooks de enrutamiento y estado

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { useRouter } from 'next/navigation'; // 1. Importamos useRouter
import axios from 'axios'; // Importamos axios (o puedes usar tu instancia 'api' si la tienes configurada)

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    
    const router = useRouter(); // Inicializamos el router

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    // 2. Creamos la función para cerrar sesión
    const handleLogout = async () => {
        try {
            // Opcional: Llamamos al backend para destruir la cookie httpOnly
            await axios.post('http://localhost:3001/api/auth/logout', {}, { withCredentials: true });
        } catch (error) {
            console.error('Error al cerrar sesión en el servidor:', error);
        } finally {
            // Limpiamos los datos locales del usuario
            sessionStorage.removeItem('user');
            
            // Redirigimos a la página de login
            router.push('/auth/login');
        }
    };

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                {/* 👇 LOGO ACTUALIZADO A hugo.png */}
                <img src="/layout/images/hugo.png" width="47.22px" height={'35px'} alt="logo" />
                <span>GESBANCA</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-user"></i>
                    <span>Profile</span>
                </button>
                <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-cog"></i>
                    <span>Settings</span>
                </button>
                
                {/* Botón de Salir */}
                <button type="button" className="p-link layout-topbar-button" onClick={handleLogout}>
                    <i className="pi pi-sign-out"></i>
                    <span>Exit</span>
                </button>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;