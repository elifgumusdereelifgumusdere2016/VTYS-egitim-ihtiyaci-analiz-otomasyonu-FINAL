import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getAirtableRecords } from "@/lib/airtable";
import { getCurrentAppUser } from "@/lib/yetki";

type AnyFields = Record<string, unknown>;

type AirtableLikeRecord = {
  id: string;
  fields: AnyFields;
};

function normalize(value: unknown) {
  return String(value || "").trim().toLocaleLowerCase("tr-TR");
}

function getArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "Bilgi yok";
  }

  return String(value);
}

function getReadableRecordName(record: AirtableLikeRecord, fields: string[]) {
  for (const field of fields) {
    const value = record.fields[field];

    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  const firstText = Object.values(record.fields).find((value) => {
    return typeof value === "string" && value.trim() !== "";
  });

  return typeof firstText === "string" ? firstText : record.id;
}

function createNameMap(records: AirtableLikeRecord[], fields: string[]) {
  const map = new Map<string, string>();

  records.forEach((record) => {
    map.set(record.id, getReadableRecordName(record, fields));
  });

  return map;
}

function linkedNames(ids: unknown, map: Map<string, string>) {
  const array = getArray(ids);

  if (array.length === 0) {
    return "Bilgi yok";
  }

  return array.map((id) => map.get(id) || id).join(", ");
}

function notificationClass(type: string) {
  if (type === "danger") return "border-red-100 bg-red-50";
  if (type === "success") return "border-green-100 bg-green-50";
  if (type === "info") return "border-blue-100 bg-blue-50";

  return "border-yellow-100 bg-yellow-50";
}

function badgeClass(type: string) {
  if (type === "danger") return "bg-red-100 text-red-700";
  if (type === "success") return "bg-green-100 text-green-700";
  if (type === "info") return "bg-blue-100 text-blue-700";

  return "bg-yellow-100 text-yellow-800";
}

export default async function BildirimlerPage() {
  const appUser = await getCurrentAppUser();

  const [
    calisanlar,
    egitimOnerileri,
    egitimler,
    kriterler,
    egitimPlanlari,
    katilimcilar,
  ] = await Promise.all([
    getAirtableRecords<AnyFields>("Çalışanlar"),
    getAirtableRecords<AnyFields>("Eğitim Önerileri"),
    getAirtableRecords<AnyFields>("Eğitimler"),
    getAirtableRecords<AnyFields>("Yetkinlik Kriterleri"),
    getAirtableRecords<AnyFields>("Eğitim Planları"),
    getAirtableRecords<AnyFields>("Eğitim Planı Katılımcıları"),
  ]);

  const egitimMap = createNameMap(egitimler, ["Eğitim Adı", "Name", "Ad"]);
  const kriterMap = createNameMap(kriterler, ["Kriter Adı", "Name", "Ad"]);
  const planMap = createNameMap(egitimPlanlari, ["Plan Adı", "Name", "Ad"]);

  const currentEmployee = calisanlar.find((calisan) => {
    const emailMatch =
      normalize(calisan.fields["E-posta"]) === normalize(appUser.email);

    const userLinkMatch =
      appUser.airtableRecordId &&
      getArray(calisan.fields["Kullanıcı Hesabı"]).includes(
        appUser.airtableRecordId
      );

    return emailMatch || userLinkMatch;
  });

  const employeeId = currentEmployee?.id || "";

  const yonetimBildirimleri =
    appUser.role === "Admin" ||
    appUser.role === "İK" ||
    appUser.role === "Yönetici";

  const bekleyenOneriler = yonetimBildirimleri
    ? egitimOnerileri.filter((record) => {
        const durum = String(record.fields["Durum"] || "");
        return (
          record.fields["Frontend Visible"] !== false &&
          record.fields["API Status"] !== "Archived" &&
          (durum === "Önerildi" || durum === "Onay Bekliyor")
        );
      })
    : [];

  const yuksekOncelikliOneriler = yonetimBildirimleri
    ? egitimOnerileri.filter((record) => {
        return (
          record.fields["Frontend Visible"] !== false &&
          record.fields["API Status"] !== "Archived" &&
          record.fields["Öncelik"] === "Yüksek"
        );
      })
    : [];

  const kullaniciKatilimlari = employeeId
    ? katilimcilar.filter((record) =>
        getArray(record.fields["Çalışan"]).includes(employeeId)
      )
    : [];

  const katilimBekleyenler = kullaniciKatilimlari.filter((record) => {
    const durum = String(record.fields["Katılım Durumu"] || "");
    return durum === "Davet Edildi" || durum === "Bekliyor" || !durum;
  });

  const tamamlanmamisEgitimler = kullaniciKatilimlari.filter((record) => {
    const durum = String(record.fields["Tamamlama Durumu"] || "");
    return durum !== "Tamamlandı";
  });

  const notifications = [
    ...bekleyenOneriler.map((record) => ({
      id: `oneri-${record.id}`,
      type: "warning",
      title: "Onay bekleyen eğitim önerisi",
      description: `${linkedNames(
        record.fields["Önerilen Eğitim"],
        egitimMap
      )} önerisi için karar bekleniyor.`,
      detail: `Kriter: ${linkedNames(record.fields["Kriter"], kriterMap)}`,
      href: "/egitim-onerileri",
      action: "Önerilere Git",
    })),

    ...yuksekOncelikliOneriler.map((record) => ({
      id: `high-${record.id}`,
      type: "danger",
      title: "Yüksek öncelikli eğitim ihtiyacı",
      description: `${linkedNames(
        record.fields["Önerilen Eğitim"],
        egitimMap
      )} yüksek öncelikli olarak işaretlendi.`,
      detail: `Durum: ${formatValue(record.fields["Durum"])}`,
      href: "/egitim-onerileri",
      action: "İncele",
    })),

    ...katilimBekleyenler.map((record) => ({
      id: `katilim-${record.id}`,
      type: "info",
      title: "Katılım yanıtı bekleyen eğitim",
      description: `${linkedNames(
        record.fields["Eğitim Planı"],
        planMap
      )} için katılım durumunuzu güncelleyin.`,
      detail: `Katılım Durumu: ${formatValue(record.fields["Katılım Durumu"])}`,
      href: "/profilim",
      action: "Profilime Git",
    })),

    ...tamamlanmamisEgitimler.map((record) => ({
      id: `tamamlama-${record.id}`,
      type: "success",
      title: "Tamamlama durumu bekleyen eğitim",
      description: `${linkedNames(
        record.fields["Eğitim Planı"],
        planMap
      )} eğitimi için tamamlanma durumunuzu kontrol edin.`,
      detail: `Tamamlama Durumu: ${formatValue(
        record.fields["Tamamlama Durumu"]
      )}`,
      href: "/profilim",
      action: "Güncelle",
    })),
  ];

  return (
    <AppShell
      allowedRoles={["Admin", "İK", "Yönetici", "Değerlendirici", "Çalışan"]}
      title="Bildirimler"
      subtitle="Bekleyen işlemler, eğitim görevleri ve önemli hatırlatmalar"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Toplam Bildirim</p>
          <p className="mt-2 text-3xl font-black text-yellow-600">
            {notifications.length}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Bekleyen Öneri</p>
          <p className="mt-2 text-3xl font-black text-red-600">
            {bekleyenOneriler.length}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Katılım Bekleyen</p>
          <p className="mt-2 text-3xl font-black text-blue-600">
            {katilimBekleyenler.length}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Tamamlanmamış Eğitim</p>
          <p className="mt-2 text-3xl font-black text-green-600">
            {tamamlanmamisEgitimler.length}
          </p>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
        <h3 className="mb-6 text-2xl font-black text-slate-900">
          Bildirim Listesi
        </h3>

        {notifications.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 p-5 text-sm font-medium text-slate-500">
            Şu anda bekleyen bildiriminiz bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-3xl border p-5 shadow-sm ${notificationClass(
                  item.type
                )}`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass(
                      item.type
                    )}`}
                  >
                    Aktif
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-500">
                  {item.detail}
                </p>

                <Link
                  href={item.href}
                  className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-yellow-400 hover:text-slate-900"
                >
                  {item.action}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
