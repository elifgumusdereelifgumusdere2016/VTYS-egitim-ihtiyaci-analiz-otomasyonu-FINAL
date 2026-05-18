import Link from "next/link";
import PencilBackground from "@/components/PencilBackground";

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-pink-50 p-6">
      <PencilBackground />

      <div className="relative z-10 max-w-xl rounded-[36px] border border-white/70 bg-white/80 p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-300 text-3xl font-black text-slate-900">
          404
        </div>

        <h1 className="text-3xl font-black text-slate-900">
          Sayfa bulunamadı
        </h1>

        <p className="mt-3 text-slate-500">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-8 py-3 font-black text-slate-900 shadow-lg shadow-yellow-200 transition hover:from-yellow-200 hover:to-yellow-300"
        >
          Ana Panele Dön
        </Link>
      </div>
    </main>
  );
}
