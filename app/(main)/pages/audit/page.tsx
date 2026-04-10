'use client';
import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { auditService } from '../../../../src/service/audit.service'; 

const AuditPage = () => {
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        return rowData.User ? `${rowData.User.username}` : `ID: ${rowData.user_id}`;
    };

    const ipBodyTemplate = (rowData: any) => {
        return <Tag severity="info" value={rowData.last_ip || 'Desconocida'} />;
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>Historial de Auditoría</h5>
                    <p>Registro de actividad de usuarios e inicios de sesión.</p>
                    
                    <DataTable 
                        value={audits} 
                        paginator 
                        rows={10} 
                        loading={loading}
                        responsiveLayout="scroll"
                        emptyMessage="No se encontraron registros de auditoría."
                        sortField="last_activity" 
                        sortOrder={-1} // Mostrar lo más reciente primero
                    >
                        <Column field="audit_id" header="ID" sortable />
                        <Column header="Usuario" body={userBodyTemplate} sortable sortField="user_id" />
                        <Column field="description" header="Acción / Descripción" />
                        <Column header="Último Login" body={dateBodyTemplate} sortable />
                        <Column header="Última Actividad" body={activityBodyTemplate} sortable />
                        <Column header="Dirección IP" body={ipBodyTemplate} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default AuditPage;