"use client";

import PencilBackground from "@/components/PencilBackground";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-pink-50 p-6">
      <PencilBackground />

      <div className="relative z-10 max-w-xl rounded-[36px] border border-white/70 bg-white/80 p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl">
          !
        </div>

        <h1 className="text-3xl font-black text-slate-900">
          Bir hata oluştu
        </h1>

        <p className="mt-3 text-slate-500">
          Sayfa yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-8 py-3 font-black text-slate-900 shadow-lg shadow-yellow-200 transition hover:from-yellow-200 hover:to-yellow-300"
        >
          Tekrar Dene
        </button>
      </div>
    </main>
  );
}
