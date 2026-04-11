'use client';
import React, { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { CurrencyApiService } from '@/src/service/currencyApi.service';

const Dashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exchangeRates, setExchangeRates] = useState<any>({ USD_to_GTQ: 0, GTQ_to_USD: 0 });

    const API_URL = 'http://localhost:3001/api/dashboard/stats'; 

    // Paleta de colores consistente para tarjetas y gráfica
    const coloresMonedas: { [key: string]: string } = {
        'Q': '#6366F1',    // Indigo
        '$': '#22C55E',    // Verde
        'MX$': '#EF4444',  // Rojo
        'L': '#F59E0B',    // Ambar
        'C$': '#06B6D4'    // Cian
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [response, rates] = await Promise.all([
                    fetch(API_URL),
                    CurrencyApiService.getLiveRates()
                ]);
                
                const data = await response.json();
                setStats(data);
                setExchangeRates(rates);

                // 1. Filtrar solo bancos con saldo > 0
                const labels = Array.from(new Set(
                    data.distribucionBancos
                        ?.filter((item: any) => parseFloat(item.total) > 0)
                        .map((item: any) => item.bank || item.name)
                )) as string[];

                // 2. Identificar monedas únicas (filtrando nulos)
                const simbolosMoneda = Array.from(new Set(
                    data.distribucionBancos
                        ?.map((item: any) => item.currency || item.id)
                        .filter((s: any) => s !== null && s !== undefined && s !== '')
                )) as string[];

                // 3. Generar datasets para la gráfica
                const datasetsDinamicos = simbolosMoneda.map((simbolo, index) => {
                    const color = coloresMonedas[simbolo] || ['#8B5CF6', '#EC4899', '#10B981'][index % 3];
                    return {
                        label: `Saldos en ${simbolo}`,
                        backgroundColor: color,
                        borderRadius: 10,
                        barPercentage: 0.8,
                        categoryPercentage: 0.9,
                        data: labels.map(bankName => {
                            const registro = data.distribucionBancos.find((item: any) => 
                                (item.bank === bankName || item.name === bankName) && (item.currency === simbolo || item.id === simbolo)
                            );
                            return registro ? parseFloat(registro.total) : 0;
                        })
                    };
                });

                setChartData({ labels: labels, datasets: datasetsDinamicos });
                setLoading(false);
            } catch (error) {
                console.error("Error cargando el dashboard:", error);
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="card">Cargando indicadores de GESBANCA...</div>;

    // Función auxiliar para calcular equivalentes dinámicos
    const getEquivalente = (monto: number, simbolo: string) => {
        if (simbolo === 'Q') return { val: monto * exchangeRates.GTQ_to_USD, s: '$', loc: 'en-US' };
        if (simbolo === '$') return { val: monto * exchangeRates.USD_to_GTQ, s: 'Q', loc: 'es-GT' };
        // Para otras monedas (MXN, HNL), puedes añadir lógica aquí o mostrar en USD por defecto
        return { val: monto * (exchangeRates[`${simbolo}_to_USD`] || 0), s: '$', loc: 'en-US' };
    };

    return (
        <div className="grid">
            <div className="col-12 text-right mb-2">
                <div className="inline-block p-2 border-round bg-primary-reverse font-bold text-sm shadow-1">
                    <i className="pi pi-globe mr-2"></i>
                    Ref. Hoy: 1 USD = Q {exchangeRates.USD_to_GTQ.toFixed(2)}
                </div>
            </div>

            {/* --- SECCIÓN DE TARJETAS DINÁMICAS --- */}
            {stats?.saldos?.map((saldo: any, index: number) => {
                const simbolo = saldo.id; // Ejemplo: 'Q', '$', 'MX$'
                const color = coloresMonedas[simbolo] || '#9CA3AF';
                const eq = getEquivalente(parseFloat(saldo.total), simbolo);

                return (
                    <div key={index} className="col-12 lg:col-6 xl:col-3">
                        <div className="card mb-0 border-left-3 shadow-2" style={{ borderLeftColor: color }}>
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">Saldo en {simbolo}</span>
                                    <div className="text-900 font-bold text-xl">
                                        {simbolo} {parseFloat(saldo.total).toLocaleString(simbolo === '$' ? 'en-US' : 'es-GT', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="flex align-items-center justify-content-center border-round" style={{ width: '2.5rem', height: '2.5rem', backgroundColor: `${color}20` }}>
                                    <i className={`pi ${simbolo === '$' ? 'pi-dollar' : 'pi-wallet'}`} style={{ color: color, fontSize: '1.2rem' }} />
                                </div>
                            </div>
                            <span className="font-medium text-sm" style={{ color: color }}>
                                Eq: {eq.s} {eq.val.toLocaleString(eq.loc, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* --- TARJETAS FIJAS (TRANSACCIONES Y PENDIENTES) --- */}
            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0 shadow-2 border-left-3 border-orange-500">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Transacciones</span>
                            <div className="text-900 font-bold text-xl">{stats?.transaccionesMes || 0}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-sync text-orange-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-orange-500 text-sm">Actividad del mes</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className={`card mb-0 shadow-2 border-left-3 ${stats?.conciliacionesPendientes > 0 ? 'bg-red-50 border-red-500' : 'border-900'}`}>
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Pendientes</span>
                            <div className={`font-bold text-xl ${stats?.conciliacionesPendientes > 0 ? 'text-red-700' : 'text-900'}`}>
                                {stats?.conciliacionesPendientes || 0}
                            </div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-red-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-exclamation-triangle text-red-500 text-xl" />
                        </div>
                    </div>
                    <span className={stats?.conciliacionesPendientes > 0 ? 'text-red-500 font-bold text-sm' : 'text-500 text-sm'}>
                        {stats?.conciliacionesPendientes > 0 ? 'Revisión requerida' : 'Al día'}
                    </span>
                </div>
            </div>

            {/* --- GRÁFICA --- */}
            <div className="col-12 xl:col-6">
                <div className="card shadow-2">
                    <h5>Comparativa por Banco y Divisa</h5>
                    <div style={{ height: '550px' }}>
                        {chartData && (
                            <Chart 
                                type="bar" 
                                data={chartData} 
                                options={{ 
                                    maintainAspectRatio: false, 
                                    aspectRatio: 0.6, 
                                    plugins: { 
                                        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 25 } },
                                        tooltip: {
                                            callbacks: {
                                                label: (context: any) => {
                                                    let label = context.dataset.label || '';
                                                    if (label) label += ': ';
                                                    label += new Intl.NumberFormat('es-GT', { minimumFractionDigits: 2 }).format(context.parsed.y);
                                                    return label;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } },
                                        y: { 
                                            beginAtZero: true,
                                            ticks: { 
                                                callback: (value: any) => {
                                                    if (value >= 1000000) return (value / 1000000) + 'M';
                                                    if (value >= 1000) return (value / 1000) + 'K';
                                                    return value;
                                                }
                                            }
                                        }
                                    }
                                }} 
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card shadow-2">
                    <h5>Resumen de Operaciones</h5>
                    <DataTable value={[]} rows={5} emptyMessage="No hay movimientos recientes registrados.">
                        <Column field="fecha" header="Fecha" />
                        <Column field="banco" header="Banco" />
                        <Column field="monto" header="Monto" />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;