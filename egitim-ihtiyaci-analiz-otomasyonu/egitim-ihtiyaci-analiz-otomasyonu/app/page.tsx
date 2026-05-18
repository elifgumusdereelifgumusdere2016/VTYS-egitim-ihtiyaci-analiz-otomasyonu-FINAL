import PencilBackground from "@/components/PencilBackground";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-pink-50 text-slate-900">
      <PencilBackground />

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-300 text-2xl shadow-lg">
            ✏️
          </div>

          <div>
            <h1 className="text-xl font-bold">Eğitim Analiz</h1>
            <p className="text-xs text-slate-500">
              Eğitim İhtiyacı Analiz Otomasyonu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/sign-in"
            className="rounded-full border border-yellow-200 bg-white/75 px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white"
          >
            Giriş Yap
          </a>

          <a
            href="/sign-up"
            className="rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-6 py-2 text-sm font-bold text-slate-900 shadow-lg shadow-yellow-200 transition hover:from-yellow-200 hover:to-yellow-300"
          >
            Kayıt Ol
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-5xl flex-col items-center justify-center px-8 pb-16 text-center">
        <div className="rounded-[44px] border border-white/70 bg-white/60 p-10 shadow-2xl backdrop-blur-xl md:p-14">
          <h2 className="text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Eğitim ihtiyacını
            <span className="block bg-gradient-to-r from-yellow-500 via-yellow-400 to-pink-500 bg-clip-text text-transparent">
              akıllıca analiz et.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Çalışan değerlendirmelerini takip eden, yetkinlik eksiklerini
            analiz eden, eğitim önerileri oluşturan ve eğitim planlarını
            yöneten modern bir İK otomasyon sistemi.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a
              href="/sign-up"
              className="rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-8 py-4 font-bold text-slate-900 shadow-xl shadow-yellow-200 transition hover:from-yellow-200 hover:to-yellow-300"
            >
              Hesap Oluştur
            </a>

            <a
              href="/sign-in"
              className="rounded-full border border-slate-200 bg-white/80 px-8 py-4 font-bold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white"
            >
              Giriş Yap
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white/65 p-5 shadow-sm backdrop-blur">
              <p className="text-3xl font-black text-yellow-600">10+</p>
              <p className="mt-1 text-sm text-slate-500">Çalışan Kaydı</p>
            </div>

            <div className="rounded-3xl bg-white/65 p-5 shadow-sm backdrop-blur">
              <p className="text-3xl font-black text-pink-500">8</p>
              <p className="mt-1 text-sm text-slate-500">Değerlendirme</p>
            </div>

            <div className="rounded-3xl bg-white/65 p-5 shadow-sm backdrop-blur">
              <p className="text-3xl font-black text-slate-900">5</p>
              <p className="mt-1 text-sm text-slate-500">Eğitim Planı</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
