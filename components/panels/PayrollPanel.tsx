"use client";

import { useEffect, useMemo, useState } from "react";
import { useEmployees, usePayrollRecords, type EmployeeInput } from "../../lib/payroll-store";
import type { Employee, PayrollRecord } from "../../lib/types";
import { PanelNav, type PanelNavLink } from "./PanelNav";

function formatToman(value: number) {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} تومان`;
}

function currentMonthValue() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function escapeHtml(value: string | number) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}

type RowState = {
    baseSalary: string;
    overtimeDays: string;
    daysWorked: string;
    leaveDays: string;
    bonusAmount: string;
    penaltyAmount: string;
    advanceAmount: string;
    loanInstallment: string;
    insuranceAmount: string;
    note: string;
};

function emptyRowState(baseSalary: number): RowState {
    return {
        baseSalary: String(baseSalary),
        overtimeDays: "0",
        daysWorked: "0",
        leaveDays: "0",
        bonusAmount: "0",
        penaltyAmount: "0",
        advanceAmount: "0",
        loanInstallment: "0",
        insuranceAmount: "0",
        note: "",
    };
}

function recordToRowState(record: PayrollRecord): RowState {
    return {
        baseSalary: String(record.baseSalary),
        overtimeDays: String(record.overtimeDays),
        daysWorked: String(record.daysWorked),
        leaveDays: String(record.leaveDays),
        bonusAmount: String(record.bonusAmount),
        penaltyAmount: String(record.penaltyAmount),
        advanceAmount: String(record.advanceAmount),
        loanInstallment: String(record.loanInstallment),
        insuranceAmount: String(record.insuranceAmount),
        note: record.note ?? "",
    };
}

export function PayrollPanel({ navLinks }: { navLinks: PanelNavLink[] }) {
    const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
    const [month, setMonth] = useState(currentMonthValue());
    const { records, saveRecord } = usePayrollRecords(month);

    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const [employeesExpanded, setEmployeesExpanded] = useState(false);
    const [newEmployee, setNewEmployee] = useState<EmployeeInput>({ fullName: "", position: "", baseSalary: 0 });
    const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
    const [editEmployeeForm, setEditEmployeeForm] = useState<EmployeeInput>({ fullName: "", position: "", baseSalary: 0 });

    const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
    const [savingId, setSavingId] = useState<string | null>(null);

    const activeEmployees = useMemo(() => employees.filter((employee) => employee.isActive), [employees]);
    const recordsByEmployeeId = useMemo(() => new Map(records.map((record) => [record.employeeId, record])), [records]);

    useEffect(() => {
        setRowStates((current) => {
            const next = { ...current };
            for (const employee of activeEmployees) {
                const record = recordsByEmployeeId.get(employee.id);
                next[employee.id] = record ? recordToRowState(record) : emptyRowState(employee.baseSalary);
            }
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month, records, activeEmployees.map((employee) => employee.id).join(",")]);

    function updateRow(employeeId: string, field: keyof RowState, value: string) {
        setRowStates((current) => ({ ...current, [employeeId]: { ...current[employeeId], [field]: value } }));
    }

    /** روزانه = حقوق پایه / ۳۰. اضافه‌کاری و پاداش اضافه می‌شوند؛ جریمه،
     * مساعده، قسط وام و بیمه از جمع کل کم می‌شوند. */
    function rowTotal(employeeId: string) {
        const row = rowStates[employeeId];
        if (!row) return 0;

        const baseSalary = Number(row.baseSalary) || 0;
        const dailyWage = baseSalary / 30;
        const overtimePay = dailyWage * (Number(row.overtimeDays) || 0);

        return (
            baseSalary +
            overtimePay +
            (Number(row.bonusAmount) || 0) -
            (Number(row.penaltyAmount) || 0) -
            (Number(row.advanceAmount) || 0) -
            (Number(row.loanInstallment) || 0) -
            (Number(row.insuranceAmount) || 0)
        );
    }

    async function handleSaveRow(employeeId: string) {
        const row = rowStates[employeeId];
        if (!row) return;

        setSavingId(employeeId);
        await saveRecord({
            employeeId,
            month,
            baseSalary: Number(row.baseSalary) || 0,
            overtimeDays: Number(row.overtimeDays) || 0,
            daysWorked: Number(row.daysWorked) || 0,
            leaveDays: Number(row.leaveDays) || 0,
            bonusAmount: Number(row.bonusAmount) || 0,
            penaltyAmount: Number(row.penaltyAmount) || 0,
            advanceAmount: Number(row.advanceAmount) || 0,
            loanInstallment: Number(row.loanInstallment) || 0,
            insuranceAmount: Number(row.insuranceAmount) || 0,
            note: row.note,
        });
        setSavingId(null);
    }

    async function handleAddEmployee() {
        if (!newEmployee.fullName.trim()) return;
        await addEmployee(newEmployee);
        setNewEmployee({ fullName: "", position: "", baseSalary: 0 });
        setShowEmployeeForm(false);
    }

    function openEditEmployee(employee: Employee) {
        setEditingEmployeeId(employee.id);
        setEditEmployeeForm({ fullName: employee.fullName, position: employee.position ?? "", baseSalary: employee.baseSalary });
    }

    async function handleSaveEmployeeEdit() {
        if (!editingEmployeeId) return;
        await updateEmployee(editingEmployeeId, editEmployeeForm);
        setEditingEmployeeId(null);
    }

    async function handleToggleActive(employee: Employee) {
        await updateEmployee(employee.id, { isActive: !employee.isActive });
    }

    async function handleDeleteEmployee(employeeId: string) {
        if (!window.confirm("این پرسنل و تمام سوابق حقوقی او حذف شود؟")) return;
        await deleteEmployee(employeeId);
    }

    function exportExcel() {
        const headerRow = [
            "نام پرسنل",
            "سمت",
            "حقوق پایه",
            "روز اضافه‌کاری",
            "روزهای حضور",
            "مرخصی",
            "پاداش",
            "جریمه",
            "مساعده",
            "قسط وام",
            "بیمه",
            "جمع کل",
        ];
        const rows: Array<Array<string | number>> = [headerRow];

        for (const employee of activeEmployees) {
            const row = rowStates[employee.id];
            if (!row) continue;
            rows.push([
                employee.fullName,
                employee.position ?? "",
                Number(row.baseSalary) || 0,
                Number(row.overtimeDays) || 0,
                Number(row.daysWorked) || 0,
                Number(row.leaveDays) || 0,
                Number(row.bonusAmount) || 0,
                Number(row.penaltyAmount) || 0,
                Number(row.advanceAmount) || 0,
                Number(row.loanInstallment) || 0,
                Number(row.insuranceAmount) || 0,
                rowTotal(employee.id),
            ]);
        }

        const tableRows = rows
            .map((row, rowIndex) => {
                const cellTag = rowIndex === 0 ? "th" : "td";
                return `<tr>${row.map((cell) => `<${cellTag}>${escapeHtml(cell)}</${cellTag}>`).join("")}</tr>`;
            })
            .join("");

        const html = `
            <html>
                <head>
                    <meta charset="utf-8" />
                    <style>
                        body { font-family: Tahoma, sans-serif; direction: rtl; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #b7d7b7; padding: 8px; text-align: right; }
                        th { background: #e0ffe0; color: #0B2F0B; }
                    </style>
                </head>
                <body>
                    <h1>لیست حقوق و دستمزد — ${month}</h1>
                    <table>${tableRows}</table>
                </body>
            </html>
        `;

        const blob = new Blob([`﻿${html}`], { type: "application/vnd.ms-excel;charset=utf-8" });
        downloadBlob(blob, `penza-payroll-${month}.xls`);
    }

    return (
        <main className="penza-page">
            <div className="mx-auto max-w-7xl p-5 lg:p-6">
                <section className="penza-hero p-5 lg:p-7">
                    <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                <span className="penza-live-dot" />
                                Penza · حقوق و دستمزد
                            </p>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">حقوق و دستمزد</h1>
                        </div>

                        <PanelNav links={navLinks} />
                    </div>
                </section>

                <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500">ماه</label>
                            <input
                                type="month"
                                value={month}
                                onChange={(event) => setMonth(event.target.value)}
                                className="mt-2 h-11 rounded-2xl border border-green-900/15 bg-white px-4 text-sm font-bold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={exportExcel}
                                className="penza-ghost-button rounded-2xl px-4 py-3 text-sm font-black hover:bg-green-50"
                            >
                                خروجی اکسل
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="penza-ghost-button rounded-2xl px-4 py-3 text-sm font-black hover:bg-green-50"
                            >
                                PDF / چاپ
                            </button>
                        </div>
                    </div>
                </section>

                <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                    <button
                        type="button"
                        onClick={() => setEmployeesExpanded((current) => !current)}
                        className="flex w-full items-center justify-between text-right"
                    >
                        <div>
                            <h2 className="text-xl font-black text-[#0B2F0B]">مدیریت پرسنل</h2>
                            <p className="mt-1 text-xs font-bold text-slate-500">{employees.length} نفر ثبت‌شده</p>
                        </div>
                        <span className="text-sm font-black text-[#007A00]">{employeesExpanded ? "بستن" : "نمایش"}</span>
                    </button>

                    {employeesExpanded && (
                        <div className="mt-4 space-y-3">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[560px] text-sm">
                                    <thead>
                                        <tr className="text-right text-xs font-black text-slate-500">
                                            <th className="px-3 py-2">نام</th>
                                            <th className="px-3 py-2">سمت</th>
                                            <th className="px-3 py-2">حقوق پایه</th>
                                            <th className="px-3 py-2">وضعیت</th>
                                            <th className="px-3 py-2">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((employee) => (
                                            <tr key={employee.id} className="border-t border-green-900/10">
                                                {editingEmployeeId === employee.id ? (
                                                    <>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                value={editEmployeeForm.fullName}
                                                                onChange={(event) =>
                                                                    setEditEmployeeForm((current) => ({ ...current, fullName: event.target.value }))
                                                                }
                                                                className="h-10 w-full rounded-xl border border-green-900/15 px-3 text-sm"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                value={editEmployeeForm.position ?? ""}
                                                                onChange={(event) =>
                                                                    setEditEmployeeForm((current) => ({ ...current, position: event.target.value }))
                                                                }
                                                                className="h-10 w-full rounded-xl border border-green-900/15 px-3 text-sm"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={editEmployeeForm.baseSalary}
                                                                onChange={(event) =>
                                                                    setEditEmployeeForm((current) => ({
                                                                        ...current,
                                                                        baseSalary: Number(event.target.value),
                                                                    }))
                                                                }
                                                                className="h-10 w-28 rounded-xl border border-green-900/15 px-3 text-sm"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-xs font-bold text-slate-400">—</td>
                                                        <td className="px-3 py-2">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSaveEmployeeEdit}
                                                                    className="penza-button rounded-xl px-3 py-2 text-xs font-black"
                                                                >
                                                                    ذخیره
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingEmployeeId(null)}
                                                                    className="rounded-xl border border-green-900/15 px-3 py-2 text-xs font-black text-slate-500"
                                                                >
                                                                    انصراف
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-3 py-2 font-bold text-[#0B2F0B]">{employee.fullName}</td>
                                                        <td className="px-3 py-2 text-slate-500">{employee.position || "—"}</td>
                                                        <td className="px-3 py-2 text-slate-500">{formatToman(employee.baseSalary)}</td>
                                                        <td className="px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleActive(employee)}
                                                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                                                    employee.isActive
                                                                        ? "bg-[#e0ffe0] text-[#007A00]"
                                                                        : "bg-slate-100 text-slate-400"
                                                                }`}
                                                            >
                                                                {employee.isActive ? "فعال" : "غیرفعال"}
                                                            </button>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditEmployee(employee)}
                                                                    className="rounded-xl border border-green-900/15 px-3 py-2 text-xs font-black text-[#007A00]"
                                                                >
                                                                    ویرایش
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteEmployee(employee.id)}
                                                                    className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-600"
                                                                >
                                                                    حذف
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {showEmployeeForm ? (
                                <div className="rounded-2xl border border-green-900/10 bg-[#f9fffa] p-4">
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <input
                                            placeholder="نام و نام خانوادگی"
                                            value={newEmployee.fullName}
                                            onChange={(event) => setNewEmployee((current) => ({ ...current, fullName: event.target.value }))}
                                            className="h-11 rounded-2xl border border-green-900/15 px-4 text-sm"
                                        />
                                        <input
                                            placeholder="سمت (اختیاری)"
                                            value={newEmployee.position}
                                            onChange={(event) => setNewEmployee((current) => ({ ...current, position: event.target.value }))}
                                            className="h-11 rounded-2xl border border-green-900/15 px-4 text-sm"
                                        />
                                        <input
                                            type="number"
                                            placeholder="حقوق پایه (تومان)"
                                            value={newEmployee.baseSalary || ""}
                                            onChange={(event) =>
                                                setNewEmployee((current) => ({ ...current, baseSalary: Number(event.target.value) }))
                                            }
                                            className="h-11 rounded-2xl border border-green-900/15 px-4 text-sm"
                                        />
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <button type="button" onClick={handleAddEmployee} className="penza-button rounded-2xl px-5 py-3 text-sm font-black">
                                            افزودن پرسنل
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowEmployeeForm(false)}
                                            className="rounded-2xl border border-green-900/15 px-5 py-3 text-sm font-black text-slate-500"
                                        >
                                            انصراف
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowEmployeeForm(true)}
                                    className="penza-button rounded-2xl px-5 py-3 text-sm font-black"
                                >
                                    + افزودن پرسنل جدید
                                </button>
                            )}
                        </div>
                    )}
                </section>

                <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                    <h2 className="text-xl font-black text-[#0B2F0B]">حقوق پرسنل — {month}</h2>
                    <p className="mt-1 text-xs font-bold leading-6 text-slate-500">
                        جمع کل = حقوق پایه + (روز اضافه‌کاری × حقوق پایه ÷ ۳۰) + پاداش − جریمه − مساعده − قسط وام − بیمه
                    </p>

                    {activeEmployees.length === 0 ? (
                        <p className="mt-4 text-sm font-bold text-slate-400">هنوز پرسنل فعالی ثبت نشده است.</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[1400px] text-sm">
                                <thead>
                                    <tr className="text-right text-xs font-black text-slate-500">
                                        <th className="px-3 py-2">نام</th>
                                        <th className="px-3 py-2">حقوق پایه</th>
                                        <th className="px-3 py-2">روز اضافه‌کاری</th>
                                        <th className="px-3 py-2">روزهای حضور</th>
                                        <th className="px-3 py-2">مرخصی</th>
                                        <th className="px-3 py-2">پاداش</th>
                                        <th className="px-3 py-2">جریمه</th>
                                        <th className="px-3 py-2">مساعده</th>
                                        <th className="px-3 py-2">قسط وام</th>
                                        <th className="px-3 py-2">بیمه</th>
                                        <th className="px-3 py-2">جمع کل</th>
                                        <th className="px-3 py-2">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeEmployees.map((employee) => {
                                        const row = rowStates[employee.id];
                                        if (!row) return null;

                                        return (
                                            <tr key={employee.id} className="border-t border-green-900/10">
                                                <td className="px-3 py-2 font-bold text-[#0B2F0B]">{employee.fullName}</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.baseSalary}
                                                        onChange={(event) => updateRow(employee.id, "baseSalary", event.target.value)}
                                                        className="h-10 w-28 rounded-xl border border-green-900/15 px-3 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.overtimeDays}
                                                        onChange={(event) => updateRow(employee.id, "overtimeDays", event.target.value)}
                                                        className="h-10 w-20 rounded-xl border border-green-900/15 px-3 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.daysWorked}
                                                        onChange={(event) => updateRow(employee.id, "daysWorked", event.target.value)}
                                                        className="h-10 w-20 rounded-xl border border-green-900/15 px-3 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.leaveDays}
                                                        onChange={(event) => updateRow(employee.id, "leaveDays", event.target.value)}
                                                        className="h-10 w-20 rounded-xl border border-green-900/15 px-3 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.bonusAmount}
                                                        onChange={(event) => updateRow(employee.id, "bonusAmount", event.target.value)}
                                                        className="h-10 w-24 rounded-xl border border-green-900/15 px-3 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.penaltyAmount}
                                                        onChange={(event) => updateRow(employee.id, "penaltyAmount", event.target.value)}
                                                        className="h-10 w-24 rounded-xl border border-green-900/15 px-3 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.advanceAmount}
                                                        onChange={(event) => updateRow(employee.id, "advanceAmount", event.target.value)}
                                                        className="h-10 w-24 rounded-xl border border-green-900/15 px-3 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.loanInstallment}
                                                        onChange={(event) => updateRow(employee.id, "loanInstallment", event.target.value)}
                                                        className="h-10 w-24 rounded-xl border border-green-900/15 px-3 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.insuranceAmount}
                                                        onChange={(event) => updateRow(employee.id, "insuranceAmount", event.target.value)}
                                                        className="h-10 w-24 rounded-xl border border-green-900/15 px-3 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 font-black text-[#007A00]">{formatToman(rowTotal(employee.id))}</td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveRow(employee.id)}
                                                        disabled={savingId === employee.id}
                                                        className="penza-button rounded-xl px-3 py-2 text-xs font-black disabled:opacity-50"
                                                    >
                                                        {savingId === employee.id ? "..." : "ذخیره"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
