/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useContext, useEffect, useState } from 'react';
// 1. Importamos useRouter para la navegación
import { useRouter } from 'next/navigation'; 

import { BankAccountService } from '../../demo/service/BankAccountService';
import { LayoutContext } from '../../layout/context/layoutcontext';

import { ChartData, ChartOptions } from 'chart.js';

const Dashboard = () => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [lineOptions, setLineOptions] = useState<ChartOptions>({});
    
    // 2. Inicializamos el router
    const router = useRouter(); 

    const contextValue = useContext(LayoutContext);
    const layoutConfig = (contextValue as any).layoutConfig;

    const lineData: ChartData = {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
        datasets: [
            {
                label: 'Flujo de Efectivo',
                data: [12000, 15000, 14000, 18000, 22000, 25000],
                fill: false,
                backgroundColor: '#2f4860',
                borderColor: '#2f4860',
                tension: 0.4
            }
        ]
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const data = await BankAccountService.getAccounts();
            setAccounts(data);
            const total = data.reduce((acc: number, curr: any) => acc + Number(curr.current_balance), 0);
            setTotalBalance(total);
        } catch (error) {
            console.error("Error cargando dashboard:", error);
        }
    };

    const formatCurrency = (value: number) => {
        return value?.toLocaleString('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        });
    };

    useEffect(() => {
        const options: ChartOptions = {
            plugins: {
                legend: { labels: { color: layoutConfig?.colorScheme === 'light' ? '#495057' : '#ebedef' } }
            },
            scales: {
                x: { grid: { color: layoutConfig?.colorScheme === 'light' ? '#ebedef' : 'rgba(160, 167, 181, .3)' } },
                y: { grid: { color: layoutConfig?.colorScheme === 'light' ? '#ebedef' : 'rgba(160, 167, 181, .3)' } }
            }
        };
        setLineOptions(options);
    }, [layoutConfig?.colorScheme]);

    return (
        <div className="grid">
            {/* TARJETAS DE RESUMEN (Sin cambios) */}
            <div className="col-12 lg:col-6 xl:col-4">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Saldo Total Consolidado</span>
                            <div className="text-900 font-medium text-xl">{formatCurrency(totalBalance)}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-money-bill text-green-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">Actualizado </span>
                    <span className="text-500">al momento</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-4">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Cuentas Bancarias</span>
                            <div className="text-900 font-medium text-xl">{accounts.length} Registradas</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-wallet text-blue-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-blue-500 font-medium">Gestión </span>
                    <span className="text-500">de activos</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-4">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Entidades</span>
                            <div className="text-900 font-medium text-xl">Multi-Banco</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-building text-purple-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-purple-500 font-medium">Sistema </span>
                    <span className="text-500">GESBANCA</span>
                </div>
            </div>

            {/* SECCIÓN DE CUENTAS RECIENTES (Modificada) */}
            <div className="col-12 xl:col-6">
                <div className="card">
                    {/* 3. Agregamos Flexbox para alinear título y botón */}
                    <div className="flex justify-content-between align-items-center mb-5">
                        <h5>Cuentas Recientes</h5>
                        {/* 4. Botón de acceso rápido al CRUD operativo */}
                        <Button 
                            label="Gestionar Cuentas" 
                            icon="pi pi-external-link" 
                            className="p-button-outlined p-button-sm"
                            // 5. Navegación a la página operativa que creamos antes
                            onClick={() => router.push('/pages/crud')} 
                        />
                    </div>
                    <DataTable value={accounts.slice(0, 5)} rows={5} responsiveLayout="scroll" emptyMessage="No hay cuentas recientes.">
                        <Column field="account_number" header="Número de Cuenta" style={{ width: '35%' }} />
                        <Column field="Bank.bank_name" header="Banco" style={{ width: '35%' }} />
                        <Column field="current_balance" header="Saldo" body={(data) => formatCurrency(data.current_balance)} sortable />
                    </DataTable>
                </div>
            </div>

            {/* GRÁFICA (Sin cambios) */}
            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Resumen de Movimientos</h5>
                    <Chart type="line" data={lineData} options={lineOptions} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;