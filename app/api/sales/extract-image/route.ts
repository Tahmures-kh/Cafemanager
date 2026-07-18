import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "../../../../lib/session";

const SUPPORTED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const EXTRACTION_SCHEMA = {
    type: "object",
    properties: {
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    itemName: { type: "string" },
                    quantitySold: { type: "number" },
                    unitPrice: { anyOf: [{ type: "number" }, { type: "null" }] },
                    revenue: { anyOf: [{ type: "number" }, { type: "null" }] },
                },
                required: ["itemName", "quantitySold", "unitPrice", "revenue"],
                additionalProperties: false,
            },
        },
    },
    required: ["items"],
    additionalProperties: false,
};

type ExtractedItem = {
    itemName: string;
    quantitySold: number;
    unitPrice: number | null;
    revenue: number | null;
};

export async function POST(request: NextRequest) {
    const auth = requireAuth(request, ["manager"]);
    if (!auth.ok) return auth.response;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: "سرویس خواندن تصویر هنوز تنظیم نشده است (کلید ANTHROPIC_API_KEY تنظیم نشده). لطفاً از اکسل/CSV استفاده کنید یا با مدیر سیستم تماس بگیرید." },
            { status: 503 }
        );
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");

    if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: "فایل عکس ارسال نشده است." }, { status: 400 });
    }

    const mediaType = file.type;
    if (!SUPPORTED_MEDIA_TYPES.has(mediaType)) {
        return NextResponse.json(
            { error: "فرمت عکس پشتیبانی نمی‌شود. فایل را به jpg، png، webp یا gif تبدیل کنید." },
            { status: 400 }
        );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const client = new Anthropic({ apiKey });

    try {
        const response = await client.messages.create({
            model: "claude-opus-4-8",
            max_tokens: 4096,
            output_config: { format: { type: "json_schema", schema: EXTRACTION_SCHEMA } },
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                                data: base64,
                            },
                        },
                        {
                            type: "text",
                            text: "این عکس گزارش پایان شیفت یک کافه در ایران است (خروجی صندوق/POS). هر آیتم فروخته‌شده را با نام فارسی دقیق، تعداد فروخته‌شده، و در صورت وجود قیمت واحد و مبلغ کل استخراج کن. اگر مقداری در عکس موجود نبود، مقدار null بگذار.",
                        },
                    ],
                },
            ],
        });

        if (response.stop_reason === "refusal") {
            return NextResponse.json({ error: "امکان خواندن این تصویر وجود نداشت." }, { status: 422 });
        }

        const textBlock = response.content.find(
            (block): block is Anthropic.TextBlock => block.type === "text"
        );

        if (!textBlock) {
            return NextResponse.json({ error: "پاسخ نامعتبر از سرویس تشخیص تصویر." }, { status: 502 });
        }

        const parsed = JSON.parse(textBlock.text) as { items: ExtractedItem[] };

        return NextResponse.json({ items: parsed.items });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? `خطا در تماس با سرویس تشخیص تصویر: ${error.message}`
                        : "خطای ناشناخته در تشخیص تصویر.",
            },
            { status: 502 }
        );
    }
}
