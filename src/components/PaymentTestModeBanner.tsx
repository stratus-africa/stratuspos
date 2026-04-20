const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;

export function PaymentTestModeBanner() {
  if (!publicKey?.startsWith("pk_test_")) return null;

  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800">
      Paystack is in <strong>test mode</strong>. Use Paystack test cards — no real money will be charged.
    </div>
  );
}
