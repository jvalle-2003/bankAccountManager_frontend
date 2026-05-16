"use client"; 

import React, { useState, useRef, useEffect } from 'react';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';

export default function SetupPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const toast = useRef<Toast>(null);
    
    const router = useRouter();

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const urlToken = queryParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        } else {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se encontró el token de seguridad en la URL.', 
                life: 5000 
            });
        }
    }, []);

    //  Función de validación de contraseña
    const validatePassword = (password: string): string | null => {
        if (password.length < 6) {
            return 'La contraseña debe tener al menos 6 caracteres.';
        }
        if (!/[A-Z]/.test(password)) {
            return 'La contraseña debe contener al menos una letra mayúscula.';
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return 'La contraseña debe contener al menos un carácter especial.';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Debes llenar ambos campos.', life: 3000 });
            return;
        }

        //  Validar reglas de contraseña
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            toast.current?.show({ severity: 'error', summary: 'Contraseña inválida', detail: passwordError, life: 4000 });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden.', life: 3000 });
            return;
        }
        if (!token) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Token inválido. Solicita un nuevo acceso.', life: 3000 });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/users/setup-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            if (data.success) {
                toast.current?.show({ severity: 'success', summary: '¡Éxito!', detail: data.message, life: 3000 });
                setTimeout(() => {
                    router.push('/auth/login'); 
                }, 2000);
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: data.message, life: 4000 });
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error de Red', detail: 'No se pudo conectar con el servidor.', life: 4000 });
        } finally {
            setLoading(false);
        }
    };

    // ✅ Template personalizado con las reglas visibles
    const passwordHeader = <div className="font-bold mb-3">Elige una contraseña</div>;
    const passwordFooter = (
        <div className="mt-3">
            <p className="font-semibold mb-2">Requisitos:</p>
            <ul className="pl-3 ml-2 mt-0 line-height-3 text-sm" style={{ listStyleType: 'disc' }}>
                <li>Al menos 6 caracteres</li>
                <li>Al menos una letra mayúscula</li>
                <li>Al menos un carácter especial (!@#$%^&*...)</li>
            </ul>
        </div>
    );

    return (
        <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
            <Toast ref={toast} />
            <div className="flex flex-column align-items-center justify-content-center">
                <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }}>
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3xl font-medium mb-3">Configura tu Contraseña</div>
                            <span className="text-600 font-medium">Ingresa una contraseña segura para tu cuenta</span>
                        </div>

                        <form onSubmit={handleSubmit} className="p-fluid">
                            <div className="field mb-5">
                                <label htmlFor="newPassword" className="block text-900 font-medium text-xl mb-2">Nueva Contraseña</label>
                                <Password 
                                    id="newPassword" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    toggleMask 
                                    header={passwordHeader}   // Header del panel
                                    footer={passwordFooter}   //  Footer con reglas
                                    promptLabel="Ingresa tu contraseña"
                                    weakLabel="Débil"
                                    mediumLabel="Media"
                                    strongLabel="Fuerte"
                                    inputClassName="w-full p-3 md:w-25rem" 
                                />
                            </div>

                            <div className="field mb-5">
                                <label htmlFor="confirmPassword" className="block text-900 font-medium text-xl mb-2">Confirmar Contraseña</label>
                                <Password 
                                    id="confirmPassword" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    toggleMask 
                                    feedback={false}
                                    inputClassName="w-full p-3 md:w-25rem" 
                                />
                            </div>

                            <Button 
                                label="Guardar y Entrar" 
                                type="submit" 
                                className="w-full p-3 text-xl" 
                                loading={loading} 
                            />
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}