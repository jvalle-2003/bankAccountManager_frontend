import React, { ReactNode } from 'react';
import {
    Page,
    AppBreadcrumbProps,
    Breadcrumb,
    BreadcrumbItem,
    MenuProps,
    MenuModel,
    AppSubMenuProps,
    LayoutConfig,
    LayoutState,
    AppBreadcrumbState,
    Breadcrumb,
    LayoutContextProps,
    MailContextProps,
    MenuContextProps,
    ChatContextProps,
    TaskContextProps,
    AppConfigProps,
    NodeRef,
    AppTopbarRef,
    MenuModelItem,
    AppMenuItemProps,
    AppMenuItem
} from './layout';
import { Demo, LayoutType, SortOrderType, CustomEvent, ChartDataState, ChartOptionsState, AppMailSidebarItem, AppMailReplyProps, AppMailProps } from './demo';

type ChildContainerProps = {
    children: ReactNode;
};

// ============= TIPOS AGREGADOS =============
/**
 * INTERFACE PERMISSION
 * Representa un permiso en el sistema
 * @property {number} id_permission - Identificador único del permiso
 * @property {string} permission_name - Nombre del permiso (único)
 * @property {string} [description] - Descripción opcional del permiso
 * @property {string} [module] - Módulo al que pertenece el permiso
 */

// ============= TIPOS AGREGADOS =============
export interface Period {
    period_id: number;
    year: number;
    month: number;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    closed_by?: number | null;
    closed_at?: string | null;
}
// ============================================
export interface Permission {
    id_permission: number;
    permission_name: string;
    description?: string;
    module?: string;
}
// ============================================

export type {
    // ... todos los que ya tenías ...
    Permission,
    Period  // 👈 AGREGAR ESTE
};

export type {
    Page,
    AppBreadcrumbProps,
    Breadcrumb,
    BreadcrumbItem,
    MenuProps,
    MenuModel,
    LayoutConfig,
    LayoutState,
    Breadcrumb,
    LayoutContextProps,
    MailContextProps,
    MenuContextProps,
    ChatContextProps,
    TaskContextProps,
    AppConfigProps,
    NodeRef,
    AppTopbarRef,
    AppMenuItemProps,
    ChildContainerProps,
    Demo,
    LayoutType,
    SortOrderType,
    CustomEvent,
    ChartDataState,
    ChartOptionsState,
    AppMailSidebarItem,
    AppMailReplyProps,
    AppMailProps,
    AppMenuItem,
    Permission  // 👈 AGREGADO: Exportamos el tipo Permission
};

// ============= TIPOS AGREGADOS =============
export interface Reconciliation {
    reconciliation_id: number;
    account_id: number;
    month: number;
    year: number;
    start_date: string;
    end_date: string;
    reconciliation_date?: string;
    bank_initial_balance?: number | null;
    bank_final_balance?: number | null;
    book_initial_balance?: number | null;
    book_final_balance?: number | null;
    status: 'IN_PROCESS' | 'RECONCILED' | 'DIFFERENCES';
    reconciled_by?: number | null;
    observations?: string | null;
}
// ============================================
export type {
    // ... todos los que ya tenías ...
    Permission,
    Period,
    Reconciliation  // 👈 AGREGAR ESTE
};

// ============= TIPOS AGREGADOS =============
export interface RolePermission {
    role_id: number;
    permission_id: number;
    assignment_date?: string;
}
// ============================================

export type {
    // ... todos los que ya tenías ...
    Permission,
    Period,
    Reconciliation,
    RolePermission  // 👈 AGREGAR ESTE
};


// ============= TIPOS AGREGADOS =============
export interface BalanceHistory {
    history_id: number;
    account_id: number;
    balance_date: string;
    closing_balance: number;
}
// ============================================

export type {
    // ... todos los que ya tenías ...
    Permission,
    Period,
    Reconciliation,
    RolePermission,
    BalanceHistory  // 👈 AGREGAR ESTE
};

// ============= TIPOS AGREGADOS =============
export interface Role {
    role_id: number;
    role_name: string;
    description?: string | null;
    active: boolean;
}
// ============================================
export type {
    // ... todos los que ya tenías ...
    Permission,
    Period,
    Reconciliation,
    RolePermission,
    BalanceHistory,
    Role  // 👈 AGREGAR ESTE
};

// ============= TIPOS AGREGADOS =============
export interface User {
    user_id: number;
    first_name: string;
    second_name: string;
    third_name?: string | null;
    first_surname: string;
    second_surname: string;
    email: string;
    username: string;
    password: string;
    role_id: number;
}
// ============================================
export type {
    // ... todos los que ya tenías ...
    Permission,
    Period,
    Reconciliation,
    RolePermission,
    BalanceHistory,
    Role,
    User  // 👈 AGREGAR ESTE
};

// ============= TIPOS AGREGADOS =============
export interface Audit {
    audit_id: number;
    description: string;
    last_login?: string | null;
    last_activity?: string;
    last_ip?: string | null;
    user_id: number;
}
// ============================================

export type {
    // ... todos los que ya tenías ...
    Permission,
    Period,
    Reconciliation,
    RolePermission,
    BalanceHistory,
    Role,
    User,
    Audit  // 👈 AGREGAR ESTE
};
