'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState, useRef } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Dialog } from 'primereact/dialog'; 
import { Toast } from 'primereact/toast';
import axios from 'axios';
import { usePermissions } from '../../../../src/hooks/usePermission';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { setUserPermissions } = usePermissions();

    // --- ESTADOS PARA EL FORMULARIO DE RECUPERACIÓN ---
    const [displayForgotDialog, setDisplayForgotDialog] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveryUser, setRecoveryUser] = useState(''); // Nuevo
    const [recoveryName, setRecoveryName] = useState(''); // Nuevo
    const [recoveryLastName, setRecoveryLastName] = useState(''); // Nuevo
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    
    const toast = useRef<Toast>(null);
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    const handleLogin = async () => {
        if (!username || !password) {
            setError('Por favor ingrese usuario y contraseña');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:3001/api/auth/login', { username, password }, { withCredentials: true });
            if (response.data.success) {
                sessionStorage.setItem('user', JSON.stringify(response.data.user));
                 if (response.data.permissions) {
                    setUserPermissions(response.data.permissions);
                } else {
                    console.warn('El backend no envió permisos. Asegúrate de que el login los incluya.');
                }
                router.push('/pages/crud');
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    // --- FUNCIÓN DE RECUPERACIÓN CON MÁS CAMPOS ---
    const handleForgotPassword = async () => {
        // Validación: que ningún campo esté vacío
        if (!recoveryEmail || !recoveryUser || !recoveryName || !recoveryLastName) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Campos incompletos', 
                detail: 'Por favor, llena todos los campos para validar tu identidad', 
                life: 3000 
            });
            return;
        }

        setRecoveryLoading(true);
        try {
            const response = await axios.post('http://localhost:3001/api/users/forgot-password', { 
                email: recoveryEmail,
                username: recoveryUser,
                nombre: recoveryName,
                apellido: recoveryLastName
            });

            toast.current?.show({ 
                severity: 'success', 
                summary: 'Solicitud enviada', 
                detail: 'Si los datos coinciden, recibirás un correo pronto.', 
                life: 5000 
            });
            
            setDisplayForgotDialog(false);
            setRecoveryEmail('');
            setRecoveryUser('');
            setRecoveryName('');
            setRecoveryLastName('');
        } catch (err: any) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: err.response?.data?.message || 'Los datos no coinciden con nuestros registros', 
                life: 4000 
            });
        } finally {
            setRecoveryLoading(false);
        }
    };

    return (
        <div className={containerClassName}>
            <Toast ref={toast} />

            {/* --- MODAL DE RECUPERAR CON MÁS CAMPOS --- */}
            <Dialog 
                header="Validación de Identidad" 
                visible={displayForgotDialog} 
                style={{ width: '450px' }} 
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                onHide={() => setDisplayForgotDialog(false)}
                footer={
                    <div>
                        <Button label="Cancelar" icon="pi pi-times" onClick={() => setDisplayForgotDialog(false)} className="p-button-text" />
                        <Button label="Verificar y Enviar" icon="pi pi-envelope" onClick={handleForgotPassword} loading={recoveryLoading} />
                    </div>
                }
            >
                <div className="flex flex-column gap-3 mt-2">
                    <p className="text-600 mb-2">Ingresa tus datos exactos para restablecer tu contraseña.</p>
                    
                    <div className="field">
                        <label htmlFor="rec_user" className="font-bold">Nombre de Usuario</label>
                        <InputText id="rec_user" value={recoveryUser} onChange={(e) => setRecoveryUser(e.target.value)} className="w-full" placeholder="Ej: jdoe24" />
                    </div>

                    <div className="flex gap-2">
                        <div className="field w-full">
                            <label htmlFor="rec_name" className="font-bold">Nombre</label>
                            <InputText id="rec_name" value={recoveryName} onChange={(e) => setRecoveryName(e.target.value)} className="w-full" />
                        </div>
                        <div className="field w-full">
                            <label htmlFor="rec_lastname" className="font-bold">Apellido</label>
                            <InputText id="rec_lastname" value={recoveryLastName} onChange={(e) => setRecoveryLastName(e.target.value)} className="w-full" />
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="rec_email" className="font-bold">Correo Electrónico</label>
                        <InputText id="rec_email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} className="w-full" placeholder="correo@ejemplo.com" />
                    </div>
                </div>
            </Dialog>

            {/* ... Resto del componente (UI de Login) igual que antes ... */}
            <div className="flex flex-column align-items-center justify-content-center">
                <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }}>
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <img src="/layout/images/hugo.png" alt="logo" className="mb-5 w-6rem" />
                            <div className="text-900 text-3xl font-medium mb-3">Bienvenido</div>
                        </div>

                        <div>
                            <label className="block text-900 text-xl font-medium mb-2">Usuario</label>
                            <InputText value={username} onChange={(e) => setUsername(e.target.value)} className="w-full md:w-30rem mb-5" style={{ padding: '1rem' }} />

                            <label className="block text-900 font-medium text-xl mb-2">Contraseña</label>
                            <Password value={password} onChange={(e) => setPassword(e.target.value)} toggleMask className="w-full mb-5" inputClassName="w-full p-3 md:w-30rem" feedback={false} />

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2" />
                                    <label>Recuérdame</label>
                                </div>
                                <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: 'var(--primary-color)' }} onClick={() => setDisplayForgotDialog(true)}>
                                    ¿Olvidé mi contraseña?
                                </a>
                            </div>
                            
                            <Button label={loading ? "Cargando..." : "Iniciar Sesión"} className="w-full p-3 text-xl" onClick={handleLogin} disabled={loading} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;