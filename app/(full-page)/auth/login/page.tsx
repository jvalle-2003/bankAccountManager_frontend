'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import axios from 'axios';

const LoginPage = () => {
    // Estados para el formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    const handleLogin = async () => {
        // Validar que los campos no estén vacíos
        if (!username || !password) {
            setError('Por favor ingrese usuario y contraseña');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post('http://localhost:3001/api/auth/login', {
                username,
                password
            });
            
            // Guardar datos del usuario en localStorage
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Redirigir al dashboard
            router.push('/pages/crud');
            
        } catch (error: any) {
            setError(error.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <img src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`} alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />
                            <div className="text-900 text-3xl font-medium mb-3">Bienvenido</div>
                            <span className="text-600 font-medium">Inicia sesión en GESBANCA</span>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-900 text-xl font-medium mb-2">
                                Usuario
                            </label>
                            <InputText 
                                id="username" 
                                type="text" 
                                placeholder="Nombre de Usuario" 
                                className="w-full md:w-30rem mb-5" 
                                style={{ padding: '1rem' }}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">
                                Contraseña
                            </label>
                            <Password 
                                inputId="password1" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="Contraseña" 
                                toggleMask 
                                className="w-full mb-5" 
                                inputClassName="w-full p-3 md:w-30rem"
                            />

                            {error && (
                                <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
                                    {error}
                                </div>
                            )}

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox inputId="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2"></Checkbox>
                                    <label htmlFor="rememberme1">Recuerdame</label>
                                </div>
                                <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                    Olvide mi contraseña?
                                </a>
                            </div>
                            
                            <Button 
                                label={loading ? "Cargando..." : "Iniciar Sesión"} 
                                className="w-full p-3 text-xl" 
                                onClick={handleLogin}
                                disabled={loading}
                            />

                            {/* NUEVO ENLACE DE REGISTRO */}
                            <div className="text-center mt-3">
                                <a href="/auth/register" className="font-medium no-underline text-blue-500">
                                    ¿No tienes cuenta? Regístrate aquí
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;