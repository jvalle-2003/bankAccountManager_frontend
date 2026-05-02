'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { TransactionService } from '../../../../src/service/transaction.service';
import { BankAccountService } from '../../../../src/service/BankAccountService';
import { CategoryService } from '../../../../src/service/category.service';
import { CurrencyService } from '../../../../src/service/currency.service';

const Transactions = () => {
    const [reportDialog, setReportDialog] = useState(false);
    interface ReportFilters {
        dateStart: Date | null | undefined;
        dateEnd: Date | null | undefined;
        account: any;
        format: string;
    }

    const [reportFilters, setReportFilters] = useState<ReportFilters>({
        dateStart: null,
        dateEnd: null,
        account: null,
        format: 'pdf'
    });

    const exportFormats = [
        { label: 'PDF', value: 'pdf' },
        { label: 'Excel', value: 'xlsx' },
        { label: 'CSV', value: 'csv' }
    ];

    const exportReport = () => {
        let filteredData = transactions.filter((t: any) => {
            // --- Filtro de Fechas ---
            const tDate = new Date(t.transaction_date);
            const start = reportFilters.dateStart ? new Date(reportFilters.dateStart) : null;
            const end = reportFilters.dateEnd ? new Date(reportFilters.dateEnd) : null;

            if (start && tDate < start) return false;
            if (end && tDate > end) return false;

            // --- Filtro de Cuenta (NUEVO) ---
            // Si reportFilters.account es null (Todas), no filtramos.
            // Si tiene valor, comparamos con el ID de la transacción.
            if (reportFilters.account !== null && t.account_id !== reportFilters.account) {
                return false;
            }

            return true;
        });

        if (filteredData.length === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Sin datos',
                detail: 'No hay transacciones que coincidan con los filtros',
                life: 3000
            });
            return;
        }

        if (reportFilters.format === 'pdf') {
            exportPDF(filteredData);
        } else {
            exportExcelCSV(filteredData, reportFilters.format);
        }
        setReportDialog(false);
    };

    const exportPDF = (data: any[]) => {
        const doc = new jsPDF();
        const tableRows = data.map((t) => [
            t.transaction_id,
            getAccountName(t.account_id),
            t.transaction_type,
            new Date(t.transaction_date).toLocaleDateString(),
            `${getCurrencySymbol(t.currency_id)} ${t.amount}`,
            t.cancelled ? 'Cancelada' : 'Activa'
        ]);

        autoTable(doc, {
            head: [['ID', 'Cuenta', 'Tipo', 'Fecha', 'Monto', 'Estado']],
            body: tableRows,
            theme: 'grid'
        });
        doc.save('Reporte_Transacciones.pdf');
    };

    const exportExcelCSV = (data: any[], format: string) => {
        const worksheetData = data.map((t) => ({
            ID: t.transaction_id,
            Cuenta: getAccountName(t.account_id),
            Tipo: t.transaction_type,
            Fecha: t.transaction_date,
            Monto: t.amount,
            Estado: t.cancelled ? 'Cancelada' : 'Activa'
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones');

        if (format === 'xlsx') {
            XLSX.writeFile(workbook, 'Reporte_Transacciones.xlsx');
        } else {
            XLSX.writeFile(workbook, 'Reporte_Transacciones.csv', { bookType: 'csv' });
        }
    };

    const emptyTransaction: any = {
        account_id: null,
        transaction_type: '',
        category_id: null,
        reference_number: null,
        transaction_date: new Date(),
        amount: 0,
        currency_id: null,
        concept: '',
        beneficiary: null
    };

    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [transaction, setTransaction] = useState(emptyTransaction);
    const [transactionDialog, setTransactionDialog] = useState(false);
    const [cancelDialog, setCancelDialog] = useState(false);

    const toast = useRef<Toast>(null);

    const generatePDF = (data: any) => {
        const doc = new jsPDF();

        const primaryColor = [41, 128, 185]; // Azul bancario

        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('COMPROBANTE DE TRANSACCIÓN', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });

        doc.setTextColor(40, 40, 40);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalles de la Operación', 14, 50);

        const cuentaNombre = getAccountName(data.account_id);
        const categoriaNombre = getCategoryName(data.category_id);
        const monedaSimbolo = getCurrencySymbol(data.currency_id);

        autoTable(doc, {
            startY: 55,
            theme: 'striped',
            headStyles: { fillColor: primaryColor as any },
            body: [
                ['ID de Transacción', `#${data.transaction_id || 'N/A'}`],
                ['Cuenta Origen', cuentaNombre],
                ['Tipo de Operación', data.transaction_type],
                ['Categoría', categoriaNombre],
                ['No. Referencia', data.reference_number || 'S/N'],
                ['Concepto', data.concept],
                ['Fecha de Aplicación', new Date(data.transaction_date).toLocaleDateString()],
                ['Estado', data.cancelled ? 'ANULADA' : 'COMPLETADA']
            ],
            styles: { fontSize: 11, cellPadding: 5 }
        });

        // --- CUADRO DE MONTO RESALTADO ---
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(1);
        doc.rect(14, finalY, 182, 20);

        doc.setFontSize(14);
        doc.text('MONTO TOTAL:', 20, finalY + 13);
        doc.setFontSize(16);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`${monedaSimbolo} ${data.amount.toFixed(2)}`, 190, finalY + 13, { align: 'right' });

        // --- PIE DE PÁGINA ---
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.text('Este documento es un comprobante digital de operación.', 105, 280, { align: 'center' });
        doc.text('Gracias por utilizar nuestros servicios bancarios electrónicos.', 105, 285, { align: 'center' });

        // Descargar el PDF
        doc.save(`Transaccion_${data.transaction_id || 'Nueva'}.pdf`);
    };

    const transactionTypes = [
        { label: 'Operaciones con Tarjetas', value: 'Operaciones con Tarjetas' },
        { label: 'Depósitos y Pagos', value: 'Depósitos y Pagos' },
        { label: 'Operaciones Especiales', value: 'Operaciones Especiales' },
        { label: 'Transferencias de Fondos', value: 'Transferencias de Fondos' }
    ];

    useEffect(() => {
        loadTransactions();
        loadAccounts();
        loadCategories();
        loadCurrencies();
    }, []);

    const loadTransactions = async () => {
        const data = await TransactionService.getAll();
        setTransactions(data);
    };

    const loadAccounts = async () => {
        try {
            const data = await BankAccountService.getAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Error en cuentas', error);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await CategoryService.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Error en categorías', error);
        }
    };

    const loadCurrencies = async () => {
        try {
            const data = await CurrencyService.getAll();
            setCurrencies(data);
        } catch (error) {
            console.error('Error en monedas', error);
        }
    };

    const openNew = () => {
        setTransaction(emptyTransaction);
        setTransactionDialog(true);
    };

    const saveTransaction = async () => {
        if (!transaction.concept || !transaction.amount || !transaction.account_id || !transaction.transaction_type) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Faltan campos obligatorios', life: 3000 });
            return;
        }

        try {
            let response;
            if (transaction.transaction_id) {
                response = await TransactionService.update(transaction.transaction_id, transaction);
            } else {
                response = await TransactionService.create({ ...transaction, created_by: 1 });
            }

            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Transacción guardada', life: 3000 });

            // LLAMADA AL PDF: Usamos la respuesta del servidor porque contiene el ID generado
            generatePDF(response);

            setTransactionDialog(false);
            loadTransactions();
        } catch (error) {
            console.error(error);
        }
    };

    const confirmCancel = (rowData: any) => {
        setTransaction(rowData);
        setCancelDialog(true);
    };

    const cancelTransaction = async () => {
        await TransactionService.cancel(transaction.transaction_id, 'Cancelado por el usuario');
        setCancelDialog(false);
        loadTransactions();
    };

    // Plantillas
    const leftToolbarTemplate = () => (
        <div className="flex flex-wrap gap-2">
            <Button label="Nueva Transacción" icon="pi pi-plus" severity="success" onClick={openNew} />
            <Button label="Generar Reporte" icon="pi pi-file-export" severity="help" onClick={() => setReportDialog(true)} />
        </div>
    );
    const actionBodyTemplate = (rowData: any) => (
        <>
            <Button
                icon="pi pi-file-pdf" // Icono de PDF
                rounded
                severity="info" // Color azul
                className="mr-2"
                onClick={() => generatePDF(rowData)} // Imprime la fila seleccionada
            />
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                className="mr-2"
                onClick={() => {
                    setTransaction(rowData);
                    setTransactionDialog(true);
                }}
            />
            {!rowData.cancelled && <Button icon="pi pi-ban" rounded severity="danger" onClick={() => confirmCancel(rowData)} />}
        </>
    );

    const getCurrencySymbol = (id: any) => {
        if (!currencies || currencies.length === 0) return '';

        // Usamos == en lugar de === por si uno es string ("1") y el otro number (1)
        const currency = currencies.find((c: any) => c.id_currency == id);

        return currency ? currency.symbol : '';
    };

    const getAccountName = (id: any) => {
        const account = accounts.find((a: any) => a.account_id == id);
        return account ? account.account_alias : 'Sin Cuenta';
    };

    const getCategoryName = (id: any) => {
        const category = categories.find((c: any) => c.category_id == id);
        return category ? category.category_name + '/' + category.movement_type : 'Sin Categoría';
    };

    const formatDate = (value: string) => {
        if (!value) return 'N/A';

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

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" left={leftToolbarTemplate} />

            <DataTable value={transactions} paginator rows={10}>
                <Column field="transaction_id" header="ID" sortable />

                {/* COLUMNA CUENTA */}
                <Column header="Cuenta" sortable body={(rowData) => getAccountName(rowData.account_id)} />

                <Column field="transaction_type" header="Tipo" sortable />
                <Column field="reference_number" header="No. Referencia" sortable />

                {/* COLUMNA CATEGORÍA */}
                <Column header="Categoría" sortable body={(rowData) => getCategoryName(rowData.category_id)} />

                <Column field="transaction_date" header="Fecha" sortable />
                <Column field="concept" header="Concepto" />
                {/* COLUMNA MONTO (con el símbolo que ya arreglamos) */}
                <Column
                    header="Monto"
                    sortable
                    body={(rowData) => (
                        <span>
                            {getCurrencySymbol(rowData.currency_id)} {rowData.amount}
                        </span>
                    )}
                />

                <Column header="Estado" body={(row) => (row.cancelled ? '🔴 Cancelada' : '🟢 Activa')} />
                <Column body={actionBodyTemplate} header="Acciones" />
            </DataTable>

            <Dialog
                visible={transactionDialog}
                style={{ width: '500px' }}
                header="Detalle de Transacción"
                modal
                onHide={() => setTransactionDialog(false)}
                footer={
                    <>
                        <Button label="Cancelar" text onClick={() => setTransactionDialog(false)} />
                        <Button label="Guardar" text onClick={saveTransaction} />
                    </>
                }
            >
                <div className="grid">
                    {/* CUENTA BANCARIA */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Cuenta Bancaria</label>
                        <Dropdown
                            value={transaction.account_id}
                            options={accounts}
                            onChange={(e) => setTransaction({ ...transaction, account_id: e.value })}
                            optionLabel="account_alias"
                            optionValue="account_id"
                            placeholder="Seleccione la cuenta origen"
                            className="w-full"
                        />
                    </div>

                    {/* CATEGORIA */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Categoría</label>
                        <Dropdown
                            value={transaction.category_id} // <--- Asegúrate que apunte a category_id
                            options={categories}
                            onChange={(e) => setTransaction({ ...transaction, category_id: e.value })} // <--- Guardar en category_id
                            optionLabel="category_name"
                            optionValue="category_id"
                            placeholder="Seleccione la categoría"
                            className="w-full"
                        />
                    </div>

                    {/* TIPO DE TRANSACCION */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Tipo de Transacción</label>
                        <Dropdown value={transaction.transaction_type} options={transactionTypes} onChange={(e) => setTransaction({ ...transaction, transaction_type: e.value })} placeholder="Seleccione el tipo" className="w-full" />
                    </div>

                    {/* TIPO DE MONEDA */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Tipo de Moneda</label>
                        <Dropdown
                            value={transaction.currency_id} // <--- Asegúrate que apunte a currency_id
                            options={currencies}
                            onChange={(e) => setTransaction({ ...transaction, currency_id: e.value })} // <--- Guardar en currency_id
                            optionLabel="name" // O el nombre que use tu servicio (ej. "name")
                            optionValue="id_currency" // El ID que se guarda
                            placeholder="Seleccione la moneda"
                            className="w-full"
                        />
                    </div>

                    <div className="field col-12">
                        <label className="font-bold block mb-2">Concepto</label>
                        <InputText value={transaction.concept} onChange={(e) => setTransaction({ ...transaction, concept: e.target.value })} className="w-full" />
                    </div>

                    <div className="field col-6">
                        <label className="font-bold block mb-2">Monto</label>
                        <InputNumber value={transaction.amount} onValueChange={(e) => setTransaction({ ...transaction, amount: e.value })} mode="decimal" minFractionDigits={2} className="w-full" />
                    </div>

                    <div className="field col-12">
                        <label className="font-bold block mb-2">No. Referencia</label>
                        <InputText value={transaction.reference_number} onChange={(e) => setTransaction({ ...transaction, reference_number: e.target.value })} className="w-full" />
                    </div>

                    <div className="field col-12">
                        <label className="font-bold block mb-2">Fecha</label>
                        <Calendar
                            value={transaction.transaction_date ? new Date(transaction.transaction_date) : null}
                            onChange={(e) => setTransaction({ ...transaction, transaction_date: e.value })}
                            dateFormat="yy-mm-dd"
                            className="w-full"
                            showIcon
                        />
                    </div>
                </div>
            </Dialog>

            <Dialog
                visible={cancelDialog}
                header="Confirmar Cancelación"
                modal
                onHide={() => setCancelDialog(false)}
                footer={
                    <>
                        <Button label="No" text onClick={() => setCancelDialog(false)} />
                        <Button label="Sí, Anular" text onClick={cancelTransaction} />
                    </>
                }
            >
                <p>
                    ¿Seguro que desea anular la transacción <b>#{transaction.transaction_id}</b>?
                </p>
            </Dialog>

            <Dialog
                visible={reportDialog}
                style={{ width: '450px' }}
                header="Configurar Reporte"
                modal
                onHide={() => setReportDialog(false)}
                footer={
                    <>
                        <Button label="Cancelar" icon="pi pi-times" text onClick={() => setReportDialog(false)} />
                        <Button label="Descargar" icon="pi pi-download" onClick={exportReport} />
                    </>
                }
            >
                <div className="grid">
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Fecha Inicio</label>
                        <Calendar value={reportFilters.dateStart} onChange={(e) => setReportFilters({ ...reportFilters, dateStart: e.value })} dateFormat="yy-mm-dd" showIcon className="w-full" />
                    </div>
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Fecha Fin</label>
                        <Calendar value={reportFilters.dateEnd} onChange={(e) => setReportFilters({ ...reportFilters, dateEnd: e.value })} dateFormat="yy-mm-dd" showIcon className="w-full" />
                    </div>
                    {/* CUENTA BANCARIA */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Cuenta Bancaria</label>
                        <Dropdown
                            value={reportFilters.account}
                            // Añadimos la opción "Todas" al vuelo
                            options={[{ account_alias: 'Todas las cuentas', account_id: null }, ...accounts]}
                            onChange={(e) => setReportFilters({ ...reportFilters, account: e.value })}
                            optionLabel="account_alias"
                            optionValue="account_id"
                            placeholder="Seleccione una cuenta"
                            className="w-full"
                        />
                    </div>

                    <div className="field col-12">
                        <label className="font-bold block mb-2">Formato de Archivo</label>
                        <Dropdown value={reportFilters.format} options={exportFormats} onChange={(e) => setReportFilters({ ...reportFilters, format: e.value })} placeholder="Seleccione Formato" className="w-full" />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Transactions;
