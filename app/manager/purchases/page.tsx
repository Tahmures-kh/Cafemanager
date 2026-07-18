"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BackButton } from "../../../components/BackButton";
import { RoleGuard } from "../../../components/RoleGuard";
import { fetchAuditLog, logAuditEvent } from "../../../lib/audit-log";
import { getCurrentAccount, type CurrentAccount } from "../../../lib/auth-api";
import { formatDateTime, useCafeStorageStore } from "../../../lib/local-store";
import {
    createPurchaseOrder,
    createSupplier,
    deleteSupplier,
    fetchPurchaseOrders,
    fetchSuppliers,
    resendPurchaseOrderSms,
    updateSupplier,
} from "../../../lib/purchases-api";
import { getRoleLabel } from "../../../lib/role-session";
import type { AuditLogEntry, PurchaseOrder, Supplier } from "../../../lib/types";

const AUDIT_SCOPE = "purchases";

function emptySupplierForm() {
    return { name: "", phone: "", website: "", notes: "" };
}

function emptyOrderItem() {
    return { productId: "", productName: "", quantity: "" };
}

function smsStatusLabel(status: string) {
    if (status === "sent") return { text: "پیامک ارسال شد", className: "bg-[#e0ffe0] text-[#007A00]" };
    if (status === "not_configured") return { text: "سرویس پیامک تنظیم نشده", className: "bg-slate-100 text-slate-600" };
    if (status === "error") return { text: "خطا در ارسال پیامک", className: "bg-red-50 text-red-600" };
    return { text: "در انتظار", className: "bg-slate-100 text-slate-600" };
}

export default function ManagerPurchasesPage() {
    const { products } = useCafeStorageStore();

    const [account, setAccount] = useState<CurrentAccount | null>(null);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supplierForm, setSupplierForm] = useState(emptySupplierForm());
    const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [orderSupplierId, setOrderSupplierId] = useState("");
    const [orderItems, setOrderItems] = useState([emptyOrderItem()]);
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [orderFormError, setOrderFormError] = useState<string | null>(null);

    const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);

    async function refreshSuppliers() {
        setSuppliers(await fetchSuppliers());
    }

    async function refreshOrders() {
        setOrders(await fetchPurchaseOrders());
    }

    async function refreshAuditLog() {
        setAuditEntries(await fetchAuditLog(AUDIT_SCOPE));
    }

    useEffect(() => {
        refreshSuppliers();
        refreshOrders();
        refreshAuditLog();
        getCurrentAccount().then(setAccount);
    }, []);

    async function recordAuditEvent(action: string, description: string) {
        await logAuditEvent({ scope: AUDIT_SCOPE, action, description });
        refreshAuditLog();
    }

    function openNewSupplierForm() {
        setEditingSupplierId("new");
        setSupplierForm(emptySupplierForm());
    }

    function openEditSupplierForm(supplier: Supplier) {
        setEditingSupplierId(supplier.id);
        setSupplierForm({
            name: supplier.name,
            phone: supplier.phone,
            website: supplier.website ?? "",
            notes: supplier.notes ?? "",
        });
    }

    async function handleSaveSupplier() {
        const name = supplierForm.name.trim();
        const phone = supplierForm.phone.trim();
        if (!name || !phone) return;

        const input = {
            name,
            phone,
            website: supplierForm.website.trim() || undefined,
            notes: supplierForm.notes.trim() || undefined,
        };

        if (editingSupplierId === "new") {
            await createSupplier(input);
            await recordAuditEvent("create_supplier", `افزودن فروشنده «${name}»`);
        } else if (editingSupplierId) {
            await updateSupplier(editingSupplierId, input);
            await recordAuditEvent("update_supplier", `ویرایش فروشنده «${name}»`);
        }

        setEditingSupplierId(null);
        setSupplierForm(emptySupplierForm());
        await refreshSuppliers();
    }

    async function handleDeleteSupplier(supplier: Supplier) {
        const confirmed = window.confirm(`حذف فروشنده «${supplier.name}»؟`);
        if (!confirmed) return;

        await deleteSupplier(supplier.id);
        await recordAuditEvent("delete_supplier", `حذف فروشنده «${supplier.name}»`);
        await refreshSuppliers();
    }

    function updateOrderItem(index: number, field: "productId" | "productName" | "quantity", value: string) {
        setOrderItems((current) =>
            current.map((item, itemIndex) => {
                if (itemIndex !== index) return item;

                if (field === "productId") {
                    const product = products.find((candidate) => candidate.id === value);
                    return { ...item, productId: value, productName: product?.name ?? item.productName };
                }

                return { ...item, [field]: value };
            })
        );
    }

    function addOrderItemRow() {
        setOrderItems((current) => [...current, emptyOrderItem()]);
    }

    function removeOrderItemRow(index: number) {
        setOrderItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    }

    async function handleSubmitOrder() {
        setOrderFormError(null);

        if (!orderSupplierId) {
            setOrderFormError("انتخاب فروشنده الزامی است.");
            return;
        }

        const items = orderItems
            .filter((item) => item.productName.trim() && Number.parseFloat(item.quantity) > 0)
            .map((item) => {
                const product = products.find((candidate) => candidate.id === item.productId);
                return {
                    productId: item.productId || undefined,
                    productName: item.productName.trim(),
                    quantity: Number.parseFloat(item.quantity),
                    stockUnit: product?.stockUnit ?? product?.unit,
                };
            });

        if (items.length === 0) {
            setOrderFormError("حداقل یک ردیف کالا با مقدار معتبر وارد کنید.");
            return;
        }

        setSubmittingOrder(true);
        const result = await createPurchaseOrder({
            supplierId: orderSupplierId,
            createdBy: account?.displayName ?? account?.username ?? undefined,
            items,
        });
        setSubmittingOrder(false);

        if (!result.ok) {
            setOrderFormError(result.error);
            return;
        }

        const supplier = suppliers.find((candidate) => candidate.id === orderSupplierId);
        await recordAuditEvent(
            "create_purchase_order",
            `ثبت سفارش خرید از «${supplier?.name ?? "فروشنده"}» — ${items.length} ردیف کالا`
        );

        setOrderSupplierId("");
        setOrderItems([emptyOrderItem()]);
        await refreshOrders();
    }

    async function handleResendSms(order: PurchaseOrder) {
        await resendPurchaseOrderSms(order.id);
        const supplier = suppliers.find((candidate) => candidate.id === order.supplierId);
        await recordAuditEvent("resend_sms", `ارسال مجدد پیامک سفارش به «${supplier?.name ?? "فروشنده"}»`);
        await refreshOrders();
    }

    return (
        <RoleGuard role="manager">
            <main className="penza-page">
                <div className="mx-auto max-w-7xl p-5 lg:p-6">
                    <section className="penza-hero p-5 lg:p-7">
                        <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-white px-4 py-2 text-sm font-black text-[#007A00] shadow-sm">
                                    <span className="penza-live-dot" />
                                    Penza · خریدهای روزانه
                                </p>
                                <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0B2F0B] lg:text-5xl">
                                    خریدهای روزانه و فروشنده‌ها
                                </h1>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <BackButton />
                                <Link href="/manager/dashboard" className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                    داشبورد
                                </Link>
                                <Link href="/manager/inventory" className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                    موجودی انبار
                                </Link>
                                <Link href="/manager/sales" className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                    فروش و تحلیل
                                </Link>
                                <Link href="/manager/reports" className="penza-button rounded-2xl px-5 py-3 text-sm font-black">
                                    گزارش دوره‌ای
                                </Link>
                                <Link href="/manager/recipes" className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-[#007A00] hover:bg-[#f2fff2]">
                                    رسپی‌ها
                                </Link>
                            </div>
                        </div>
                    </section>

                    {account && (
                        <section className="mt-5 rounded-2xl bg-[#f2fff2] px-4 py-2 text-xs font-bold text-[#007A00]">
                            ثبت‌کننده‌ی فعالیت‌ها: {account.displayName ?? account.username} ({getRoleLabel(account.role)})
                        </section>
                    )}

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-xl font-black text-[#0B2F0B]">فروشنده‌ها ({suppliers.length})</h2>
                            <button
                                type="button"
                                onClick={openNewSupplierForm}
                                className="penza-ghost-button rounded-2xl px-4 py-2 text-xs font-black hover:bg-green-50"
                            >
                                + فروشنده جدید
                            </button>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[640px] text-right text-sm">
                                <thead className="penza-table-head text-xs font-black">
                                    <tr>
                                        <th className="px-4 py-3">نام</th>
                                        <th className="px-4 py-3">شماره تماس</th>
                                        <th className="px-4 py-3">وب‌سایت</th>
                                        <th className="px-4 py-3">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {suppliers.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-[#f8fff8]">
                                            <td className="px-4 py-3 font-black text-[#0B2F0B]">{supplier.name}</td>
                                            <td className="px-4 py-3 text-slate-600" dir="ltr">{supplier.phone}</td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {supplier.website ? (
                                                    <a
                                                        href={supplier.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-bold text-[#007A00] underline"
                                                    >
                                                        مشاهده سایت
                                                    </a>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => openEditSupplierForm(supplier)} className="rounded-full bg-[#e0ffe0] px-3 py-1 text-[11px] font-black text-[#007A00]">
                                                        ویرایش
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteSupplier(supplier)} className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-black text-red-600">
                                                        حذف
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {suppliers.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-sm font-bold text-slate-500" colSpan={4}>
                                                هنوز فروشنده‌ای ثبت نشده است.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {editingSupplierId && (
                            <div className="mt-4 rounded-2xl border border-green-900/10 bg-[#f8fff8] p-4">
                                <h3 className="text-sm font-black text-[#0B2F0B]">
                                    {editingSupplierId === "new" ? "فروشنده جدید" : "ویرایش فروشنده"}
                                </h3>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <input
                                        value={supplierForm.name}
                                        onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))}
                                        placeholder="نام فروشنده"
                                        className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                    />
                                    <input
                                        value={supplierForm.phone}
                                        onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))}
                                        placeholder="شماره تماس (مثلاً 09121234567)"
                                        dir="ltr"
                                        className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                    />
                                    <input
                                        value={supplierForm.website}
                                        onChange={(event) => setSupplierForm((current) => ({ ...current, website: event.target.value }))}
                                        placeholder="لینک وب‌سایت (اختیاری)"
                                        dir="ltr"
                                        className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                    />
                                    <input
                                        value={supplierForm.notes}
                                        onChange={(event) => setSupplierForm((current) => ({ ...current, notes: event.target.value }))}
                                        placeholder="یادداشت (اختیاری)"
                                        className="h-12 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                    />
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button type="button" onClick={handleSaveSupplier} className="penza-button rounded-2xl px-5 py-3 text-sm font-black">
                                        ذخیره
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingSupplierId(null); setSupplierForm(emptySupplierForm()); }}
                                        className="rounded-2xl border border-green-900/15 bg-white px-5 py-3 text-sm font-black text-slate-500 hover:bg-slate-50"
                                    >
                                        انصراف
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">سفارش خرید جدید</h2>

                        <div className="mt-4">
                            <select
                                value={orderSupplierId}
                                onChange={(event) => setOrderSupplierId(event.target.value)}
                                className="h-12 min-w-[16rem] rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                            >
                                <option value="">انتخاب فروشنده...</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-4 space-y-2">
                            {orderItems.map((item, index) => (
                                <div key={index} className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={item.productId}
                                        onChange={(event) => updateOrderItem(index, "productId", event.target.value)}
                                        className="h-12 min-w-[12rem] rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                    >
                                        <option value="">کالای دلخواه...</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>{product.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        value={item.productName}
                                        onChange={(event) => updateOrderItem(index, "productName", event.target.value)}
                                        placeholder="نام کالا"
                                        disabled={Boolean(item.productId)}
                                        className="h-12 min-w-[10rem] rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300] disabled:bg-slate-50"
                                    />
                                    <input
                                        value={item.quantity}
                                        onChange={(event) => updateOrderItem(index, "quantity", event.target.value)}
                                        placeholder="مقدار"
                                        className="h-12 w-32 rounded-2xl border border-green-900/15 bg-white px-4 text-right text-sm font-semibold text-[#0B2F0B] outline-none focus:border-[#00A300]"
                                    />
                                    <button type="button" onClick={() => removeOrderItemRow(index)} className="rounded-full bg-red-50 px-3 py-2 text-[11px] font-black text-red-600">
                                        حذف ردیف
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addOrderItemRow} className="penza-ghost-button rounded-2xl px-4 py-2 text-xs font-black hover:bg-green-50">
                                + افزودن کالا
                            </button>
                        </div>

                        {orderFormError && (
                            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{orderFormError}</p>
                        )}

                        <div className="mt-4">
                            <button
                                type="button"
                                disabled={submittingOrder}
                                onClick={handleSubmitOrder}
                                className="penza-button rounded-2xl px-5 py-3 text-sm font-black disabled:opacity-50"
                            >
                                {submittingOrder ? "در حال ثبت..." : "ثبت سفارش و ارسال پیامک"}
                            </button>
                        </div>
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">سفارش‌های قبلی ({orders.length})</h2>
                        <div className="mt-4 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[720px] text-right text-sm">
                                <thead className="penza-table-head text-xs font-black">
                                    <tr>
                                        <th className="px-4 py-3">تاریخ</th>
                                        <th className="px-4 py-3">فروشنده</th>
                                        <th className="px-4 py-3">تعداد ردیف</th>
                                        <th className="px-4 py-3">وضعیت پیامک</th>
                                        <th className="px-4 py-3">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {orders.map((order) => {
                                        const supplier = suppliers.find((candidate) => candidate.id === order.supplierId);
                                        const status = smsStatusLabel(order.smsStatus);
                                        return (
                                            <tr key={order.id} className="hover:bg-[#f8fff8]">
                                                <td className="px-4 py-3 text-slate-600">{formatDateTime(order.createdAt)}</td>
                                                <td className="px-4 py-3 font-black text-[#0B2F0B]">{supplier?.name ?? "فروشنده حذف‌شده"}</td>
                                                <td className="px-4 py-3 text-slate-600">{order.items.length}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-3 py-1 text-[11px] font-black ${status.className}`}>{status.text}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button type="button" onClick={() => handleResendSms(order)} className="rounded-full bg-[#e0ffe0] px-3 py-1 text-[11px] font-black text-[#007A00]">
                                                        ارسال مجدد پیامک
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-sm font-bold text-slate-500" colSpan={5}>
                                                هنوز سفارشی ثبت نشده است.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="mt-5 penza-card rounded-[1.5rem] p-5">
                        <h2 className="text-xl font-black text-[#0B2F0B]">تاریخچه‌ی فعالیت این پنل</h2>
                        <div className="mt-4 overflow-hidden rounded-2xl border border-green-900/10 bg-white">
                            <table className="w-full min-w-[720px] text-right text-xs">
                                <thead className="penza-table-head font-black">
                                    <tr>
                                        <th className="px-4 py-3">تاریخ و ساعت</th>
                                        <th className="px-4 py-3">کاربر</th>
                                        <th className="px-4 py-3">عملیات</th>
                                        <th className="px-4 py-3">توضیحات</th>
                                        <th className="px-4 py-3">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-900/10">
                                    {auditEntries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="px-4 py-3 text-slate-600">{formatDateTime(entry.createdAt)}</td>
                                            <td className="px-4 py-3 font-bold text-[#0B2F0B]">{entry.actorName} ({entry.actorRole})</td>
                                            <td className="px-4 py-3 text-slate-600">{entry.action}</td>
                                            <td className="px-4 py-3 text-slate-600">{entry.description}</td>
                                            <td className="px-4 py-3 text-slate-600">{entry.ip}</td>
                                        </tr>
                                    ))}
                                    {auditEntries.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-6 text-center font-bold text-slate-500" colSpan={5}>
                                                هنوز فعالیتی ثبت نشده است.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </RoleGuard>
    );
}
