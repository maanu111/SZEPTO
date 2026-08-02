import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your order, pay by UPI and upload your payment screenshot.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
