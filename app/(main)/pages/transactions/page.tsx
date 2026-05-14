'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Tag } from 'primereact/tag';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { TransactionService } from '../../../../src/service/transaction.service';
import { BankAccountService } from '../../../../src/service/BankAccountService';
import { CategoryService } from '../../../../src/service/category.service';
import { CurrencyService } from '../../../../src/service/currency.service';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
    transaction_id?: number;
    account_id: number | null;
    transaction_type: string;
    category_id: number | null;
    reference_number: string | null;
    transaction_date: Date | string;
    amount: number;
    currency_id: number | null;
    concept: string;
    beneficiary: string | null;
    cancelled?: boolean;
}

interface ReportFilters {
    dateStart: Date | null;
    dateEnd: Date | null;
    account: number | null;
    format: 'pdf' | 'xlsx' | 'csv';
}

interface ValidationErrors {
    account_id?: string;
    transaction_type?: string;
    category_id?: string;
    currency_id?: string;
    concept?: string;
    amount?: string;
    transaction_date?: string;
    reference_number?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_TRANSACTION: Transaction = {
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

const EMPTY_REPORT_FILTERS: ReportFilters = {
    dateStart: null,
    dateEnd: null,
    account: null,
    format: 'pdf'
};

const TRANSACTION_TYPES = [
    { label: 'Operaciones con Tarjetas', value: 'Operaciones con Tarjetas' },
    { label: 'Depósitos y Pagos', value: 'Depósitos y Pagos' },
    { label: 'Operaciones Especiales', value: 'Operaciones Especiales' },
    { label: 'Transferencias de Fondos', value: 'Transferencias de Fondos' }
];

const EXPORT_FORMATS = [
    { label: 'PDF', value: 'pdf' },
    { label: 'Excel', value: 'xlsx' },
    { label: 'CSV', value: 'csv' }
];

const PRIMARY_COLOR: [number, number, number] = [41, 128, 185];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDateLocale = (value: string | Date): string => {
    if (!value) return 'N/A';
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

const today = (): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

// ─── Component ───────────────────────────────────────────────────────────────

const Transactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);

    const [transaction, setTransaction] = useState<Transaction>(EMPTY_TRANSACTION);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const [transactionDialog, setTransactionDialog] = useState(false);
    const [cancelDialog, setCancelDialog] = useState(false);
    const [reportDialog, setReportDialog] = useState(false);
    const [reportFilters, setReportFilters] = useState<ReportFilters>(EMPTY_REPORT_FILTERS);
    const [reportErrors, setReportErrors] = useState<{ dateEnd?: string }>({});

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const toast = useRef<Toast>(null);

    // ── Lookups ──────────────────────────────────────────────────────────────

    const getAccountName = useCallback((id: any): string => accounts.find((a) => a.account_id == id)?.account_alias ?? 'Sin Cuenta', [accounts]);

    const getCategoryName = useCallback(
        (id: any): string => {
            const cat = categories.find((c) => c.category_id == id);
            return cat ? `${cat.category_name} / ${getMovementLabel(cat.movement_type)}` : 'Sin Categoría';
        },
        [categories]
    );

    const getMovementLabel = (value: string): string => {
        const movementOptions = [
            { label: 'Crédito', value: 'INGRESO' },
            { label: 'Débito', value: 'EGRESO' }
        ];
        const found = movementOptions.find((o) => o.value === value);
        return found ? found.label : value ?? '—';
    };

    const getCurrencySymbol = useCallback((id: any): string => currencies.find((c) => c.id_currency == id)?.symbol ?? '', [currencies]);

    // ── Data Loading ─────────────────────────────────────────────────────────

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await TransactionService.getAll();
            setTransactions(data);
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las transacciones', life: 3000 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [txData, accData, catData, curData] = await Promise.all([TransactionService.getAll(), BankAccountService.getAccounts(), CategoryService.getAll(), CurrencyService.getAll()]);
                setTransactions(txData);
                setAccounts(accData);
                setCategories(catData);
                setCurrencies(curData);
            } catch {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos iniciales', life: 4000 });
            }
        };
        loadAll();
    }, []);

    // ── Validation ───────────────────────────────────────────────────────────

    const validateTransaction = (t: Transaction): ValidationErrors => {
        const errs: ValidationErrors = {};
        if (!t.reference_number || t.reference_number.toString().trim() === '') {
            errs.reference_number = 'El número de referencia es obligatorio.';
        } else if (isNaN(Number(t.reference_number))) {
            errs.reference_number = 'Solo se permiten números.';
        }
        if (!t.account_id) errs.account_id = 'La cuenta bancaria es obligatoria.';
        if (!t.transaction_type) errs.transaction_type = 'El tipo de transacción es obligatorio.';
        if (!t.category_id) errs.category_id = 'La categoría es obligatoria.';
        if (!t.currency_id) errs.currency_id = 'La moneda es obligatoria.';

        if (!t.concept || t.concept.trim().length === 0) {
            errs.concept = 'El concepto es obligatorio.';
        } else if (t.concept.trim().length < 3) {
            errs.concept = 'El concepto debe tener al menos 3 caracteres.';
        } else if (t.concept.trim().length > 200) {
            errs.concept = 'El concepto no puede superar los 200 caracteres.';
        }

        if (t.amount === null || t.amount === undefined || isNaN(t.amount)) {
            errs.amount = 'El monto es obligatorio.';
        } else if (t.amount <= 0) {
            errs.amount = 'El monto debe ser mayor a 0.';
        } else if (t.amount > 10_000_000) {
            errs.amount = 'El monto no puede superar Q10,000,000.';
        }

        if (!t.transaction_date) {
            errs.transaction_date = 'La fecha es obligatoria.';
        } else {
            const txDate = new Date(t.transaction_date);
            txDate.setHours(0, 0, 0, 0);
            if (txDate > today()) {
                errs.transaction_date = 'La fecha no puede ser futura.';
            }
        }

        return errs;
    };

    const validateReportFilters = (f: ReportFilters): { dateEnd?: string } => {
        const errs: { dateEnd?: string } = {};
        if (f.dateStart && f.dateEnd && f.dateEnd < f.dateStart) {
            errs.dateEnd = 'La fecha fin no puede ser anterior a la fecha inicio.';
        }
        return errs;
    };

    // ── CRUD ─────────────────────────────────────────────────────────────────

    const openNew = () => {
        setTransaction(EMPTY_TRANSACTION);
        setErrors({});
        setTransactionDialog(true);
    };

    const openEdit = (rowData: Transaction) => {
        setTransaction({ ...rowData });
        setErrors({});
        setTransactionDialog(true);
    };

    const handleFieldChange = <K extends keyof Transaction>(field: K, value: Transaction[K]) => {
        setTransaction((prev) => ({ ...prev, [field]: value }));
        // Clear individual field error on change
        if (errors[field as keyof ValidationErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const saveTransaction = async () => {
        const validationErrors = validateTransaction(transaction);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'Corrija los campos marcados en rojo.', life: 4000 });
            return;
        }

        setSaving(true);
        try {
            let response: Transaction;
            if (transaction.transaction_id) {
                response = await TransactionService.update(String(transaction.transaction_id), transaction);
                toast.current?.show({ severity: 'success', summary: 'Actualizada', detail: 'Transacción actualizada correctamente.', life: 3000 });
            } else {
                response = await TransactionService.create({ ...transaction, created_by: 1 });
                toast.current?.show({ severity: 'success', summary: 'Creada', detail: 'Transacción registrada correctamente.', life: 3000 });
            }
            generatePDF(response);
            setTransactionDialog(false);
            loadTransactions();
        } catch (error: any) {
            const msg = error?.response?.data?.message ?? 'Error al guardar la transacción.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const confirmCancel = (rowData: Transaction) => {
        setTransaction(rowData);
        setCancelDialog(true);
    };

    const cancelTransaction = async () => {
        try {
            await TransactionService.cancel(String(transaction.transaction_id!), 'Cancelado por el usuario');
            toast.current?.show({ severity: 'info', summary: 'Anulada', detail: `Transacción #${transaction.transaction_id} anulada.`, life: 3000 });
            setCancelDialog(false);
            loadTransactions();
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo anular la transacción.', life: 3000 });
        }
    };

    // ── PDF Generation ────────────────────────────────────────────────────────

    const generatePDF = useCallback(
        (data: Transaction) => {
            const doc = new jsPDF();

            doc.setFillColor(...PRIMARY_COLOR);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text('COMPROBANTE DE TRANSACCIÓN', 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 32, { align: 'center' });

            doc.setTextColor(40, 40, 40);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Detalles de la Operación', 14, 52);

            autoTable(doc, {
                startY: 57,
                theme: 'striped',
                headStyles: { fillColor: PRIMARY_COLOR },
                body: [
                    ['ID de Transacción', `#${data.transaction_id ?? 'N/A'}`],
                    ['Cuenta Origen', getAccountName(data.account_id)],
                    ['Tipo de Operación', data.transaction_type],
                    ['Categoría', getCategoryName(data.category_id)],
                    ['No. Referencia', data.reference_number ?? 'S/N'],
                    ['Concepto', data.concept],
                    ['Fecha de Aplicación', new Date(data.transaction_date).toLocaleDateString('es-GT', { timeZone: 'UTC' })],
                    ['Estado', data.cancelled ? 'ANULADA' : 'COMPLETADA']
                ],
                styles: { fontSize: 11, cellPadding: 5 }
            });

            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setDrawColor(...PRIMARY_COLOR);
            doc.setLineWidth(1);
            doc.rect(14, finalY, 182, 22);
            doc.setTextColor(40, 40, 40);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('MONTO TOTAL:', 20, finalY + 14);
            doc.setTextColor(...PRIMARY_COLOR);
            doc.setFontSize(15);
            doc.text(`${getCurrencySymbol(data.currency_id)} ${Number(data.amount).toFixed(2)}`, 192, finalY + 14, { align: 'right' });

            doc.setTextColor(160, 160, 160);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Este documento es un comprobante digital de operación.', 105, 280, { align: 'center' });
            doc.text('Gracias por utilizar nuestros servicios bancarios electrónicos.', 105, 286, { align: 'center' });

            doc.save(`Transaccion_${data.transaction_id ?? 'Nueva'}.pdf`);
        },
        [getAccountName, getCategoryName, getCurrencySymbol]
    );

    // ── Report Export ─────────────────────────────────────────────────────────

    const exportReport = () => {
        const errs = validateReportFilters(reportFilters);
        if (Object.keys(errs).length > 0) {
            setReportErrors(errs);
            return;
        }

        const filteredData = transactions.filter((t) => {
            const tDate = new Date(t.transaction_date);
            if (reportFilters.dateStart) {
                const start = new Date(reportFilters.dateStart);
                start.setHours(0, 0, 0, 0);
                if (tDate < start) return false;
            }
            if (reportFilters.dateEnd) {
                const end = new Date(reportFilters.dateEnd);
                end.setHours(23, 59, 59, 999);
                if (tDate > end) return false;
            }
            if (reportFilters.account !== null && t.account_id !== reportFilters.account) return false;
            return true;
        });

        if (filteredData.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Sin datos', detail: 'No hay transacciones con esos filtros.', life: 3000 });
            return;
        }

        if (reportFilters.format === 'pdf') {
            exportReportPDF(filteredData);
        } else {
            exportExcelCSV(filteredData, reportFilters.format);
        }

        setReportDialog(false);
        setReportFilters(EMPTY_REPORT_FILTERS);
        setReportErrors({});
    };

    const exportReportPDF = (data: Transaction[]) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // ── Datos reales de la cuenta ──
        const selectedAccount = accounts.find((a) => a.account_id == reportFilters.account);
        const accountAlias = selectedAccount?.account_alias ?? 'Todas las cuentas';
        const accountNumber = selectedAccount?.account_number ?? '—';
        const bankName = selectedAccount?.Bank?.bank_name ?? '—';
        const accountType = selectedAccount?.AccountType?.type_name ?? '—';
        const saldoInicial = Number(selectedAccount?.initial_balance ?? 0);
        const saldoActual = Number(selectedAccount?.current_balance ?? 0);
        const currencySymbol = getCurrencySymbol(selectedAccount?.currency_id ?? data[0]?.currency_id);

        // ── Período ──
        const dateStartLabel = reportFilters.dateStart ? new Date(reportFilters.dateStart).toLocaleDateString('es-GT', { timeZone: 'UTC', year: 'numeric', month: 'long' }).toUpperCase() : '—';

        // ── Clasificación crédito/débito por movement_type ──
        const credits = data.filter((t) => {
            const cat = categories.find((c) => c.category_id == t.category_id);
            return !t.cancelled && cat?.movement_type?.toUpperCase() === 'INGRESO';
        });
        const debits = data.filter((t) => {
            const cat = categories.find((c) => c.category_id == t.category_id);
            return !t.cancelled && cat?.movement_type?.toUpperCase() !== 'INGRESO';
        });
        const totalCredits = credits.reduce((s, t) => s + Number(t.amount), 0);
        const totalDebits = debits.reduce((s, t) => s + Number(t.amount), 0);
        const saldoFinal = saldoInicial + totalCredits - totalDebits;
        const saldoPromedio = data.length > 0 ? data.reduce((s, t) => s + Number(t.amount), 0) / data.length : 0;

        // ══════════════════════════════════════════════
        // ENCABEZADO
        // ══════════════════════════════════════════════
        doc.setFillColor(...PRIMARY_COLOR);
        doc.rect(0, 0, pageWidth, 35, 'F');

        // Logo (triángulo rojo)
        doc.setFillColor(220, 50, 50);
        doc.triangle(pageWidth - 25, 5, pageWidth - 5, 5, pageWidth - 5, 25, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('ESTADO DE CUENTA', 10, 14);
        doc.setFontSize(13);
        doc.text(accountType.toUpperCase(), 10, 22);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(bankName, 10, 30);
        doc.text('Página 1', pageWidth - 30, 30);

        // ── Recuadro datos del titular ──
        let y = 42;
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.rect(10, y, 130, 22);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(accountAlias.toUpperCase(), 13, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Cuenta No.:   ${accountNumber}`, 13, y + 13);
        doc.text(`Moneda:        ${currencySymbol === 'Q' ? 'QUETZAL' : currencySymbol}`, 13, y + 19);

        // ── Período ──
        y = 70;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text(`- ${dateStartLabel} -`, pageWidth / 2, y, { align: 'center' });

        // ══════════════════════════════════════════════
        // RESUMEN DE MOVIMIENTOS
        // ══════════════════════════════════════════════
        y = 76;
        doc.setFillColor(220, 230, 241);
        doc.rect(10, y, pageWidth - 20, 7, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN DE MOVIMIENTOS', pageWidth / 2, y + 5, { align: 'center' });

        y = 87;
        doc.setFontSize(8.5);

        // Fila 1
        doc.setFont('helvetica', 'bold');
        doc.text('Saldo inicial:', 12, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${currencySymbol} ${saldoInicial.toFixed(2)}`, 50, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Saldo final:', 75, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${currencySymbol} ${saldoFinal.toFixed(2)}`, 110, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Mes:', 148, y);
        doc.setFont('helvetica', 'normal');
        doc.text(dateStartLabel, 158, y);

        // Fila 2
        y += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('No. de Créditos:', 12, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${credits.length}`, 50, y);

        doc.setFont('helvetica', 'bold');
        doc.text('No. débitos:', 75, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${debits.length}`, 110, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Saldo Promedio:', 148, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${currencySymbol} ${saldoPromedio.toFixed(2)}`, pageWidth - 12, y, { align: 'right' });

        // Fila 3
        y += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Valor Créditos:', 12, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${currencySymbol} ${totalCredits.toFixed(2)}`, 50, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Valor débitos:', 75, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${currencySymbol} ${totalDebits.toFixed(2)}`, 110, y);

        doc.setFont('helvetica', 'bold');
        doc.text('Saldo Actual:', 148, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${currencySymbol} ${saldoActual.toFixed(2)}`, pageWidth - 12, y, { align: 'right' });

        // Separador
        y += 5;
        doc.setDrawColor(180, 180, 180);
        doc.line(10, y, pageWidth - 10, y);

        // ══════════════════════════════════════════════
        // DETALLE
        // ══════════════════════════════════════════════
        y += 4;
        doc.setFillColor(220, 230, 241);
        doc.rect(10, y, pageWidth - 20, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('DETALLE', pageWidth / 2, y + 5, { align: 'center' });
        y += 9;

        // Saldo inicial como primera fila
        const primeraFila = ['', '', '', 'Saldo Anterior', '', '', `${currencySymbol} ${saldoInicial.toFixed(2)}`];

        let saldoAcumulado = saldoInicial;
        const tableRows = data.map((t) => {
            const cat = categories.find((c) => c.category_id == t.category_id);
            const isCredit = cat?.movement_type?.toUpperCase() === 'INGRESO';
            const amount = Number(t.amount);
            const fecha = new Date(t.transaction_date).toLocaleDateString('es-GT', { timeZone: 'UTC', day: '2-digit' });

            let debito = '';
            let credito = '';

            if (t.cancelled) {
                debito = '(Anulada)';
            } else if (isCredit) {
                saldoAcumulado += amount;
                credito = amount.toFixed(2);
            } else {
                saldoAcumulado -= amount;
                debito = amount.toFixed(2);
            }

            return [fecha, getAccountName(t.account_id), t.reference_number ?? '—', t.concept, debito, credito, t.cancelled ? '—' : `${currencySymbol} ${saldoAcumulado.toFixed(2)}`];
        });

        autoTable(doc, {
            startY: y,
            head: [['DÍA', 'AGENCIA', 'DOCTO.', 'DESCRIPCIÓN', 'DÉBITO', 'CRÉDITO', 'SALDO']],
            body: [primeraFila, ...tableRows],
            theme: 'plain',
            headStyles: {
                fillColor: PRIMARY_COLOR,
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                1: { cellWidth: 30 },
                2: { halign: 'center', cellWidth: 20 },
                3: { cellWidth: 58 },
                4: { halign: 'right', cellWidth: 22, textColor: [180, 30, 30] },
                5: { halign: 'right', cellWidth: 22, textColor: [30, 130, 60] },
                6: { halign: 'right', cellWidth: 26, fontStyle: 'bold' }
            },
            styles: { fontSize: 7.5, cellPadding: 2 },
            alternateRowStyles: { fillColor: [245, 248, 252] },
            didParseCell: (hookData) => {
                // "Saldo Anterior" en negrita
                if (hookData.section === 'body' && hookData.row.index === 0) {
                    hookData.cell.styles.fontStyle = 'bold';
                }
            }
        });

        // ── Pie de página ──
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7.5);
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'normal');
            doc.text('Este documento es un estado de cuenta oficial. Generado electrónicamente — no requiere firma.', pageWidth / 2, 290, { align: 'center' });
        }

        doc.save(`Estado_Cuenta_${accountAlias.replace(/\s+/g, '_')}.pdf`);
    };

    const exportExcelCSV = (data: Transaction[], format: string) => {
        const worksheetData = data.map((t) => ({
            ID: t.transaction_id,
            Cuenta: getAccountName(t.account_id),
            Tipo: t.transaction_type,
            Fecha: new Date(t.transaction_date).toLocaleDateString('es-GT', { timeZone: 'UTC' }),
            Monto: Number(t.amount).toFixed(2),
            Moneda: getCurrencySymbol(t.currency_id),
            Estado: t.cancelled ? 'Cancelada' : 'Activa'
        }));
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones');
        XLSX.writeFile(workbook, `Reporte_Transacciones.${format}`, format === 'csv' ? { bookType: 'csv' } : undefined);
    };

    // ── Templates ─────────────────────────────────────────────────────────────

    const leftToolbarTemplate = () => (
        <div className="flex flex-wrap gap-2">
            <Button label="Nueva Transacción" icon="pi pi-plus" severity="success" onClick={openNew} />
            <Button
                label="Generar Estado de Cuenta"
                icon="pi pi-file-export"
                severity="help"
                onClick={() => {
                    setReportFilters(EMPTY_REPORT_FILTERS);
                    setReportErrors({});
                    setReportDialog(true);
                }}
            />
        </div>
    );

    const actionBodyTemplate = (rowData: Transaction) => (
        <div className="flex gap-1">
            <Button icon="pi pi-file-pdf" rounded text severity="info" tooltip="Descargar comprobante" tooltipOptions={{ position: 'top' }} onClick={() => generatePDF(rowData)} />
            <Button icon="pi pi-pencil" rounded text severity="success" tooltip="Editar" tooltipOptions={{ position: 'top' }} onClick={() => openEdit(rowData)} disabled={!!rowData.cancelled} />
            {!rowData.cancelled && <Button icon="pi pi-ban" rounded text severity="danger" tooltip="Anular" tooltipOptions={{ position: 'top' }} onClick={() => confirmCancel(rowData)} />}
        </div>
    );

    const statusBodyTemplate = (rowData: Transaction) => <Tag value={rowData.cancelled ? 'Cancelada' : 'Activa'} severity={rowData.cancelled ? 'danger' : 'success'} />;

    const amountBodyTemplate = (rowData: Transaction) => (
        <span className="font-semibold">
            {getCurrencySymbol(rowData.currency_id)} {Number(rowData.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
        </span>
    );

    // ── Field Error Helper ────────────────────────────────────────────────────

    const fieldError = (key: keyof ValidationErrors) => (errors[key] ? <small className="p-error block mt-1">{errors[key]}</small> : null);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" left={leftToolbarTemplate} />

            {/* ── Main Table ── */}
            <DataTable
                value={transactions}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                loading={loading}
                emptyMessage="No se encontraron transacciones."
                rowClassName={(row: Transaction) => (row.cancelled ? 'opacity-60' : '')}
                sortMode="multiple"
                removableSort
            >
                <Column field="transaction_id" header="ID" sortable style={{ width: '5rem' }} />
                <Column header="Cuenta" sortable body={(row) => getAccountName(row.account_id)} />
                <Column field="transaction_type" header="Tipo" sortable />
                <Column field="reference_number" header="No. Referencia" />
                <Column header="Categoría" body={(row) => getCategoryName(row.category_id)} />
                <Column field="transaction_date" header="Fecha" sortable body={(row) => formatDateLocale(row.transaction_date)} />
                <Column field="concept" header="Concepto" />
                <Column header="Monto" sortable body={amountBodyTemplate} />
                <Column header="Estado" body={statusBodyTemplate} style={{ width: '9rem' }} />
                <Column body={actionBodyTemplate} header="Acciones" style={{ width: '11rem' }} />
            </DataTable>

            {/* ── Transaction Dialog ── */}
            <Dialog
                visible={transactionDialog}
                style={{ width: '520px' }}
                header={transaction.transaction_id ? `Editar Transacción #${transaction.transaction_id}` : 'Nueva Transacción'}
                modal
                draggable={false}
                onHide={() => {
                    setTransactionDialog(false);
                    setErrors({});
                }}
                footer={
                    <>
                        <Button
                            label="Cancelar"
                            icon="pi pi-times"
                            text
                            onClick={() => {
                                setTransactionDialog(false);
                                setErrors({});
                            }}
                            disabled={saving}
                        />
                        <Button label="Guardar" icon="pi pi-check" onClick={saveTransaction} loading={saving} />
                    </>
                }
            >
                <div className="grid">
                    {/* Cuenta Bancaria */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Cuenta Bancaria *</label>
                        <Dropdown
                            value={transaction.account_id}
                            options={accounts}
                            onChange={(e) => handleFieldChange('account_id', e.value)}
                            optionLabel="account_alias"
                            optionValue="account_id"
                            placeholder="Seleccione la cuenta origen"
                            className={`w-full ${errors.account_id ? 'p-invalid' : ''}`}
                        />
                        {fieldError('account_id')}
                    </div>

                    {/* Categoría */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Categoría *</label>
                        <Dropdown
                            value={transaction.category_id}
                            options={categories}
                            onChange={(e) => handleFieldChange('category_id', e.value)}
                            optionLabel="category_name"
                            optionValue="category_id"
                            placeholder="Seleccione la categoría"
                            className={`w-full ${errors.category_id ? 'p-invalid' : ''}`}
                        />
                        {fieldError('category_id')}
                    </div>

                    {/* Tipo de Transacción */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Tipo de Transacción *</label>
                        <Dropdown
                            value={transaction.transaction_type}
                            options={TRANSACTION_TYPES}
                            onChange={(e) => handleFieldChange('transaction_type', e.value)}
                            placeholder="Seleccione el tipo"
                            className={`w-full ${errors.transaction_type ? 'p-invalid' : ''}`}
                        />
                        {fieldError('transaction_type')}
                    </div>

                    {/* Moneda */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Tipo de Moneda *</label>
                        <Dropdown
                            value={transaction.currency_id}
                            options={currencies}
                            onChange={(e) => handleFieldChange('currency_id', e.value)}
                            optionLabel="name"
                            optionValue="id_currency"
                            placeholder="Seleccione la moneda"
                            className={`w-full ${errors.currency_id ? 'p-invalid' : ''}`}
                        />
                        {fieldError('currency_id')}
                    </div>

                    {/* Concepto */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Concepto *</label>
                        <InputText value={transaction.concept} onChange={(e) => handleFieldChange('concept', e.target.value)} className={`w-full ${errors.concept ? 'p-invalid' : ''}`} maxLength={200} placeholder="Descripción de la transacción" />
                        <small className="text-500">{transaction.concept.length}/200 caracteres</small>
                        {fieldError('concept')}
                    </div>

                    {/* Monto */}
                    <div className="field col-6">
                        <label className="font-bold block mb-2">Monto *</label>
                        <InputNumber
                            value={transaction.amount}
                            onValueChange={(e) => handleFieldChange('amount', e.value ?? 0)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            min={0.01} // No negativos, no cero
                            max={10_000_000}
                            className={`w-full ${errors.amount ? 'p-invalid' : ''}`}
                            placeholder="0.00"
                        />
                        {fieldError('amount')}
                    </div>

                    {/* Número de Referencia */}
                    <div className="field col-6">
                        <label className="font-bold block mb-2">No. Referencia *</label>
                        <InputNumber
                            value={transaction.reference_number ? Number(transaction.reference_number) : null}
                            onValueChange={(e) => handleFieldChange('reference_number', e.value !== null ? String(e.value) : null)}
                            mode="decimal"
                            useGrouping={false}
                            minFractionDigits={0}
                            maxFractionDigits={0}
                            min={0}
                            className={`w-full ${errors.reference_number ? 'p-invalid' : ''}`}
                            placeholder="Solo números"
                        />
                        {fieldError('reference_number')}
                    </div>

                    {/* Fecha */}
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Fecha *</label>
                        <Calendar
                            value={transaction.transaction_date ? new Date(transaction.transaction_date) : null}
                            onChange={(e) => handleFieldChange('transaction_date', e.value ?? new Date())}
                            dateFormat="yy-mm-dd"
                            className={`w-full ${errors.transaction_date ? 'p-invalid' : ''}`}
                            showIcon
                            maxDate={today()} // No fechas futuras
                            placeholder="Seleccione la fecha"
                        />
                        {fieldError('transaction_date')}
                    </div>
                </div>
            </Dialog>

            {/* ── Cancel Confirm Dialog ── */}
            <Dialog
                visible={cancelDialog}
                header="Confirmar Anulación"
                modal
                draggable={false}
                style={{ width: '380px' }}
                onHide={() => setCancelDialog(false)}
                footer={
                    <>
                        <Button label="No" icon="pi pi-times" text onClick={() => setCancelDialog(false)} />
                        <Button label="Sí, Anular" icon="pi pi-ban" severity="danger" onClick={cancelTransaction} />
                    </>
                }
            >
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-orange-400" />
                    <span>
                        ¿Seguro que desea anular la transacción <b>#{transaction.transaction_id}</b>? Esta acción no se puede deshacer.
                    </span>
                </div>
            </Dialog>

            {/* ── Report Dialog ── */}
            <Dialog
                visible={reportDialog}
                style={{ width: '460px' }}
                header="Configurar Reporte"
                modal
                draggable={false}
                onHide={() => {
                    setReportDialog(false);
                    setReportErrors({});
                }}
                footer={
                    <>
                        <Button
                            label="Cancelar"
                            icon="pi pi-times"
                            text
                            onClick={() => {
                                setReportDialog(false);
                                setReportErrors({});
                            }}
                        />
                        <Button label="Descargar" icon="pi pi-download" onClick={exportReport} />
                    </>
                }
            >
                <div className="grid">
                    <div className="field col-6">
                        <label className="font-bold block mb-2">Fecha Inicio</label>
                        <Calendar
                            value={reportFilters.dateStart}
                            onChange={(e) => {
                                setReportFilters({ ...reportFilters, dateStart: e.value ?? null });
                                setReportErrors({});
                            }}
                            dateFormat="yy-mm-dd"
                            showIcon
                            className="w-full"
                            maxDate={today()}
                            placeholder="Desde"
                        />
                    </div>
                    <div className="field col-6">
                        <label className="font-bold block mb-2">Fecha Fin</label>
                        <Calendar
                            value={reportFilters.dateEnd}
                            onChange={(e) => {
                                setReportFilters({ ...reportFilters, dateEnd: e.value ?? null });
                                setReportErrors({});
                            }}
                            dateFormat="yy-mm-dd"
                            showIcon
                            className={`w-full ${reportErrors.dateEnd ? 'p-invalid' : ''}`}
                            minDate={reportFilters.dateStart ?? undefined}
                            maxDate={today()}
                            placeholder="Hasta"
                        />
                        {reportErrors.dateEnd && <small className="p-error block mt-1">{reportErrors.dateEnd}</small>}
                    </div>

                    <div className="field col-12">
                        <label className="font-bold block mb-2">Cuenta Bancaria</label>
                        <Dropdown
                            value={reportFilters.account}
                            options={[...accounts]}
                            onChange={(e) => setReportFilters({ ...reportFilters, account: e.value })}
                            optionLabel="account_alias"
                            optionValue="account_id"
                            placeholder="Seleccione una cuenta"
                            className="w-full"
                        />
                    </div>

                    <div className="field col-12">
                        <label className="font-bold block mb-2">Formato de Archivo</label>
                        <Dropdown value={reportFilters.format} options={EXPORT_FORMATS} onChange={(e) => setReportFilters({ ...reportFilters, format: e.value })} className="w-full" />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Transactions;
