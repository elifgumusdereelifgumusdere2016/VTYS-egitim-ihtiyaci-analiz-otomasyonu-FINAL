import { SignIn } from "@clerk/nextjs";
import PencilBackground from "@/components/PencilBackground";

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-pink-50 p-6">
      <PencilBackground />

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[32px] border border-white/70 bg-white/65 shadow-2xl backdrop-blur-xl md:grid-cols-2">
        <div className="p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-300 text-2xl">
              ✏️
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Eğitim Analiz
              </h1>
              <p className="text-sm text-slate-500">
                Güvenli giriş ekranı
              </p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-slate-900">
            Tekrar hoş geldin
          </h2>

          <p className="mt-4 text-slate-600">
            Eğitim ihtiyacı analiz paneline erişmek için hesabına giriş yap.
          </p>

          <div className="mt-8 rounded-3xl bg-yellow-100/70 p-5 text-sm text-slate-700">
            Çalışan verileri, değerlendirmeler ve eğitim planları giriş
            yapmadan görüntülenemez.
          </div>
        </div>

        <div className="flex items-center justify-center bg-white/50 p-8">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </main>
  );
}
