export function InviteShell({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <section className="mx-auto mt-16 w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Aloyz daveti</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
      </section>
    </main>
  );
}
