import { redirect } from "next/navigation";

export default function LegacyManagerTasksPage() {
    redirect("/manager/orders");
}
