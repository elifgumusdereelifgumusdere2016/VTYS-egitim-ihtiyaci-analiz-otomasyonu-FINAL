import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import ThemeDecorations from "@/components/ThemeDecorations";
import {
  getCurrentAppUser,
  roleCanAccess,
  type KullaniciRolu,
} from "@/lib/yetki";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  allowedRoles?: KullaniciRolu[];
};

function getRoleBadgeClass(role: string) {
  if (role === "Admin") {
    return "bg-slate-900 text-white";
  }

  if (role === "İK") {
    return "bg-yellow-300 text-slate-900";
  }

  if (role === "Yönetici") {
    return "bg-blue-100 text-blue-700";
  }

  if (role === "Değerlendirici") {
    return "bg-purple-100 text-purple-700";
  }

  if (role === "Çalışan") {
    return "bg-green-100 text-green-700";
  }

  return "bg-slate-100 text-slate-700";
}

function YetkiYokCard() {
  return (
    <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl font-black text-red-700">
        !
      </div>

      <h3 className="text-3xl font-black text-slate-900">
        Erişim Yetkiniz Yok
      </h3>

      <p className="mt-3 max-w-2xl text-slate-500">
        Bu sayfayı görüntülemek için gerekli kullanıcı rolüne sahip değilsiniz.
        Yetki değişikliği gerekiyorsa sistem yöneticinizle iletişime geçin.
      </p>
    </div>
  );
}

export default async function AppShell({
  title,
  subtitle,
  children,
  allowedRoles,
}: AppShellProps) {
  const appUser = await getCurrentAppUser();

  const hasAccess = allowedRoles
    ? roleCanAccess(appUser.role, allowedRoles) && appUser.active
    : appUser.active;

  return (
    <main className="theme-bg">
      <ThemeDecorations />

      <div className="relative z-10 flex">
        <Sidebar role={appUser.role} />

        <section className="flex-1 p-8 md:p-10">
          <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                {title}
              </h2>
              <p className="section-subtitle mt-2 text-base">{subtitle}</p>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/75 px-5 py-4 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold text-slate-500">
                Aktif Kullanıcı
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-black text-slate-900">
                  {appUser.name}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${getRoleBadgeClass(
                    appUser.role
                  )}`}
                >
                  {appUser.role}
                </span>
              </div>
            </div>
          </div>

          {hasAccess ? children : <YetkiYokCard />}
        </section>
      </div>
    </main>
  );
}
