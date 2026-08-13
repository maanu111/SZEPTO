export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[28rem] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-lg font-extrabold text-ink-900">You&apos;re offline</h1>
      <p className="mt-1 text-sm leading-relaxed text-ink-500">
        Check your connection and try again. Your cart is saved on this device.
      </p>
    </div>
  );
}
