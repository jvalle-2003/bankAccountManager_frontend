'use client';
import React, { useState, useRef } from 'react';
import { FileUpload } from 'primereact/fileupload';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { StatementService } from '@/src/service/statementService';
import axios from 'axios';

const DataMatch = () => {
    const [pdfTransactions, setPdfTransactions] = useState<any[]>([]);
    const [accountInfo, setAccountInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const toast = useRef<any>(null);

    const onUpload = async (event: any) => {
        setLoading(true);
        const file = event.files[0];
        try {
            const res = await StatementService.processStatement(file);
            setPdfTransactions(res.transactions);
            setAccountInfo(res.meta);
            toast.current.show({ severity: 'success', summary: 'Match Ready', detail: `Cuenta: ${res.meta.accountName}` });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error al procesar PDF.' });
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = async () => {
        try {
            const response = await axios.post('http://localhost:3001/api/statements/download-excel', {
                pdfTransactions,
                accountId: accountInfo.accountId
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Conciliacion_${accountInfo.accountName}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error descargando Excel", error);
        }
    };

    const calculateTotals = () => {
        let totalDebits = 0;
        let totalCredits = 0;
        pdfTransactions.forEach((t) => {
            totalDebits += t.debit || 0;
            totalCredits += t.credit || 0;
        });
        const finalBalance = pdfTransactions.length > 0 ? pdfTransactions[pdfTransactions.length - 1].balance : 0;
        return { totalDebits, totalCredits, finalBalance };
    };

    const { totalDebits, totalCredits, finalBalance } = calculateTotals();

    const footerGroup = (
        <ColumnGroup>
            <Row>
                <Column footer="Resumen del Mes:" colSpan={2} footerStyle={{ textAlign: 'right', fontWeight: 'bold' }} />
                <Column footer={`Q ${totalDebits.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`} footerStyle={{ color: '#ef4444' }} />
                <Column footer={`Q ${totalCredits.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`} footerStyle={{ color: '#22c55e' }} />
                <Column footer={`Q ${finalBalance.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`} footerStyle={{ fontWeight: '900' }} />
                <Column />
            </Row>
        </ColumnGroup>
    );

    return (
        <div className="card shadow-4" style={{ minHeight: '85vh' }}>
            <Toast ref={toast} />
            <div className="flex justify-content-between align-items-center mb-4 border-bottom-1 border-300 pb-3">
                <div>
                    <h1 className="m-0 text-4xl font-bold text-gray-800">DataMatch</h1>
                    {accountInfo && (
                        <p className="text-primary font-medium text-xl mt-2">
                            <i className="pi pi-building mr-2"></i>
                            {accountInfo.bank} | {accountInfo.accountName} ({accountInfo.accountNumber})
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button 
                        label="Descargar Excel" 
                        icon="pi pi-file-excel" 
                        className="p-button-success p-button-lg" 
                        onClick={downloadExcel} 
                        disabled={pdfTransactions.length === 0} 
                    />
                    <FileUpload 
                        mode="basic" name="statement" auto customUpload 
                        uploadHandler={onUpload} accept="application/pdf" 
                        chooseLabel="Cargar PDF G&T" className="p-button-lg" disabled={loading} 
                    />
                </div>
            </div>

            <DataTable 
                value={pdfTransactions} footerColumnGroup={footerGroup} scrollable 
                scrollHeight="calc(100vh - 380px)" loading={loading} className="p-datatable-gridlines p-datatable-sm"
            >
                <Column field="date" header="Fecha" style={{ width: '10%' }} />
                <Column field="description" header="Descripción" style={{ width: '40%' }} />
                <Column header="Débito" body={(row) => <span className="text-red-500 font-bold">{row.debit > 0 ? `Q ${row.debit.toFixed(2)}` : '-'}</span>} />
                <Column header="Crédito" body={(row) => <span className="text-green-500 font-bold">{row.credit > 0 ? `Q ${row.credit.toFixed(2)}` : '-'}</span>} />
                <Column header="Saldo" body={(row) => <b>Q {row.balance.toFixed(2)}</b>} />
                <Column header="Estado" body={() => <Tag severity="warning" value="PENDIENTE" rounded />} />
            </DataTable>
        </div>
    );
};

export default DataMatch;