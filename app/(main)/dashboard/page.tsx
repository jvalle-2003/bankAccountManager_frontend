/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
<<<<<<< HEAD:app/(main)/dashboard/page.tsx
import { Menu } from 'primereact/menu';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ProductService } from '../../../src/service/ProductService';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import Link from 'next/link';
import { Demo } from '@/types';
import { ChartData, ChartOptions } from 'chart.js';

// const lineData: ChartData = {
//     labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
//     datasets: [
//         {
//             label: 'First Dataset',
//             data: [65, 59, 80, 81, 56, 55, 40],
//             fill: false,
//             backgroundColor: '#2f4860',
//             borderColor: '#2f4860',
//             tension: 0.4
//         },
//         {
//             label: 'Second Dataset',
//             data: [28, 48, 40, 19, 86, 27, 90],
//             fill: false,
//             backgroundColor: '#00bb7e',
//             borderColor: '#00bb7e',
//             tension: 0.4
//         }
//     ]
// };

const Dashboard = () => {
    // const [products, setProducts] = useState<Demo.Product[]>([]);
    // const menu1 = useRef<Menu>(null);
    // const menu2 = useRef<Menu>(null);
    // const [lineOptions, setLineOptions] = useState<ChartOptions>({});
    // const { layoutConfig } = useContext(LayoutContext);

    // const applyLightTheme = () => {
    //     const lineOptions: ChartOptions = {
    //         plugins: {
    //             legend: {
    //                 labels: {
    //                     color: '#495057'
    //                 }
    //             }
    //         },
    //         scales: {
    //             x: {
    //                 ticks: {
    //                     color: '#495057'
    //                 },
    //                 grid: {
    //                     color: '#ebedef'
    //                 }
    //             },
    //             y: {
    //                 ticks: {
    //                     color: '#495057'
    //                 },
    //                 grid: {
    //                     color: '#ebedef'
    //                 }
    //             }
    //         }
    //     };

    //     setLineOptions(lineOptions);
    // };

    // const applyDarkTheme = () => {
    //     const lineOptions = {
    //         plugins: {
    //             legend: {
    //                 labels: {
    //                     color: '#ebedef'
    //                 }
    //             }
    //         },
    //         scales: {
    //             x: {
    //                 ticks: {
    //                     color: '#ebedef'
    //                 },
    //                 grid: {
    //                     color: 'rgba(160, 167, 181, .3)'
    //                 }
    //             },
    //             y: {
    //                 ticks: {
    //                     color: '#ebedef'
    //                 },
    //                 grid: {
    //                     color: 'rgba(160, 167, 181, .3)'
    //                 }
    //             }
    //         }
    //     };

    //     setLineOptions(lineOptions);
    // };

    // useEffect(() => {
    //     ProductService.getProductsSmall().then((data) => setProducts(data));
    // }, []);

    // useEffect(() => {
    //     if (layoutConfig.colorScheme === 'light') {
    //         applyLightTheme();
    //     } else {
    //         applyDarkTheme();
    //     }
    // }, [layoutConfig.colorScheme]);

    // const formatCurrency = (value: number) => {
    //     return value?.toLocaleString('en-US', {
    //         style: 'currency',
    //         currency: 'USD'
    //     });
    // };
=======
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
>>>>>>> tabla-cuentas:app/(main)/page.tsx

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
<<<<<<< HEAD:app/(main)/dashboard/page.tsx
            {/* <div className="col-12 lg:col-6 xl:col-3">
=======
            {/* TARJETAS DE RESUMEN (Sin cambios) */}
            <div className="col-12 lg:col-6 xl:col-4">
>>>>>>> tabla-cuentas:app/(main)/page.tsx
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
<<<<<<< HEAD:app/(main)/dashboard/page.tsx

                <div className="card">
                    <div className="flex align-items-center justify-content-between mb-4">
                        <h5>Notifications</h5>
                        <div>
                            <Button type="button" icon="pi pi-ellipsis-v" rounded text className="p-button-plain" onClick={(event) => menu2.current?.toggle(event)} />
                            <Menu
                                ref={menu2}
                                popup
                                model={[
                                    { label: 'Add New', icon: 'pi pi-fw pi-plus' },
                                    { label: 'Remove', icon: 'pi pi-fw pi-minus' }
                                ]}
                            />
                        </div>
                    </div>

                    <span className="block text-600 font-medium mb-3">TODAY</span>
                    <ul className="p-0 mx-0 mt-0 mb-4 list-none">
                        <li className="flex align-items-center py-2 border-bottom-1 surface-border">
                            <div className="w-3rem h-3rem flex align-items-center justify-content-center bg-blue-100 border-circle mr-3 flex-shrink-0">
                                <i className="pi pi-dollar text-xl text-blue-500" />
                            </div>
                            <span className="text-900 line-height-3">
                                Richard Jones
                                <span className="text-700">
                                    {' '}
                                    has purchased a blue t-shirt for <span className="text-blue-500">79$</span>
                                </span>
                            </span>
                        </li>
                        <li className="flex align-items-center py-2">
                            <div className="w-3rem h-3rem flex align-items-center justify-content-center bg-orange-100 border-circle mr-3 flex-shrink-0">
                                <i className="pi pi-download text-xl text-orange-500" />
                            </div>
                            <span className="text-700 line-height-3">
                                Your request for withdrawal of <span className="text-blue-500 font-medium">2500$</span> has been initiated.
                            </span>
                        </li>
                    </ul>

                    <span className="block text-600 font-medium mb-3">YESTERDAY</span>
                    <ul className="p-0 m-0 list-none">
                        <li className="flex align-items-center py-2 border-bottom-1 surface-border">
                            <div className="w-3rem h-3rem flex align-items-center justify-content-center bg-blue-100 border-circle mr-3 flex-shrink-0">
                                <i className="pi pi-dollar text-xl text-blue-500" />
                            </div>
                            <span className="text-900 line-height-3">
                                Keyser Wick
                                <span className="text-700">
                                    {' '}
                                    has purchased a black jacket for <span className="text-blue-500">59$</span>
                                </span>
                            </span>
                        </li>
                        <li className="flex align-items-center py-2 border-bottom-1 surface-border">
                            <div className="w-3rem h-3rem flex align-items-center justify-content-center bg-pink-100 border-circle mr-3 flex-shrink-0">
                                <i className="pi pi-question text-xl text-pink-500" />
                            </div>
                            <span className="text-900 line-height-3">
                                Jane Davis
                                <span className="text-700"> has posted a new questions about your product.</span>
                            </span>
                        </li>
                    </ul>
                </div>
                <div
                    className="px-4 py-5 shadow-2 flex flex-column md:flex-row md:align-items-center justify-content-between mb-3"
                    style={{
                        borderRadius: '1rem',
                        background: 'linear-gradient(0deg, rgba(0, 123, 255, 0.5), rgba(0, 123, 255, 0.5)), linear-gradient(92.54deg, #1C80CF 47.88%, #FFFFFF 100.01%)'
                    }}
                >
                    <div>
                        <div className="text-blue-100 font-medium text-xl mt-2 mb-3">TAKE THE NEXT STEP</div>
                        <div className="text-white font-medium text-5xl">Try PrimeBlocks</div>
                    </div>
                    <div className="mt-4 mr-auto md:mt-0 md:mr-0">
                        <Link href="https://blocks.primereact.org" className="p-button font-bold px-5 py-3 p-button-warning p-button-rounded p-button-raised">
                            Get Started
                        </Link>
                    </div>
                </div>
            </div> */}
=======
            </div>
>>>>>>> tabla-cuentas:app/(main)/page.tsx
        </div>
    );
};

export default Dashboard;