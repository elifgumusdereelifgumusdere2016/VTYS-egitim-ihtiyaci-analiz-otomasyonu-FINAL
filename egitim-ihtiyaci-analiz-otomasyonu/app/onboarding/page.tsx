import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PencilBackground from "@/components/PencilBackground";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const defaultName =
    user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    "Yeni Kullanıcı";

  const defaultEmail =
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
      ?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-pink-50 p-6 text-slate-900">
      <PencilBackground />

      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[36px] border border-white/70 bg-white/65 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        <section className="p-10 lg:p-12">
          <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300 text-3xl shadow-lg">
            ✏️
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Çalışma rolünü ayarla
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            Platformu nasıl kullanacağını seç. Bu seçim dashboard ekranını,
            erişim yetkilerini ve işlem seçeneklerini belirlemek için kullanılır.
          </p>

          <div className="mt-8 rounded-3xl bg-white/65 p-5 shadow-sm backdrop-blur">
            <p className="font-bold text-slate-900">Sonra ne olacak?</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Clerk hesabın Airtable kullanıcı tablosuna bağlanacak. Sonraki
              aşamada yetkiler bu role göre yönetilecek.
            </p>
          </div>
        </section>

        <section className="bg-white/40 p-8 lg:p-12">
          <OnboardingForm defaultName={defaultName} defaultEmail={defaultEmail} />
        </section>
      </div>
    </main>
  );
}
