import AppShell from "@/components/AppShell";
import { currentUser } from "@clerk/nextjs/server";
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

export default async function AyarlarPage() {
  const user = await currentUser();
  const kullanicilar = await getAirtableRecords<KullaniciFields>("Kullanıcılar");

  const email =
    user?.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)
      ?.emailAddress ||
    user?.emailAddresses[0]?.emailAddress ||
    "";

  const airtableUser = kullanicilar.find((record) => {
    return (
      record.fields["Clerk User ID"] === user?.id ||
      record.fields["E-posta"] === email
    );
  });

  return (
    <AppShell
      allowedRoles={["Admin", "İK", "Yönetici", "Değerlendirici", "Çalışan"]}
      title="Ayarlar"
      subtitle="Kullanıcı hesabı, güvenlik ve sistem bağlantı bilgileri"
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <h3 className="mb-5 text-2xl font-black text-slate-900">
            Kullanıcı Bilgileri
          </h3>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Ad Soyad</p>
              <p className="mt-2 font-black text-slate-900">
                {formatValue(airtableUser?.fields["Ad Soyad"] || user?.fullName)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">E-posta</p>
              <p className="mt-2 font-black text-slate-900">
                {formatValue(airtableUser?.fields["E-posta"] || email)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Rol</p>
              <p className="mt-2 font-black text-slate-900">
                {formatValue(airtableUser?.fields["Rol"])}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Hesap Durumu</p>
              <p className="mt-2 font-black text-green-600">
                {airtableUser?.fields["Aktif Mi"] === false ? "Pasif" : "Aktif"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <h3 className="mb-5 text-2xl font-black text-slate-900">
            Sistem Bağlantıları
          </h3>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Kimlik Doğrulama</p>
              <p className="mt-2 font-black text-green-600">Clerk Aktif</p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Veri Kaynağı</p>
              <p className="mt-2 font-black text-green-600">Airtable Aktif</p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Kullanıcı Bağlantısı</p>
              <p className="mt-2 font-black text-slate-900">
                {airtableUser ? "Airtable profili bağlı" : "Profil bağlantısı bekliyor"}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Auth Provider</p>
              <p className="mt-2 font-black text-slate-900">
                {formatValue(airtableUser?.fields["Auth Provider"] || "Clerk")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
