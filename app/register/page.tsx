import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-12">
      <section className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-[#F58220]">Registration integration pending</p>
        <h1 className="mt-3 text-3xl font-black text-[#14243A]">Account creation is temporarily unavailable on the website.</h1>
        <p className="mt-4 leading-7 text-slate-600">The deployed Firebase project does not currently provide the trusted customer-role provisioning operation required for secure web registration. Existing customers and workers can still use their GO_REPIREO mobile identity.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-xl bg-[#165DCC] px-5 py-3 font-bold text-white">Sign in</Link>
          <Link href="/contact" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700">Contact support</Link>
        </div>
      </section>
    </main>
  );
}
