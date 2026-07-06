export type SendSmsResult =
    | { status: "sent" }
    | { status: "not_configured" }
    | { status: "error"; message: string };

const SMS_PROVIDER = process.env.SMS_PROVIDER;
const SMS_API_KEY = process.env.SMS_API_KEY;

export function isSmsConfigured() {
    return Boolean(SMS_PROVIDER && SMS_API_KEY);
}

/**
 * Adapter boundary: once an SMS provider is chosen (Kavenegar, Melipayamak,
 * ...), this is the only function that needs a real implementation — call
 * the provider's send-SMS endpoint here using SMS_PROVIDER/SMS_API_KEY (and
 * any provider-specific env vars, e.g. sender line number).
 */
export async function sendSms(phone: string, message: string): Promise<SendSmsResult> {
    if (!isSmsConfigured()) {
        return { status: "not_configured" };
    }

    try {
        // TODO: replace with a real call to the chosen SMS provider.
        void phone;
        void message;
        return { status: "error", message: "سرویس پیامک هنوز به یک ارائه‌دهنده وصل نشده است." };
    } catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : "خطای ناشناخته در ارسال پیامک.",
        };
    }
}
