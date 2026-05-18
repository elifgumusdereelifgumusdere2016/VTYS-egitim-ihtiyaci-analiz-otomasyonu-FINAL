"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type Role =
  | "Admin"
  | "İK"
  | "Yönetici"
  | "Değerlendirici"
  | "Çalışan"
  | "Misafir";

type MenuItem = {
  href: string;
  label: string;
  allowedRoles: Role[];
};

const menuItems: MenuItem[] = [
  {
    href: "/dashboard",
    label: "Ana Panel",
    allowedRoles: ["Admin", "İK", "Yönetici", "Değerlendirici", "Çalışan"],
  },
  {
    href: "/profilim",
    label: "Profilim",
    allowedRoles: ["Admin", "İK", "Yönetici", "Değerlendirici", "Çalışan"],
  },
  {
    href: "/bildirimler",
    label: "Bildirimler",
    allowedRoles: ["Admin", "İK", "Yönetici", "Değerlendirici", "Çalışan"],
  },
  {
    href: "/kullanicilar",
    label: "Kullanıcı Yönetimi",
    allowedRoles: ["Admin", "İK"],
  },
  {
    href: "/calisanlar",
    label: "Çalışan Yönetimi",
    allowedRoles: ["Admin", "İK", "Yönetici", "Değerlendirici"],
  },
  {
    href: "/degerlendirmeler",
    label: "Değerlendirme Detayları",
    allowedRoles: ["Admin", "İK", "Yönetici", "Değerlendirici"],
  },
  {
    href: "/egitim-onerileri",
    label: "Eğitim Önerileri",
    allowedRoles: ["Admin", "İK", "Yönetici"],
  },
  {
    href: "/egitim-planlari",
    label: "Eğitim Planları",
    allowedRoles: ["Admin", "İK"],
  },
  {
    href: "/raporlar",
    label: "Raporlar",
    allowedRoles: ["Admin", "İK", "Yönetici"],
  },
  {
    href: "/ayarlar",
    label: "Ayarlar",
    allowedRoles: ["Admin", "İK", "Yönetici", "Değerlendirici", "Çalışan"],
  },
];

type SidebarProps = {
  role: Role;
};

function canSeeMenu(role: Role, allowedRoles: Role[]) {
  if (role === "Admin") {
    return true;
  }

  return allowedRoles.includes(role);
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const visibleMenuItems = menuItems.filter((item) =>
    canSeeMenu(role, item.allowedRoles)
  );

  return (
    <aside className="glass-sidebar relative z-10 min-h-screen w-72 p-6">
      <div className="logo-chip mb-8 rounded-[28px] p-4">
        <div className="flex items-center gap-3">
          <Image
            src="/pencil.png"
            alt="Kalem Logo"
            width={52}
            height={52}
            style={{ width: "52px", height: "auto" }}
            className="drop-shadow-md"
          />

          <div>
            <h1 className="text-lg font-bold text-slate-900">Eğitim Analiz</h1>
            <p className="text-xs text-slate-500">Güvenli HR Panel</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2 text-sm">
        {visibleMenuItems.map((item) => {
          const aktifMi =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`menu-item ${aktifMi ? "menu-item-active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="glass-card mt-8 p-4 text-sm">
        <p className="font-semibold text-slate-800">Rol</p>
        <p className="mt-2 font-black text-slate-900">{role}</p>

        <Link
          href="/"
          className="mt-4 block rounded-2xl bg-white/60 px-4 py-3 text-center font-medium text-slate-700 hover:bg-white"
        >
          Ana Sayfa
        </Link>
      </div>
    </aside>
  );
}
