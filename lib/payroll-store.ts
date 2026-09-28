"use client";

import { useCallback, useEffect, useState } from "react";
import type { Employee, PayrollRecord } from "./types";

export type EmployeeInput = {
    fullName: string;
    position?: string;
    baseSalary: number;
};

async function fetchEmployees(): Promise<Employee[]> {
    try {
        const response = await fetch("/api/employees", { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.employees) ? (data.employees as Employee[]) : [];
    } catch {
        return [];
    }
}

export type EmployeeStore = {
    employees: Employee[];
    addEmployee: (input: EmployeeInput) => Promise<Employee | null>;
    updateEmployee: (employeeId: string, input: Partial<EmployeeInput> & { isActive?: boolean }) => Promise<Employee | null>;
    deleteEmployee: (employeeId: string) => Promise<void>;
};

export function useEmployees(): EmployeeStore {
    const [employees, setEmployees] = useState<Employee[]>([]);

    const refresh = useCallback(async () => {
        setEmployees(await fetchEmployees());
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const addEmployee = useCallback(
        async (input: EmployeeInput) => {
            const fullName = input.fullName.trim();
            if (!fullName) return null;

            try {
                const response = await fetch("/api/employees", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...input, fullName }),
                });
                if (!response.ok) return null;

                const data = await response.json();
                await refresh();
                return (data.employee as Employee) ?? null;
            } catch {
                return null;
            }
        },
        [refresh]
    );

    const updateEmployee = useCallback(
        async (employeeId: string, input: Partial<EmployeeInput> & { isActive?: boolean }) => {
            try {
                const response = await fetch(`/api/employees/${employeeId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(input),
                });
                if (!response.ok) return null;

                const data = await response.json();
                await refresh();
                return (data.employee as Employee) ?? null;
            } catch {
                return null;
            }
        },
        [refresh]
    );

    const deleteEmployee = useCallback(
        async (employeeId: string) => {
            try {
                await fetch(`/api/employees/${employeeId}`, { method: "DELETE" });
            } finally {
                await refresh();
            }
        },
        [refresh]
    );

    return { employees, addEmployee, updateEmployee, deleteEmployee };
}

export type PayrollRecordInput = {
    employeeId: string;
    month: string;
    baseSalary: number;
    overtimeAmount: number;
    daysWorked: number;
    leaveDays: number;
    note?: string;
};

async function fetchPayrollRecords(month?: string): Promise<PayrollRecord[]> {
    try {
        const url = month ? `/api/payroll?month=${encodeURIComponent(month)}` : "/api/payroll";
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data.records) ? (data.records as PayrollRecord[]) : [];
    } catch {
        return [];
    }
}

export type PayrollStore = {
    records: PayrollRecord[];
    loading: boolean;
    saveRecord: (input: PayrollRecordInput) => Promise<PayrollRecord | null>;
    deleteRecord: (recordId: string) => Promise<void>;
    refresh: () => Promise<void>;
};

/** month: "YYYY-MM". Pass undefined to load every record ever entered
 * (used for the full-history export). */
export function usePayrollRecords(month: string | undefined): PayrollStore {
    const [records, setRecords] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        setRecords(await fetchPayrollRecords(month));
        setLoading(false);
    }, [month]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const saveRecord = useCallback(
        async (input: PayrollRecordInput) => {
            try {
                const response = await fetch("/api/payroll", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(input),
                });
                if (!response.ok) return null;

                const data = await response.json();
                await refresh();
                return (data.record as PayrollRecord) ?? null;
            } catch {
                return null;
            }
        },
        [refresh]
    );

    const deleteRecord = useCallback(
        async (recordId: string) => {
            try {
                await fetch(`/api/payroll/${recordId}`, { method: "DELETE" });
            } finally {
                await refresh();
            }
        },
        [refresh]
    );

    return { records, loading, saveRecord, deleteRecord, refresh };
}
