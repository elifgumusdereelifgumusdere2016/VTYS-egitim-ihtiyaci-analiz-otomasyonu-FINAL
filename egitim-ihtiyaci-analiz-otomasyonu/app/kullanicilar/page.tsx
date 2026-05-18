import AppShell from "@/components/AppShell";
import KullaniciYonetimiActions from "@/components/KullaniciYonetimiActions";
import { getAirtableRecords } from "@/lib/airtable";

type KullaniciFields = {
  "Ad Soyad"?: string;
  "E-posta"?: string;
  "Rol"?: string;
  "Clerk User ID"?: string;
  "Auth Provider"?: string;
  "Aktif Mi"?: boolean;
  "Son Giriş Tarihi"?: string;
};

function formatValue(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "Bilgi yok";
  }

  return String(value);
}

function getRoleClass(role: string) {
  if (role === "Admin") return "bg-slate-900 text-white";
  if (role === "İK") return "bg-yellow-300 text-slate-900";
  if (role === "Yönetici") return "bg-blue-100 text-blue-700";
  if (role === "Değerlendirici") return "bg-purple-100 text-purple-700";
  if (role === "Çalışan") return "bg-green-100 text-green-700";

  return "bg-slate-100 text-slate-700";
}

export default async function KullanicilarPage() {
  const kullanicilar = await getAirtableRecords<KullaniciFields>("Kullanıcılar");

  const aktifSayisi = kullanicilar.filter(
    (kullanici) => kullanici.fields["Aktif Mi"] !== false
  ).length;

  const adminSayisi = kullanicilar.filter(
    (kullanici) => kullanici.fields["Rol"] === "Admin"
  ).length;

  const ikSayisi = kullanicilar.filter(
    (kullanici) => kullanici.fields["Rol"] === "İK"
  ).length;

  const siraliKullanicilar = kullanicilar.sort((a, b) => {
    const nameA = a.fields["Ad Soyad"] || "";
    const nameB = b.fields["Ad Soyad"] || "";

    return nameA.localeCompare(nameB, "tr");
  });

  return (
    <AppShell
      allowedRoles={["Admin", "İK"]}
      title="Kullanıcı Yönetimi"
      subtitle="Kullanıcı rollerini, hesap durumlarını ve sistem erişimlerini yönetin"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Toplam Kullanıcı</p>
          <p className="mt-2 text-3xl font-black text-yellow-600">
            {kullanicilar.length}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Aktif Kullanıcı</p>
          <p className="mt-2 text-3xl font-black text-green-600">
            {aktifSayisi}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Admin</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {adminSayisi}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">İK</p>
          <p className="mt-2 text-3xl font-black text-amber-600">
            {ikSayisi}
          </p>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
        <h3 className="mb-6 text-2xl font-black text-slate-900">
          Kullanıcı Listesi
        </h3>

        {siraliKullanicilar.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 p-5 text-sm font-medium text-slate-500">
            Kullanıcı kaydı bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {siraliKullanicilar.map((kullanici) => {
              const role = formatValue(kullanici.fields["Rol"]);
              const active = kullanici.fields["Aktif Mi"] !== false;

              return (
                <div
                  key={kullanici.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">
                        {formatValue(kullanici.fields["Ad Soyad"])}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatValue(kullanici.fields["E-posta"])}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getRoleClass(
                          role
                        )}`}
                      >
                        {role}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {active ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-500">Auth Provider</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {formatValue(kullanici.fields["Auth Provider"])}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-500">Son Giriş</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {formatValue(kullanici.fields["Son Giriş Tarihi"])}
                      </p>
                    </div>
                  </div>

                  <KullaniciYonetimiActions
                    recordId={kullanici.id}
                    currentRole={role === "Bilgi yok" ? "Çalışan" : role}
                    currentActive={active}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
