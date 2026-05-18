import { SignUp } from "@clerk/nextjs";
import PencilBackground from "@/components/PencilBackground";

export default function SignUpPage() {
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
                Yeni kullanıcı kaydı
              </p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-slate-900">
            Hesap oluştur
          </h2>

          <p className="mt-4 text-slate-600">
            Sistemi kullanmak için güvenli bir hesap oluştur.
          </p>

          <div className="mt-8 rounded-3xl bg-yellow-100/70 p-5 text-sm text-slate-700">
            Kayıttan sonra rolünü seçmen için onboarding ekranına
            yönlendirileceksin.
          </div>
        </div>

        <div className="flex items-center justify-center bg-white/50 p-8">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/onboarding"
            forceRedirectUrl="/onboarding"
          />
        </div>
      </div>
    </main>
  );
}
