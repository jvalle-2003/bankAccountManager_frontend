'use client';
import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { auditService } from '../../../../src/service/audit.service'; 

const AuditPage = () => {
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<any>(null);

    useEffect(() => {
        loadAudits();
    }, []);

    const loadAudits = async () => {
        try {
            const data = await auditService.getAll();
            setAudits(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Lógica para comparar JSONs y mostrar diferencias
    const rowExpansionTemplate = (data: any) => {
        const prev = data.previous_values ? JSON.parse(data.previous_values) : {};
        const next = data.new_values ? JSON.parse(data.new_values) : {};
        
        // Obtenemos las llaves que tienen valores diferentes
        const keys = Object.keys({ ...prev, ...next });
        const diffs = keys.filter(key => JSON.stringify(prev[key]) !== JSON.stringify(next[key]));

        return (
            <div className="p-3">
                <h6>Detalles del Cambio (Valores modificados)</h6>
                <table className="w-full border-collapse shadow-sm">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="p-2 border">Campo</th>
                            <th className="p-2 border text-red-600">Valor Anterior</th>
                            <th className="p-2 border text-green-600">Valor Nuevo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {diffs.map(key => (
                            <tr key={key}>
                                <td className="p-2 border font-bold text-blue-800">{key}</td>
                                <td className="p-2 border bg-red-50">{String(prev[key] ?? 'N/A')}</td>
                                <td className="p-2 border bg-green-50">{String(next[key] ?? 'N/A')}</td>
                            </tr>
                        ))}
                        {diffs.length === 0 && (
                            <tr><td colSpan={3} className="p-2 text-center italic">Sin cambios detallados (Posible inserción o eliminación completa)</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const formatDate = (value: string) => {
    if (!value) return "N/A";

    // Mantenemos la fecha original, pero forzamos a que se muestre en UTC
    return new Date(value).toLocaleString('es-GT', {
        timeZone: 'UTC', 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
    });
};

    const actionTemplate = (rowData: any) => {
    // Convertimos el texto a mayúsculas para que sea fácil de buscar
    const action = rowData.description?.toUpperCase() || '';

    // Dependiendo de la palabra clave, pintamos un Tag diferente
    if (action.includes('INSERT')) {
        return <Tag severity="success" icon="pi pi-plus" value="Creación" rounded />;
    } 
    if (action.includes('UPDATE')) {
        return <Tag severity="warning" icon="pi pi-pencil" value="Actualización" rounded />;
    } 
    if (action.includes('DELETE')) {
        return <Tag severity="danger" icon="pi pi-trash" value="Eliminación" rounded />;
    }

    // Si hay un mensaje distinto, lo mostramos con un color neutro
    return <Tag severity="info" icon="pi pi-info-circle" value="Otro Movimiento" rounded />;
};

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card shadow-2">
                    <h5><i className="pi pi-shield mr-2"></i>Historial de Auditoría</h5>
                    
                    <DataTable 
                        value={audits} 
                        paginator rows={10} 
                        loading={loading}
                        expandedRows={expandedRows} 
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={rowExpansionTemplate}
                        dataKey="audit_id"
                        responsiveLayout="scroll"
                        emptyMessage="No se encontraron registros."
                        sortField="last_activity" 
                        sortOrder={-1}
                    >
                        {/* Columna para el botón de expandir */}
                        <Column expander style={{ width: '3em' }} />
                        
                        <Column field="audit_id" header="ID" sortable />
                        <Column header="Usuario" body={(row) => row.User?.username || `ID: ${row.user_id}`} sortable />
                        {/*<Column field="description" header="Acción" />*/}
                        <Column header="Acción" body={actionTemplate} />
                        <Column header="Fecha/Hora Actividad" body={(row) => formatDate(row.last_activity)} sortable />
                        <Column header="IP" body={(row) => {
                                                                // Si la IP es ::1 o 127.0.0.1, mostramos la palabra "Localhost"
                                                                const ipVisual = (row.last_ip === '::1' || row.last_ip === '127.0.0.1') 
                                                                    ? 'Localhost' 
                                                                    : row.last_ip;
                                                                    
                                                                return <Tag severity="info" value={ipVisual || 'Desconocida'} />;
                                                            }} 
/>
                        <Column header="Tabla" body={(row) => <Tag severity="warning" value={row.table_name || 'N/A'} />} sortable />
                        <Column field="record_id" header="ID Registro" sortable />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default AuditPage;