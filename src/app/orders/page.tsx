import type { Metadata } from "next";
import { OrdersClient } from "./OrdersClient";

export const metadata: Metadata = {
  title: "My orders",
  description: "Review your Kiranaclick orders, payment status and delivery details.",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <OrdersClient />;
}
