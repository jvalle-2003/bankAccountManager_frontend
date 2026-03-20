'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import axios from 'axios';

const RegisterPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Datos del formulario
    const [formData, setFormData] = useState({
        first_name: '',
        second_name: '',
        third_name: '',
        first_surname: '',
        second_surname: '',
        email: '',
        username: '',
        password: '',
        role_id: 2 // Rol por defecto (ej: USUARIO)
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('http://localhost:3001/api/users/register', formData);
            
            setSuccess('Usuario creado. Revisa tu correo para confirmar tu cuenta.');
            
            // Opcional: redirigir después de 3 segundos
            setTimeout(() => {
                router.push('/auth/confirmar');
            }, 3000);

        } catch (error: any) {
            setError(error.response?.data?.message || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="surface-ground flex align-items-center justify-content-center min-h-screen">
            <div className="surface-card p-4 shadow-2 border-round w-full lg:w-6">
                <div className="text-center mb-5">
                    <div className="text-900 text-3xl font-medium mb-3">Registro de Usuario</div>
                    <span className="text-600 font-medium">Crea tu cuenta en GESBANCA</span>
                </div>

                <form onSubmit={handleSubmit}>
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

                    <div className="grid">
                        <div className="col-6">
                            <label className="block text-900 font-medium mb-2">Primer Nombre *</label>
                            <InputText
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full mb-3"
                                required
                            />
                        </div>
                        <div className="col-6">
                            <label className="block text-900 font-medium mb-2">Segundo Nombre *</label>
                            <InputText
                                name="second_name"
                                value={formData.second_name}
                                onChange={handleChange}
                                className="w-full mb-3"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid">
                        <div className="col-6">
                            <label className="block text-900 font-medium mb-2">Primer Apellido *</label>
                            <InputText
                                name="first_surname"
                                value={formData.first_surname}
                                onChange={handleChange}
                                className="w-full mb-3"
                                required
                            />
                        </div>
                        <div className="col-6">
                            <label className="block text-900 font-medium mb-2">Segundo Apellido *</label>
                            <InputText
                                name="second_surname"
                                value={formData.second_surname}
                                onChange={handleChange}
                                className="w-full mb-3"
                                required
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label className="block text-900 font-medium mb-2">Email *</label>
                        <InputText
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full mb-3"
                            required
                        />
                    </div>

                    <div className="field">
                        <label className="block text-900 font-medium mb-2">Nombre de Usuario *</label>
                        <InputText
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full mb-3"
                            required
                        />
                    </div>

                    <div className="field">
                        <label className="block text-900 font-medium mb-2">Contraseña *</label>
                        <Password
                            name="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="w-full mb-3"
                            inputClassName="w-full"
                            feedback={false}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        label={loading ? "Registrando..." : "Registrarse"}
                        icon="pi pi-user-plus"
                        className="w-full p-3"
                        disabled={loading}
                    />
                </form>

                <div className="text-center mt-3">
                    <a href="/auth/login" className="font-medium no-underline text-blue-500">
                        ¿Ya tienes cuenta? Inicia sesión
                    </a>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;