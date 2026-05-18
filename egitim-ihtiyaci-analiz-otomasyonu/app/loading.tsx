import PencilBackground from "@/components/PencilBackground";

export default function LoadingPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-pink-50 p-6">
      <PencilBackground />

      <div className="relative z-10 rounded-[36px] border border-white/70 bg-white/75 p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-6 h-14 w-14 animate-pulse rounded-2xl bg-yellow-300 shadow-lg" />
        <h1 className="text-3xl font-black text-slate-900">Yükleniyor</h1>
        <p className="mt-3 text-slate-500">
          Veriler hazırlanıyor, lütfen bekleyin.
        </p>
      </div>
    </main>
  );
}
