'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';

const ConfirmPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Si viene token en la URL, lo cargamos
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        }
    }, [searchParams]);

    const handleConfirm = async () => {
        if (!token) {
            setError('Por favor ingresa el token');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('http://localhost:3001/api/users/confirm', { token });
            
            setSuccess('Cuenta confirmada exitosamente. Redirigiendo al login...');
            
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);

        } catch (error: any) {
            setError(error.response?.data?.message || 'Token inválido o expirado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="surface-ground flex align-items-center justify-content-center min-h-screen">
            <div className="surface-card p-4 shadow-2 border-round w-full lg:w-5">
                <div className="text-center mb-5">
                    <div className="text-900 text-3xl font-medium mb-3">Confirmar Cuenta</div>
                    <span className="text-600">Ingresa el token que recibiste en tu correo</span>
                </div>

                {error && (
                    <div className="mb-3 p-3 bg-red-100 text-red-700 border-round">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="mb-3 p-3 bg-green-100 text-green-700 border-round">
                        {success}
                    </div>
                )}

                <div className="field">
                    <label className="block text-900 font-medium mb-2">Token de confirmación</label>
                    <InputText
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="w-full mb-3"
                        placeholder="Ej: eyJhbGciOiJIUzI1NiIs..."
                    />
                </div>

                <Button
                    label={loading ? "Confirmando..." : "Confirmar Cuenta"}
                    icon="pi pi-check"
                    onClick={handleConfirm}
                    className="w-full p-3"
                    disabled={loading}
                />

                <div className="text-center mt-3">
                    <a href="/auth/login" className="font-medium no-underline text-blue-500">
                        Volver al login
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ConfirmPage;