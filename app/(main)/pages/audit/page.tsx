'use client';
import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';
import { auditService } from '../../../../src/service/audit.service'; 

const AuditPage = () => {
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadAudits();
    }, []);

    const loadAudits = async () => {
        setLoading(true);
        try {
            const data = await auditService.getAll();
            setAudits(data);
        } catch (error) {
            console.error(error);
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo cargar el historial de auditoría', 
                life: 3000 
            });
        } finally {
            setLoading(false);
        }
    };

    // Formateador de Fechas (Sequelize Date -> String legible)
    const formatDate = (value: string) => {
        if (!value) return "N/A";
        return new Date(value).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Templates para la tabla
    const dateBodyTemplate = (rowData: any) => formatDate(rowData.last_login);
    const activityBodyTemplate = (rowData: any) => formatDate(rowData.last_activity);
    
    const userBodyTemplate = (rowData: any) => {
        // Asumiendo que el backend hace el 'include' del modelo User
        return rowData.User ? (
            <div className="flex align-items-center gap-2">
                <i className="pi pi-user text-primary"></i>
                <span>{rowData.User.username}</span>
            </div>
        ) : (
            <Tag severity="warning" value={`ID: ${rowData.user_id}`} />
        );
    };

    const ipBodyTemplate = (rowData: any) => {
        return <Tag severity="info" value={rowData.last_ip || 'Desconocida'} />;
    };

    // Toolbar para mantener consistencia con UserPage
    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Actualizar" icon="pi pi-refresh" severity="info" onClick={loadAudits} loading={loading} />
            </div>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <h5>Historial de Auditoría</h5>
                    <p className="mb-4">Registro detallado de actividad de usuarios y accesos al sistema.</p>
                    
                    <Toolbar className="mb-4" left={leftToolbarTemplate} />

                    <DataTable 
                        value={audits} 
                        paginator 
                        rows={10} 
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        loading={loading}
                        className="p-datatable-sm"
                        responsiveLayout="scroll"
                        emptyMessage="No se encontraron registros de auditoría."
                        sortField="last_activity" 
                        sortOrder={-1} // Mostrar lo más reciente primero
                    >
                        <Column field="audit_id" header="ID" sortable style={{ width: '5rem' }} />
                        <Column header="Usuario" body={userBodyTemplate} sortable sortField="User.username" />
                        <Column field="description" header="Acción / Descripción" />
                        <Column header="Último Login" body={dateBodyTemplate} sortable sortField="last_login" />
                        <Column header="Última Actividad" body={activityBodyTemplate} sortable sortField="last_activity" />
                        <Column header="Dirección IP" body={ipBodyTemplate} style={{ width: '10rem' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default AuditPage;