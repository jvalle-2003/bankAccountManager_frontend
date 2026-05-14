'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';

import { CategoryService } from '../../../../src/service/category.service';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface CategoryForm {
    category_id?: number;
    category_name: string;
    movement_type: string;
    active: boolean;
}

interface FormErrors {
    category_name?: string;
    movement_type?: string;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const emptyCategory: CategoryForm = {
    category_name: '',
    movement_type: '',
    active: true
};

/**
 * Opciones del dropdown.
 * value  → lo que se guarda internamente (INGRESO / EGRESO)
 * label  → lo que ve el usuario (Crédito / Débito)
 */
const movementOptions = [
    { label: 'Crédito', value: 'INGRESO' },
    { label: 'Débito', value: 'EGRESO' }
];

/**
 * Devuelve la etiqueta amigable para el usuario a partir del valor interno.
 * INGRESO → "Crédito" | EGRESO → "Débito"
 */
const getMovementLabel = (value: string): string => {
    const found = movementOptions.find((o) => o.value === value);
    return found ? found.label : value ?? '—';
};

// ─── Componente ──────────────────────────────────────────────────────────────

const Category = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [category, setCategory] = useState<CategoryForm>(emptyCategory);
    const [categoryDialog, setCategoryDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    // ── Carga ──────────────────────────────────────────────────────────────

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await CategoryService.getAll();
            setCategories(data);
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar las categorías',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    // ── Validación ─────────────────────────────────────────────────────────

    const validate = (): FormErrors => {
        const errors: FormErrors = {};

        if (!category.category_name.trim()) {
            errors.category_name = 'El nombre es obligatorio.';
        } else if (category.category_name.trim().length < 2) {
            errors.category_name = 'El nombre debe tener al menos 2 caracteres.';
        } else if (category.category_name.trim().length > 100) {
            errors.category_name = 'El nombre no puede superar los 100 caracteres.';
        }

        if (!category.movement_type) {
            errors.movement_type = 'Debe seleccionar un tipo de movimiento.';
        }

        return errors;
    };

    const hasErrors = (errors: FormErrors) => Object.keys(errors).length > 0;

    // ── Diálogo CRUD ───────────────────────────────────────────────────────

    const openNew = () => {
        setCategory(emptyCategory);
        setSubmitted(false);
        setCategoryDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setCategoryDialog(false);
    };

    const editCategory = (rowData: any) => {
        setCategory({ ...rowData });
        setSubmitted(false);
        setCategoryDialog(true);
    };

    const saveCategory = async () => {
        setSubmitted(true);
        const errors = validate();

        if (hasErrors(errors)) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Campos inválidos',
                detail: 'Corrija los errores antes de guardar.',
                life: 3000
            });
            return;
        }

        setSaving(true);
        try {
            const isEdit = categories.some((c) => c.category_id === category.category_id);

            const payload: CategoryForm = {
                ...category,
                category_name: category.category_name.trim()
            };

            if (isEdit) {
                await CategoryService.update(String(category.category_id!), payload);
            } else {
                await CategoryService.create(payload);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: isEdit ? 'Categoría actualizada correctamente.' : 'Categoría creada correctamente.',
                life: 3000
            });

            setCategoryDialog(false);
            setSubmitted(false);
            loadCategories();
        } catch (error: any) {
            const msg = error?.response?.data?.message ?? 'No se pudo guardar la categoría.';
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: msg,
                life: 4000
            });
        } finally {
            setSaving(false);
        }
    };

    // ── Eliminar ───────────────────────────────────────────────────────────

    const confirmDelete = (rowData: any) => {
        setCategory(rowData);
        setDeleteDialog(true);
    };

    const deleteCategory = async () => {
        try {
            await CategoryService.delete(String(category.category_id!));
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Estado de categoría actualizado.',
                life: 3000
            });
            setDeleteDialog(false);
            loadCategories();
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar la categoría.',
                life: 3000
            });
        }
    };

    // ── Plantillas de columnas ─────────────────────────────────────────────

    /**
     * Columna "Tipo Movimiento":
     * Muestra "Crédito" (verde) para INGRESO y "Débito" (rojo) para EGRESO.
     */
    const movementBodyTemplate = (rowData: any) => {
        const isIngreso = rowData.movement_type === 'INGRESO';
        return <Tag value={getMovementLabel(rowData.movement_type)} severity={isIngreso ? 'success' : 'danger'} icon={isIngreso ? 'pi pi-arrow-down-left' : 'pi pi-arrow-up-right'} />;
    };

    /** Columna "Estado": activo / inactivo. */
    const activeBodyTemplate = (rowData: any) => <Tag value={rowData.active ? 'Activo' : 'Inactivo'} severity={rowData.active ? 'info' : 'warning'} />;

    const actionBodyTemplate = (rowData: any) => (
        <>
            <Button icon="pi pi-pencil" rounded text severity="success" className="mr-2" tooltip="Editar" tooltipOptions={{ position: 'top' }} onClick={() => editCategory(rowData)} />
            <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar / Cambiar estado" tooltipOptions={{ position: 'top' }} onClick={() => confirmDelete(rowData)} />
        </>
    );

    const leftToolbarTemplate = () => <Button label="Nueva Categoría" icon="pi pi-plus" severity="success" onClick={openNew} />;

    // ── Errores del formulario (solo se muestran tras intentar guardar) ────

    const errors = submitted ? validate() : {};

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} />

                    <DataTable value={categories} paginator rows={10} rowsPerPageOptions={[5, 10, 25]} responsiveLayout="scroll" emptyMessage="No hay categorías registradas." loading={loading} sortMode="multiple">
                        <Column field="category_id" header="ID" sortable style={{ width: '5rem' }} />
                        <Column field="category_name" header="Nombre" sortable />
                        <Column field="movement_type" header="Tipo Movimiento" body={movementBodyTemplate} sortable />
                        <Column header="Estado" body={activeBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} header="Acciones" style={{ width: '15rem' }} />
                    </DataTable>

                    {/* ── Formulario ─────────────────────────────────────── */}
                    <Dialog
                        visible={categoryDialog}
                        style={{ width: '460px' }}
                        header={category.category_id ? 'Editar Categoría' : 'Nueva Categoría'}
                        modal
                        className="p-fluid"
                        onHide={hideDialog}
                        footer={
                            <>
                                <Button label="Cancelar" icon="pi pi-times" outlined onClick={hideDialog} disabled={saving} />
                                <Button label={saving ? 'Guardando…' : 'Guardar'} icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'} onClick={saveCategory} disabled={saving} />
                            </>
                        }
                    >
                        {/* Nombre */}
                        <div className="field mb-4">
                            <label htmlFor="category_name" className="block mb-2 font-semibold">
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="category_name"
                                value={category.category_name}
                                onChange={(e) => setCategory({ ...category, category_name: e.target.value })}
                                maxLength={100}
                                className={classNames('w-full', { 'p-invalid': errors.category_name })}
                                placeholder="Ej. Alimentación"
                                autoFocus
                            />
                            {errors.category_name && <small className="p-error block mt-1">{errors.category_name}</small>}
                            <small className="text-color-secondary">{category.category_name.length}/100 caracteres</small>
                        </div>

                        {/* Tipo de Movimiento */}
                        <div className="field">
                            <label htmlFor="movement_type" className="block mb-2 font-semibold">
                                Tipo de Movimiento <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="movement_type"
                                value={category.movement_type}
                                options={movementOptions}
                                onChange={(e) => setCategory({ ...category, movement_type: e.value })}
                                placeholder="Seleccione Crédito o Débito"
                                className={classNames('w-full', { 'p-invalid': errors.movement_type })}
                                showClear
                            />
                            {errors.movement_type && <small className="p-error block mt-1">{errors.movement_type}</small>}
                            {/* Vista previa del tipo seleccionado */}
                            {category.movement_type && (
                                <div className="mt-2 flex align-items-center gap-2">
                                    <span className="text-color-secondary text-sm">Vista previa:</span>
                                    <Tag
                                        value={getMovementLabel(category.movement_type)}
                                        severity={category.movement_type === 'INGRESO' ? 'success' : 'danger'}
                                        icon={category.movement_type === 'INGRESO' ? 'pi pi-arrow-down-left' : 'pi pi-arrow-up-right'}
                                    />
                                </div>
                            )}
                        </div>
                    </Dialog>

                    {/* ── Confirmar eliminación ──────────────────────────── */}
                    <Dialog
                        visible={deleteDialog}
                        style={{ width: '420px' }}
                        header={
                            <span>
                                <i className="pi pi-exclamation-triangle text-yellow-500 mr-2" />
                                Confirmar Acción
                            </span>
                        }
                        modal
                        onHide={() => setDeleteDialog(false)}
                        footer={
                            <>
                                <Button label="Cancelar" icon="pi pi-times" outlined onClick={() => setDeleteDialog(false)} />
                                <Button label="Confirmar" icon="pi pi-check" severity="danger" onClick={deleteCategory} />
                            </>
                        }
                    >
                        <div className="flex align-items-center gap-3">
                            <i className="pi pi-info-circle text-3xl text-yellow-500" />
                            <span>
                                ¿Desea cambiar el estado o eliminar la categoría <b>{category.category_name}</b>?
                            </span>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default Category;
