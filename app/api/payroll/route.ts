import { NextRequest, NextResponse } from "next/server";
import { createRecordId, getDataDb, nowIso } from "../../../lib/db";
import { requireAuth } from "../../../lib/session";
import type { PayrollRecord } from "../../../lib/types";

type PayrollRow = {
    id: string;
    employee_id: string;
    month: string;
    base_salary: number;
    overtime_days: number;
    days_worked: number;
    leave_days: number;
    bonus_amount: number;
    penalty_amount: number;
    advance_amount: number;
    loan_installment: number;
    insurance_amount: number;
    note: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
};

function mapRecord(row: PayrollRow): PayrollRecord {
    return {
        id: row.id,
        employeeId: row.employee_id,
        month: row.month,
        baseSalary: row.base_salary,
        overtimeDays: row.overtime_days,
        daysWorked: row.days_worked,
        leaveDays: row.leave_days,
        bonusAmount: row.bonus_amount,
        penaltyAmount: row.penalty_amount,
        advanceAmount: row.advance_amount,
        loanInstallment: row.loan_installment,
        insuranceAmount: row.insurance_amount,
        note: row.note ?? undefined,
        createdBy: row.created_by ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function nonNegativeNumber(value: unknown) {
    return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
}

export async function GET(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const month = request.nextUrl.searchParams.get("month");
    const db = getDataDb(auth.account.role === "demo");

    const rows = month
        ? (db.prepare("SELECT * FROM payroll_records WHERE month = ?").all(month) as PayrollRow[])
        : (db.prepare("SELECT * FROM payroll_records ORDER BY month DESC").all() as PayrollRow[]);

    return NextResponse.json({ records: rows.map(mapRecord) });
}

/** Upserts a single employee's payroll record for a given month — the UI
 * always saves the whole row for one employee/month at once rather than
 * patching individual fields. */
export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["manager", "accountant"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);

    const employeeId = typeof body?.employeeId === "string" ? body.employeeId : "";
    const month = typeof body?.month === "string" ? body.month : "";

    if (!employeeId || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: "پرسنل و ماه معتبر الزامی است." }, { status: 400 });
    }

    const db = getDataDb(auth.account.role === "demo");
    const employee = db.prepare("SELECT id FROM employees WHERE id = ?").get(employeeId);

    if (!employee) {
        return NextResponse.json({ error: "پرسنل پیدا نشد." }, { status: 404 });
    }

    const baseSalary = nonNegativeNumber(body.baseSalary);
    const overtimeDays = nonNegativeNumber(body.overtimeDays);
    const daysWorked = nonNegativeNumber(body.daysWorked);
    const leaveDays = nonNegativeNumber(body.leaveDays);
    const bonusAmount = nonNegativeNumber(body.bonusAmount);
    const penaltyAmount = nonNegativeNumber(body.penaltyAmount);
    const advanceAmount = nonNegativeNumber(body.advanceAmount);
    const loanInstallment = nonNegativeNumber(body.loanInstallment);
    const insuranceAmount = nonNegativeNumber(body.insuranceAmount);
    const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;
    const now = nowIso();

    const existing = db
        .prepare("SELECT id FROM payroll_records WHERE employee_id = ? AND month = ?")
        .get(employeeId, month) as { id: string } | undefined;

    const id = existing?.id ?? createRecordId("payroll");
    const createdBy = auth.account.displayName ?? auth.account.username;

    if (existing) {
        db.prepare(
            `UPDATE payroll_records
             SET base_salary = ?, overtime_days = ?, days_worked = ?, leave_days = ?,
                 bonus_amount = ?, penalty_amount = ?, advance_amount = ?, loan_installment = ?, insurance_amount = ?,
                 note = ?, created_by = ?, updated_at = ?
             WHERE id = ?`
        ).run(
            baseSalary,
            overtimeDays,
            daysWorked,
            leaveDays,
            bonusAmount,
            penaltyAmount,
            advanceAmount,
            loanInstallment,
            insuranceAmount,
            note,
            createdBy,
            now,
            id
        );
    } else {
        db.prepare(
            `INSERT INTO payroll_records
                (id, employee_id, month, base_salary, overtime_days, days_worked, leave_days,
                 bonus_amount, penalty_amount, advance_amount, loan_installment, insurance_amount,
                 note, created_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            id,
            employeeId,
            month,
            baseSalary,
            overtimeDays,
            daysWorked,
            leaveDays,
            bonusAmount,
            penaltyAmount,
            advanceAmount,
            loanInstallment,
            insuranceAmount,
            note,
            createdBy,
            now,
            now
        );
    }

    const row = db.prepare("SELECT * FROM payroll_records WHERE id = ?").get(id) as PayrollRow;

    return NextResponse.json({ record: mapRecord(row) });
}
