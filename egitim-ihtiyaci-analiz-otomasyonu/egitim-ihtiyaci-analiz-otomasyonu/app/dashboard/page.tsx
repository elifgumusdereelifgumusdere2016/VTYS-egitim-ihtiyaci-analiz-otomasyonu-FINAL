import AppShell from "@/components/AppShell";
import { currentUser } from "@clerk/nextjs/server";
import { getAirtableRecords } from "@/lib/airtable";

type AnyFields = Record<string, unknown>;

type CalisanFields = {
  "Ad Soyad"?: string;
  "Durum"?: string;
  "Eğitim İhtiyacı Var Mı"?: string;
};

type DegerlendirmeFields = {
  "Durum"?: string;
  "Genel Puan"?: number | string;
};

type EgitimOnerisiFields = {
  "Önerilen Eğitim"?: string[];
  "Kriter"?: string[];
  "Öncelik"?: string;
  "Durum"?: string;
  "Frontend Visible"?: boolean;
  "API Status"?: string;
};

type EgitimPlaniFields = {
  "Durum"?: string;
  "Frontend Visible"?: boolean;
  "API Status"?: string;
};

function normalize(value: unknown) {
  return String(value || "").toLocaleLowerCase("tr-TR");
}

function toSafeNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getReadableRecordName(record: { id: string; fields: AnyFields }, fields: string[]) {
  for (const field of fields) {
    const value = record.fields[field];

    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  return record.id;
}

function createNameMap(records: { id: string; fields: AnyFields }[], fields: string[]) {
  const map = new Map<string, string>();

  records.forEach((record) => {
    map.set(record.id, getReadableRecordName(record, fields));
  });

  return map;
}

function linkedNames(ids: string[] | undefined, map: Map<string, string>) {
  if (!ids || ids.length === 0) {
    return "Bilgi yok";
  }

  return ids.map((id) => map.get(id) || id).join(", ");
}

export default async function DashboardPage() {
  const user = await currentUser();

  const [
    calisanlar,
    degerlendirmeler,
    egitimOnerileri,
    egitimPlanlari,
    egitimler,
    kriterler,
  ] = await Promise.all([
    getAirtableRecords<CalisanFields>("Çalışanlar"),
    getAirtableRecords<DegerlendirmeFields>("Değerlendirmeler"),
    getAirtableRecords<EgitimOnerisiFields>("Eğitim Önerileri"),
    getAirtableRecords<EgitimPlaniFields>("Eğitim Planları"),
    getAirtableRecords<AnyFields>("Eğitimler"),
    getAirtableRecords<AnyFields>("Yetkinlik Kriterleri"),
  ]);

  const egitimMap = createNameMap(egitimler, ["Eğitim Adı", "Name", "Ad"]);
  const kriterMap = createNameMap(kriterler, ["Kriter Adı", "Name", "Ad"]);

  const tamamlananDegerlendirmeSayisi = degerlendirmeler.filter(
    (record) =>
      normalize(record.fields["Durum"]).includes("tamam") ||
      toSafeNumber(record.fields["Genel Puan"]) !== null
  ).length;

  const aktifOneriler = egitimOnerileri.filter((record) => {
    return (
      record.fields["Frontend Visible"] !== false &&
      record.fields["API Status"] !== "Archived"
    );
  });

  const aktifOneriSayisi = aktifOneriler.length;

  const planlananEgitimSayisi = egitimPlanlari.filter((record) => {
    return (
      record.fields["Frontend Visible"] !== false &&
      record.fields["API Status"] !== "Archived" &&
      Boolean(record.fields["Durum"])
    );
  }).length;

  const egitimIhtiyaciOlanCalisanSayisi = calisanlar.filter((record) => {
    const text = normalize(record.fields["Eğitim İhtiyacı Var Mı"]);
    return text.includes("evet") || text.includes("var") || text.includes("ihtiyaç");
  }).length;

  const oncelikliOneriler = aktifOneriler
    .filter((record) => record.fields["Öncelik"] === "Yüksek")
    .slice(0, 5);

  return (
    <AppShell
      allowedRoles={["Admin", "İK", "Yönetici", "Değerlendirici", "Çalışan"]}
      title="Ana Panel"
      subtitle={`Hoş geldin ${user?.firstName || "Kullanıcı"}! Eğitim ihtiyacı analiz paneli`}
    >
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card p-6">
          <p className="text-sm text-slate-500">Toplam Çalışan</p>
          <h3 className="metric-number mt-3 text-4xl font-extrabold">
            {calisanlar.length}
          </h3>
        </div>

        <div className="glass-card p-6">
          <p className="text-sm text-slate-500">Tamamlanan Değerlendirme</p>
          <h3 className="metric-number mt-3 text-4xl font-extrabold">
            {tamamlananDegerlendirmeSayisi}
          </h3>
        </div>

        <div className="glass-card p-6">
          <p className="text-sm text-slate-500">Aktif Eğitim Önerisi</p>
          <h3 className="metric-number mt-3 text-4xl font-extrabold">
            {aktifOneriSayisi}
          </h3>
        </div>

        <div className="glass-card p-6">
          <p className="text-sm text-slate-500">Eğitim İhtiyacı Olan</p>
          <h3 className="metric-number mt-3 text-4xl font-extrabold">
            {egitimIhtiyaciOlanCalisanSayisi}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="glass-card-strong p-6">
          <h3 className="mb-4 text-xl font-semibold text-slate-900">
            Yüksek Öncelikli Eğitim Önerileri
          </h3>

          {oncelikliOneriler.length === 0 ? (
            <div className="rounded-2xl border border-white/60 bg-white/40 p-4">
              <p className="font-medium text-slate-900">
                Yüksek öncelikli öneri bulunmuyor.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Yeni değerlendirme sonuçlarına göre öneriler burada görüntülenir.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {oncelikliOneriler.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-white/60 bg-white/40 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="font-medium text-slate-900">
                      {linkedNames(record.fields["Önerilen Eğitim"], egitimMap)}
                    </p>

                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                      {record.fields["Öncelik"] || "Öncelik yok"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500">
                    Durum: {record.fields["Durum"] || "Bilgi yok"}
                  </p>

                  <p className="text-sm text-slate-500">
                    Kriter: {linkedNames(record.fields["Kriter"], kriterMap)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card-strong p-6">
          <h3 className="mb-4 text-xl font-semibold text-slate-900">
            Eğitim Süreci Özeti
          </h3>

          <div className="space-y-4 text-sm">
            <div className="soft-line flex justify-between border-b pb-2">
              <span>Aktif Öneriler</span>
              <span className="font-semibold text-slate-900">{aktifOneriSayisi}</span>
            </div>

            <div className="soft-line flex justify-between border-b pb-2">
              <span>Eğitim Planları</span>
              <span className="font-semibold text-slate-900">
                {planlananEgitimSayisi}
              </span>
            </div>

            <div className="soft-line flex justify-between border-b pb-2">
              <span>Değerlendirme Kapsamı</span>
              <span className="font-semibold text-slate-900">
                {tamamlananDegerlendirmeSayisi}/{degerlendirmeler.length}
              </span>
            </div>

            <div className="soft-line flex justify-between border-b pb-2">
              <span>Veri Kaynağı</span>
              <span className="status-ready font-semibold">Airtable</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
