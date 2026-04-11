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

// Asumiendo que ya tienes este servicio creado con Axios
import { CategoryService } from '../../../../src/service/category.service';

const Category = () => {
    const emptyCategory = {
        category_name: "",
        movement_type: "",
        active: true
    };

    const [categories, setCategories] = useState<any[]>([]);
    const [category, setCategory] = useState<any>(emptyCategory);
    const [categoryDialog, setCategoryDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);

    const toast = useRef<Toast>(null);

// Cambia tus opciones a esto:
const movementOptions = [
    { label: 'Ingreso', value: 'INGRESO' },
    { label: 'Egreso', value: 'EGRESO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' }
];

// Y en el JSX del Dropdown:
<Dropdown 
    id="movement_type"
    value={category.movement_type} 
    options={movementOptions} 
    onChange={(e) => setCategory({ ...category, movement_type: e.value })} 
    placeholder="Seleccione el tipo" // Limpia el placeholder
    className="w-full"
/>

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await CategoryService.getAll();
            setCategories(data);
        } catch (error) {
            console.error("Error al cargar categorías", error);
        }
    };

    const openNew = () => {
        setCategory(emptyCategory);
        setCategoryDialog(true);
    };

    const hideDialog = () => {
        setCategoryDialog(false);
    };

    const editCategory = (rowData: any) => {
        setCategory({ ...rowData });
        setCategoryDialog(true);
    };

    const saveCategory = async () => {
        // Validación básica
        if ( !category.category_name) {
            toast.current?.show({
                severity: "warn",
                summary: "Campos requeridos",
                detail: "Complete el Nombre",
                life: 3000
            });
            return;
        }

        try {
            const exists = categories.find(c => c.category_id === category.category_id);

            if (exists) {
                await CategoryService.update(category.category_id, category);
            } else {
                await CategoryService.create(category);
            }

            toast.current?.show({
                severity: "success",
                summary: "Éxito",
                detail: exists ? "Categoría actualizada" : "Categoría creada",
                life: 3000
            });

            setCategoryDialog(false);
            loadCategories();
        } catch (error) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "No se pudo guardar la categoría",
                life: 3000
            });
        }
    };

    const confirmDelete = (rowData: any) => {
        setCategory(rowData);
        setDeleteDialog(true);
    };

    const deleteCategory = async () => {
        try {
            await CategoryService.delete(category.category_id);
            toast.current?.show({
                severity: "success",
                summary: "Éxito",
                detail: "Estado de categoría actualizado",
                life: 3000
            });
            setDeleteDialog(false);
            loadCategories();
        } catch (error) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Error al eliminar",
                life: 3000
            });
        }
    };

    // --- Plantillas UI ---

    const actionBodyTemplate = (rowData: any) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => editCategory(rowData)} />
            <Button icon="pi pi-trash" rounded severity="danger" onClick={() => confirmDelete(rowData)} />
        </>
    );

    const leftToolbarTemplate = () => (
        <Button label="Nueva Categoría" icon="pi pi-plus" severity="success" onClick={openNew} />
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} />

                    <DataTable
                        value={categories}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        emptyMessage="No hay categorías registradas"
                    >
                        <Column field="category_id" header="ID" sortable />
                        <Column field="category_name" header="Nombre" sortable />
                        <Column field="movement_type" header="Tipo Movimiento" />
                        <Column
                            header="Estado"
                            body={(row) => row.active ? "✅ Activo" : "❌ Inactivo"}
                        />
                        <Column body={actionBodyTemplate} header="Acciones" />
                    </DataTable>

                    {/* FORMULARIO DIALOG */}
                    <Dialog
                        visible={categoryDialog}
                        style={{ width: '450px' }}
                        header="Detalles de Categoría"
                        modal
                        onHide={hideDialog}
                        footer={
                            <>
                                <Button label="Cancelar" icon="pi pi-times" text onClick={hideDialog} />
                                <Button label="Guardar" icon="pi pi-check" text onClick={saveCategory} />
                            </>
                        }
                    >


                        <div className="field mb-3">
                            <label htmlFor="name" className="block mb-2">Nombre</label>
                            <InputText
                                id="name"
                                value={category.category_name}
                                onChange={(e) => setCategory({ ...category, category_name: e.target.value })}
                                className="w-full"
                            />
                        </div>

                        <div className="field">
    <label htmlFor="movement_type" className="block mb-2">Tipo de Movimiento</label>
    <Dropdown 
        id="movement_type"
        value={category.movement_type} 
        options={movementOptions} 
        onChange={(e) => setCategory({ ...category, movement_type: e.value })} 
        placeholder="Seleccione INCOME o EXPENSE"
        className="w-full"
    />
</div>
                    </Dialog>

                    {/* CONFIRMACIÓN ELIMINAR */}
                    <Dialog
                        visible={deleteDialog}
                        style={{ width: '400px' }}
                        header="Confirmar Acción"
                        modal
                        onHide={() => setDeleteDialog(false)}
                        footer={
                            <>
                                <Button label="No" icon="pi pi-times" text onClick={() => setDeleteDialog(false)} />
                                <Button label="Sí" icon="pi pi-check" text onClick={deleteCategory} />
                            </>
                        }
                    >
                        <p>¿Desea cambiar el estado/eliminar la categoría: <b>{category.category_name}</b>?</p>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default Category;