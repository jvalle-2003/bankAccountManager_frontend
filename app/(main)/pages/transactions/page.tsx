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

import { BalanceHistory } from '@/types';
import { TransactionService } from '../../../../src/service/transaction.service';
import { BankAccountService } from '../../../../src/service/BankAccountService';
import { CategoryService } from '../../../../src/service/category.service';
import { CurrencyService } from '../../../../src/service/currency.service';
import { balanceHistoryService } from '../../../../src/service/balanceHistory.service';

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

interface MonthYearFilter {
    month: number;
    year: number;
}

interface MonthlyClosingData {
    history_id: number;
    account_id: number;
    balance_date: string;
    closing_balance: number;
    year: number;
    month: number;
    previous_balance: number;
    monthly_credits: number;
    monthly_debits: number;
    transaction_count: number;
    closed_at: string;
    closed_by: number | null;
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

const TRANSACTION_TYPES = [
    { label: 'Operaciones con Tarjetas', value: 'Operaciones con Tarjetas' },
    { label: 'Depósitos y Pagos', value: 'Depósitos y Pagos' },
    { label: 'Operaciones Especiales', value: 'Operaciones Especiales' },
    { label: 'Transferencias de Fondos', value: 'Transferencias de Fondos' }
];

const PRIMARY_COLOR: [number, number, number] = [41, 128, 185];
const MONTHS = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 }
];

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

const getMonthName = (month: number): string => {
    return MONTHS.find((m) => m.value === month)?.label || '';
};

// ─── Component ───────────────────────────────────────────────────────────────

const Transactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [monthlyClosings, setMonthlyClosings] = useState<MonthlyClosingData[]>([]);

    const [transaction, setTransaction] = useState<Transaction>(EMPTY_TRANSACTION);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const [transactionDialog, setTransactionDialog] = useState(false);
    const [cancelDialog, setCancelDialog] = useState(false);
    const [reportDialog, setReportDialog] = useState(false);
    const [closingDialog, setClosingDialog] = useState(false);
    const [historyDialog, setHistoryDialog] = useState(false);

    const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
    const [closingMonth, setClosingMonth] = useState<MonthYearFilter>({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const [statementMonth, setStatementMonth] = useState<MonthYearFilter>({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [closingLoading, setClosingLoading] = useState(false);

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

    const getCurrencySymbol = useCallback((id: any): string => currencies.find((c) => c.id_currency == id)?.symbol ?? 'Q', [currencies]);

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

    const loadMonthlyClosings = useCallback(async (accountId?: number) => {
        if (!accountId) return;
        try {
            const history = await balanceHistoryService.getClosingHistory(accountId, 12);
            const mappedData: MonthlyClosingData[] = history.map((item: BalanceHistory) => ({
                history_id: item.history_id,
                account_id: item.account_id,
                balance_date: item.balance_date,
                closing_balance: item.closing_balance,
                year: item.year || 0,
                month: item.month || 0,
                previous_balance: item.previous_balance || 0,
                monthly_credits: item.monthly_credits || 0,
                monthly_debits: item.monthly_debits || 0,
                transaction_count: item.transaction_count || 0,
                closed_at: item.closed_at || '',
                closed_by: item.closed_by || null
            }));
            setMonthlyClosings(mappedData);
        } catch (error) {
            console.error('Error cargando cierres:', error);
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

    // ── CIERRE DE MES ─────────────────────────────────────────────────────────

    const executeMonthlyClosing = async () => {
        if (!selectedAccount) return;

        setClosingLoading(true);
        try {
            const result = await balanceHistoryService.calculateMonthlyClosing({
                account_id: selectedAccount,
                year: closingMonth.year,
                month: closingMonth.month,
                closed_by: 1
            });

            if (result.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Cierre completado',
                    detail: result.message,
                    life: 3000
                });
                setClosingDialog(false);
                await loadMonthlyClosings(selectedAccount);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || error.message,
                life: 3000
            });
        } finally {
            setClosingLoading(false);
        }
    };

    // ── REPORTE CON CIERRE DE MES ─────────────────────────────────────────────

    const generateMonthlyStatement = async () => {
        if (!selectedAccount) return;

        setLoading(true);
        try {
            const statement = await balanceHistoryService.getMonthlyStatement(selectedAccount, statementMonth.year, statementMonth.month);

            if (!statement) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Sin datos',
                    detail: `No existe cierre para ${getMonthName(statementMonth.month)} ${statementMonth.year}. Ejecute el cierre primero.`,
                    life: 5000
                });
                return;
            }

            // ✅ Usar las transacciones que vienen del statement, NO las del estado global
            const monthTransactions = statement.transactions || [];

            console.log('=== TRANSACCIONES DEL STATEMENT ===');
            console.log('Cantidad:', monthTransactions.length);
            console.log('Detalle:', monthTransactions);

            generateStatementPDF(statement, monthTransactions);
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || error.message,
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    // ── GENERAR PDF DEL ESTADO DE CUENTA ──────────────────────────────────────

    const generateStatementPDF = (statement: any, monthTransactions: Transaction[]) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        const selectedAccountData = accounts.find((a) => a.account_id === statement.account_id);
        const accountAlias = selectedAccountData?.account_alias ?? 'Sin cuenta';
        const accountNumber = selectedAccountData?.account_number ?? '—';
        const bankName = selectedAccountData?.Bank?.bank_name ?? '—';
        const accountType = selectedAccountData?.AccountType?.type_name ?? '—';
        const currencySymbol = getCurrencySymbol(selectedAccountData?.currency_id);

        const monthName = getMonthName(statement.period.month);
        const startDate = new Date(statement.period.start_date).toLocaleDateString('es-GT');
        const endDate = new Date(statement.period.end_date).toLocaleDateString('es-GT');

        // Usar los valores del statement en lugar de recalcular
        const openingBalance = statement.opening_balance || 0;
        const totalCredits = statement.summary?.total_credits || 0;
        const totalDebits = statement.summary?.total_debits || 0;
        const closingBalance = statement.closing_balance || 0;

        // ══════════════════════════════════════════════
        // ENCABEZADO
        // ══════════════════════════════════════════════
        doc.setFillColor(...PRIMARY_COLOR);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('ESTADO DE CUENTA MENSUAL', 105, 18, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`${monthName} ${statement.period.year}`, 105, 30, { align: 'center' });
        doc.setFontSize(8);
        doc.text(bankName, 105, 38, { align: 'center' });

        // ── Información de la cuenta ──
        let y = 50;
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.rect(10, y, 190, 25);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(accountAlias.toUpperCase(), 15, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Cuenta No.: ${accountNumber}`, 15, y + 14);
        doc.text(`Tipo: ${accountType}`, 15, y + 21);
        doc.text(`Moneda: ${currencySymbol === 'Q' ? 'QUETZAL GUATEMALTECO' : currencySymbol}`, pageWidth - 15, y + 21, { align: 'right' });

        // ── Período ──
        y += 35;
        doc.setFillColor(220, 230, 241);
        doc.rect(10, y, 190, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`PERÍODO: ${startDate} al ${endDate}`, 15, y + 7);

        // ══════════════════════════════════════════════
        // RESUMEN DEL MES
        // ══════════════════════════════════════════════
        y += 18;
        doc.setFillColor(220, 230, 241);
        doc.rect(10, y, 190, 7, 'F');
        doc.setFontSize(10);
        doc.text('RESUMEN DEL PERÍODO', pageWidth / 2, y + 5, { align: 'center' });

        y += 12;
        doc.setFontSize(9);

        const summaryData = [
            ['Saldo anterior (cierre mes anterior):', `${currencySymbol} ${openingBalance.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`],
            ['Total Ingresos del mes:', `${currencySymbol} ${totalCredits.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`],
            ['Total Egresos del mes:', `${currencySymbol} ${totalDebits.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`],
            ['Número de transacciones:', monthTransactions.length.toString()],
            ['', ''],
            ['SALDO AL CIERRE:', `${currencySymbol} ${closingBalance.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`]
        ];

        autoTable(doc, {
            startY: y,
            body: summaryData,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 80 },
                1: { halign: 'right', cellWidth: 100 }
            },
            didParseCell: (hookData) => {
                if (hookData.row.index === 5) {
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.fontSize = 11;
                    hookData.cell.styles.textColor = [41, 128, 185];
                }
            }
        });

        // ══════════════════════════════════════════════
        // DETALLE DE MOVIMIENTOS
        // ══════════════════════════════════════════════
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFillColor(220, 230, 241);
        doc.rect(10, finalY, 190, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('DETALLE DE MOVIMIENTOS', pageWidth / 2, finalY + 5, { align: 'center' });

        // Calcular saldo corrido
        let saldoCorrido = openingBalance;
        const tableRows = monthTransactions.map((t) => {
            const cat = categories.find((c) => c.category_id === t.category_id);
            const isCredit = cat?.movement_type?.toUpperCase() === 'INGRESO';
            const amount = Number(t.amount);

            const fecha = new Date(t.transaction_date);
            const fechaStr = `${fecha.getDate()}/${fecha.getMonth() + 1}`;

            const montoStr = amount.toLocaleString('es-GT', { minimumFractionDigits: 2 });

            let debito = '';
            let credito = '';

            if (isCredit) {
                saldoCorrido += amount;
                credito = montoStr;
            } else {
                saldoCorrido -= amount;
                debito = montoStr;
            }

            const saldoStr = saldoCorrido.toLocaleString('es-GT', { minimumFractionDigits: 2 });

            return [fechaStr, t.reference_number ?? '—', t.concept?.substring(0, 45) ?? '—', debito, credito, `${currencySymbol} ${saldoStr}`];
        });

        if (tableRows.length === 0) {
            tableRows.push(['', '', 'No hay movimientos en este período', '', '', '']);
        }

        autoTable(doc, {
            startY: finalY + 10,
            head: [['FECHA', 'DOCUMENTO', 'DESCRIPCIÓN', 'DÉBITO', 'CRÉDITO', 'SALDO']],
            body: tableRows,
            theme: 'striped',
            headStyles: {
                fillColor: PRIMARY_COLOR,
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 18, halign: 'center' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 65, halign: 'left' },
                3: { halign: 'right', cellWidth: 28, textColor: [180, 30, 30] },
                4: { halign: 'right', cellWidth: 28, textColor: [30, 130, 60] },
                5: { halign: 'right', cellWidth: 32, fontStyle: 'bold' }
            },
            styles: { fontSize: 7.5, cellPadding: 2 },
            alternateRowStyles: { fillColor: [245, 248, 252] }
        });

        // ── Pie de página ──
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text('Estado de cuenta mensual - Documento oficial generado electrónicamente', pageWidth / 2, 290, { align: 'center' });
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, 290, { align: 'right' });
        }

        doc.save(`Estado_Cuenta_${monthName}_${statement.period.year}_${accountAlias.replace(/\s+/g, '_')}.pdf`);
        setReportDialog(false);
    };

    // ── PDF Generation (Comprobante individual) ─────────────────────────────────

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

    // ── Templates ─────────────────────────────────────────────────────────────

    const leftToolbarTemplate = () => (
        <div className="flex flex-wrap gap-2">
            <Button label="Nueva Transacción" icon="pi pi-plus" severity="success" onClick={openNew} />
            <Button
                label="Cierre de Mes"
                icon="pi pi-calendar"
                severity="warning"
                onClick={() => {
                    setSelectedAccount(null);
                    setClosingDialog(true);
                }}
            />
            <Button
                label="Estado de Cuenta"
                icon="pi pi-file-pdf"
                severity="info"
                onClick={() => {
                    setSelectedAccount(null);
                    setReportDialog(true);
                }}
            />
            <Button
                label="Historial de Cierres"
                icon="pi pi-history"
                severity="secondary"
                onClick={() => {
                    if (!selectedAccount) {
                        toast.current?.show({ severity: 'warn', summary: 'Seleccione cuenta', detail: 'Primero seleccione una cuenta en el reporte', life: 3000 });
                        return;
                    }
                    loadMonthlyClosings(selectedAccount);
                    setHistoryDialog(true);
                }}
            />
        </div>
    );

    const actionBodyTemplate = (rowData: Transaction) => (
        <div className="flex gap-1">
            <Button icon="pi pi-file-pdf" rounded text severity="info" tooltip="Descargar comprobante" onClick={() => generatePDF(rowData)} />
            <Button icon="pi pi-pencil" rounded text severity="success" tooltip="Editar" onClick={() => openEdit(rowData)} disabled={!!rowData.cancelled} />
            {!rowData.cancelled && <Button icon="pi pi-ban" rounded text severity="danger" tooltip="Anular" onClick={() => confirmCancel(rowData)} />}
        </div>
    );

    const statusBodyTemplate = (rowData: Transaction) => <Tag value={rowData.cancelled ? 'Cancelada' : 'Activa'} severity={rowData.cancelled ? 'danger' : 'success'} />;

    const amountBodyTemplate = (rowData: Transaction) => (
        <span className="font-semibold">
            {getCurrencySymbol(rowData.currency_id)} {Number(rowData.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
        </span>
    );

    const fieldError = (key: keyof ValidationErrors) => (errors[key] ? <small className="p-error block mt-1">{errors[key]}</small> : null);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" left={leftToolbarTemplate} />

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

                    <div className="field col-12">
                        <label className="font-bold block mb-2">Concepto *</label>
                        <InputText value={transaction.concept} onChange={(e) => handleFieldChange('concept', e.target.value)} className={`w-full ${errors.concept ? 'p-invalid' : ''}`} maxLength={200} placeholder="Descripción de la transacción" />
                        <small className="text-500">{transaction.concept.length}/200 caracteres</small>
                        {fieldError('concept')}
                    </div>

                    <div className="field col-6">
                        <label className="font-bold block mb-2">Monto *</label>
                        <InputNumber
                            value={transaction.amount}
                            onValueChange={(e) => handleFieldChange('amount', e.value ?? 0)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            min={0.01}
                            max={10_000_000}
                            className={`w-full ${errors.amount ? 'p-invalid' : ''}`}
                            placeholder="0.00"
                        />
                        {fieldError('amount')}
                    </div>

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

                    <div className="field col-12">
                        <label className="font-bold block mb-2">Fecha *</label>
                        <Calendar
                            value={transaction.transaction_date ? new Date(transaction.transaction_date) : null}
                            onChange={(e) => handleFieldChange('transaction_date', e.value ?? new Date())}
                            dateFormat="yy-mm-dd"
                            className={`w-full ${errors.transaction_date ? 'p-invalid' : ''}`}
                            showIcon
                            maxDate={today()}
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

            {/* ── Report Dialog (Estado de Cuenta Mensual) ── */}
            <Dialog
                visible={reportDialog}
                style={{ width: '460px' }}
                header="Estado de Cuenta Mensual"
                modal
                draggable={false}
                onHide={() => setReportDialog(false)}
                footer={
                    <>
                        <Button label="Cancelar" icon="pi pi-times" text onClick={() => setReportDialog(false)} />
                        <Button label="Generar" icon="pi pi-download" onClick={generateMonthlyStatement} loading={loading} />
                    </>
                }
            >
                <div className="grid">
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Cuenta Bancaria *</label>
                        <Dropdown value={selectedAccount} options={accounts} onChange={(e) => setSelectedAccount(e.value)} optionLabel="account_alias" optionValue="account_id" placeholder="Seleccione una cuenta" className="w-full" />
                    </div>

                    <div className="field col-6">
                        <label className="font-bold block mb-2">Mes *</label>
                        <Dropdown value={statementMonth.month} options={MONTHS} onChange={(e) => setStatementMonth({ ...statementMonth, month: e.value })} className="w-full" />
                    </div>

                    <div className="field col-6">
                        <label className="font-bold block mb-2">Año *</label>
                        <InputNumber
                            value={statementMonth.year}
                            onValueChange={(e) => setStatementMonth({ ...statementMonth, year: e.value || new Date().getFullYear() })}
                            min={2020}
                            max={new Date().getFullYear()}
                            useGrouping={false}
                            className="w-full"
                        />
                    </div>
                </div>
            </Dialog>

            {/* ── Closing Dialog ── */}
            <Dialog
                visible={closingDialog}
                header="Cierre de Mes"
                modal
                style={{ width: '460px' }}
                onHide={() => setClosingDialog(false)}
                footer={
                    <>
                        <Button label="Cancelar" icon="pi pi-times" text onClick={() => setClosingDialog(false)} />
                        <Button label="Ejecutar Cierre" icon="pi pi-check" onClick={executeMonthlyClosing} loading={closingLoading} />
                    </>
                }
            >
                <div className="grid">
                    <div className="field col-12">
                        <label className="font-bold block mb-2">Cuenta Bancaria *</label>
                        <Dropdown value={selectedAccount} options={accounts} onChange={(e) => setSelectedAccount(e.value)} optionLabel="account_alias" optionValue="account_id" placeholder="Seleccione una cuenta" className="w-full" />
                    </div>

                    <div className="field col-6">
                        <label className="font-bold block mb-2">Mes a Cerrar *</label>
                        <Dropdown value={closingMonth.month} options={MONTHS} onChange={(e) => setClosingMonth({ ...closingMonth, month: e.value })} className="w-full" />
                    </div>

                    <div className="field col-6">
                        <label className="font-bold block mb-2">Año *</label>
                        <InputNumber value={closingMonth.year} onValueChange={(e) => setClosingMonth({ ...closingMonth, year: e.value || new Date().getFullYear() })} min={2020} max={new Date().getFullYear()} useGrouping={false} className="w-full" />
                    </div>

                    <div className="col-12">
                        <small className="text-500">⚠️ El cierre calculará el saldo al último día del mes seleccionado y lo guardará en el historial. No se podrá volver a calcular el mismo mes.</small>
                    </div>
                </div>
            </Dialog>

            {/* ── Historial de Cierres Dialog ── */}
            <Dialog
                visible={historyDialog}
                header={`Historial de Cierres - ${getAccountName(selectedAccount)}`}
                style={{ width: '800px' }}
                modal
                onHide={() => setHistoryDialog(false)}
                footer={<Button label="Cerrar" icon="pi pi-times" text onClick={() => setHistoryDialog(false)} />}
            >
                <DataTable value={monthlyClosings} rows={10} paginator>
                    <Column field="year" header="Año" sortable style={{ width: '15%' }} />
                    <Column field="month" header="Mes" sortable style={{ width: '15%' }} body={(row) => getMonthName(row.month)} />
                    <Column field="balance_date" header="Fecha Corte" sortable style={{ width: '20%' }} />
                    <Column field="previous_balance" header="Saldo Anterior" sortable style={{ width: '20%' }} body={(row) => `Q ${row.previous_balance?.toLocaleString()}`} />
                    <Column field="closing_balance" header="Saldo Cierre" sortable style={{ width: '20%' }} body={(row) => `Q ${row.closing_balance?.toLocaleString()}`} />
                    <Column field="transaction_count" header="# Transacciones" sortable style={{ width: '10%' }} />
                </DataTable>
            </Dialog>
        </div>
    );
};

export default Transactions;
