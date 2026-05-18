import AppShell from "@/components/AppShell";
import EgitimPlaniActions from "@/components/EgitimPlaniActions";
import YeniEgitimPlaniForm from "@/components/YeniEgitimPlaniForm";
import EgitimPlaniKatilimciYonetimi from "@/components/EgitimPlaniKatilimciYonetimi";
import { getAirtableRecords } from "@/lib/airtable";

type AnyFields = Record<string, unknown>;

type AirtableLikeRecord = {
  id: string;
  fields: AnyFields;
};

type EgitimPlaniFields = {
  "Plan Adı"?: string;
  "Eğitim"?: string[];
  "Sorumlu Kişi"?: string[];
  "Başlangıç Tarihi"?: string;
  "Bitiş Tarihi"?: string;
  "Durum"?: string;
  "Katılımcılar"?: string[];
  "Katılımcı Sayısı"?: number;
  "İlgili Öneriler"?: string[];
  "Açıklama"?: string;
  "Frontend Visible"?: boolean;
  "API Status"?: string;
};

type KatilimciFields = {
  "Eğitim Planı"?: string[];
  "Çalışan"?: string[];
  "Katılım Durumu"?: string;
  "Tamamlama Durumu"?: string;
  "Sertifika Verildi Mi"?: boolean;
};

function formatValue(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "Bilgi yok";
  }

  return String(value);
}

function getReadableRecordName(record: AirtableLikeRecord, preferredFields: string[]) {
  for (const fieldName of preferredFields) {
    const value = record.fields[fieldName];

    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  const allValues = Object.values(record.fields);

  const firstReadableString = allValues.find((value) => {
    if (typeof value !== "string") {
      return false;
    }

    const text = value.trim();

    if (!text) {
      return false;
    }

    const ignoredValues = [
      "Ready",
      "Draft",
      "Archived",
      "Planlandı",
      "Devam Ediyor",
      "Tamamlandı",
      "İptal Edildi",
      "Aktif",
      "Pasif",
      "İzinli",
    ];

    return !ignoredValues.includes(text);
  });

  if (typeof firstReadableString === "string") {
    return firstReadableString;
  }

  return record.id;
}

function createNameMap(
  records: AirtableLikeRecord[],
  preferredFields: string[]
) {
  const map = new Map<string, string>();

  records.forEach((record) => {
    map.set(record.id, getReadableRecordName(record, preferredFields));
  });

  return map;
}

function linkedNames(ids: string[] | undefined, map: Map<string, string>) {
  if (!ids || ids.length === 0) {
    return "Bilgi yok";
  }

  return ids.map((id) => map.get(id) || id).join(", ");
}

function getDurumClass(durum: string) {
  if (durum === "Tamamlandı") {
    return "bg-green-100 text-green-700";
  }

  if (durum === "Devam Ediyor") {
    return "bg-blue-100 text-blue-700";
  }

  if (durum === "Planlandı") {
    return "bg-amber-100 text-amber-800";
  }

  if (durum === "İptal Edildi") {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getDurumWeight(durum: string) {
  if (durum === "Devam Ediyor") return 4;
  if (durum === "Planlandı") return 3;
  if (durum === "Tamamlandı") return 2;
  if (durum === "İptal Edildi") return 1;
  return 0;
}

function hasUsefulPlanData(plan: { fields: EgitimPlaniFields }) {
  const fields = plan.fields;

  return Boolean(
    fields["Plan Adı"] ||
      fields["Eğitim"]?.length ||
      fields["Sorumlu Kişi"]?.length ||
      fields["Başlangıç Tarihi"] ||
      fields["Bitiş Tarihi"] ||
      fields["Açıklama"]
  );
}

function getPlanTitle(
  plan: { id: string; fields: EgitimPlaniFields },
  egitimMap: Map<string, string>
) {
  if (plan.fields["Plan Adı"]) {
    return plan.fields["Plan Adı"];
  }

  if (plan.fields["Eğitim"]?.length) {
    return linkedNames(plan.fields["Eğitim"], egitimMap);
  }

  return `Eğitim Planı`;
}

export default async function EgitimPlanlariPage() {
  const [planlar, egitimler, kullanicilar, katilimcilar, calisanlar] =
    await Promise.all([
      getAirtableRecords<EgitimPlaniFields>("Eğitim Planları"),
      getAirtableRecords<AnyFields>("Eğitimler"),
      getAirtableRecords<AnyFields>("Kullanıcılar"),
      getAirtableRecords<KatilimciFields>("Eğitim Planı Katılımcıları"),
      getAirtableRecords<AnyFields>("Çalışanlar"),
    ]);

  const egitimMap = createNameMap(egitimler, [
    "Eğitim Adı",
    "Name",
    "Training Name",
    "Ad",
  ]);

  const kullaniciMap = createNameMap(kullanicilar, [
    "Ad Soyad",
    "Name",
    "Full Name",
    "Kullanıcı",
  ]);

  const calisanMap = createNameMap(calisanlar, [
    "Ad Soyad",
    "Name",
    "Full Name",
    "Çalışan",
  ]);

  const calisanOptions = calisanlar.map((calisan) => ({
    id: calisan.id,
    label: getReadableRecordName(calisan, [
      "Ad Soyad",
      "Name",
      "Full Name",
      "Çalışan",
    ]),
  }));

  const egitimOptions = egitimler.map((egitim) => ({
    id: egitim.id,
    label: getReadableRecordName(egitim, [
      "Eğitim Adı",
      "Name",
      "Training Name",
      "Ad",
    ]),
  }));

  const kullaniciOptions = kullanicilar.map((kullanici) => ({
    id: kullanici.id,
    label: getReadableRecordName(kullanici, [
      "Ad Soyad",
      "Name",
      "Full Name",
      "Kullanıcı",
    ]),
  }));

  const gosterilecekPlanlar = planlar
    .filter((plan) => hasUsefulPlanData(plan))
    .sort((a, b) => {
      const durumFarki =
        getDurumWeight(b.fields["Durum"] || "") -
        getDurumWeight(a.fields["Durum"] || "");

      if (durumFarki !== 0) {
        return durumFarki;
      }

      const tarihA = a.fields["Başlangıç Tarihi"] || "";
      const tarihB = b.fields["Başlangıç Tarihi"] || "";

      return tarihA.localeCompare(tarihB);
    });

  const planlananSayisi = gosterilecekPlanlar.filter(
    (plan) => plan.fields["Durum"] === "Planlandı"
  ).length;

  const devamEdenSayisi = gosterilecekPlanlar.filter(
    (plan) => plan.fields["Durum"] === "Devam Ediyor"
  ).length;

  const tamamlananSayisi = gosterilecekPlanlar.filter(
    (plan) => plan.fields["Durum"] === "Tamamlandı"
  ).length;

  function getPlanKatilimcilari(planId: string) {
    return katilimcilar.filter((katilimci) => {
      return katilimci.fields["Eğitim Planı"]?.includes(planId);
    });
  }

  return (
    <AppShell
      title="Eğitim Planları"
      subtitle="Planlanan, devam eden ve tamamlanan eğitimleri yönetin"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Toplam Plan</p>
          <p className="mt-2 text-3xl font-black text-yellow-600">
            {gosterilecekPlanlar.length}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Planlandı</p>
          <p className="mt-2 text-3xl font-black text-amber-600">
            {planlananSayisi}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Devam Ediyor</p>
          <p className="mt-2 text-3xl font-black text-blue-600">
            {devamEdenSayisi}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Tamamlandı</p>
          <p className="mt-2 text-3xl font-black text-green-600">
            {tamamlananSayisi}
          </p>
        </div>
      </div>

      <YeniEgitimPlaniForm
        egitimler={egitimOptions}
        kullanicilar={kullaniciOptions}
      />

      {gosterilecekPlanlar.length === 0 ? (
        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 text-sm font-medium text-slate-500 shadow-xl backdrop-blur">
          Henüz eğitim planı bulunmuyor.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {gosterilecekPlanlar.map((plan) => {
            const durum = formatValue(plan.fields["Durum"]);
            const planKatilimcilari = getPlanKatilimcilari(plan.id);

            return (
              <div
                key={plan.id}
                className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur"
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Eğitim Planı</p>
                    <h3 className="mt-1 text-xl font-black text-slate-900">
                      {getPlanTitle(plan, egitimMap)}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${getDurumClass(
                      durum
                    )}`}
                  >
                    {durum}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Eğitim</p>
                    <p className="mt-2 font-bold text-slate-900">
                      {linkedNames(plan.fields["Eğitim"], egitimMap)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Sorumlu Kişi</p>
                    <p className="mt-2 font-bold text-slate-900">
                      {linkedNames(plan.fields["Sorumlu Kişi"], kullaniciMap)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Başlangıç Tarihi</p>
                    <p className="mt-2 font-bold text-slate-900">
                      {formatValue(plan.fields["Başlangıç Tarihi"])}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Bitiş Tarihi</p>
                    <p className="mt-2 font-bold text-slate-900">
                      {formatValue(plan.fields["Bitiş Tarihi"])}
                    </p>
                  </div>
                </div>

                {plan.fields["Açıklama"] && (
                  <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Açıklama</p>
                    <p className="mt-2 leading-7 text-slate-700">
                      {formatValue(plan.fields["Açıklama"])}
                    </p>
                  </div>
                )}

                <EgitimPlaniKatilimciYonetimi
                  planId={plan.id}
                  calisanlar={calisanOptions}
                  katilimcilar={planKatilimcilari.map((katilimci) => ({
                    id: katilimci.id,
                    calisanIds: katilimci.fields["Çalışan"] || [],
                    calisanAdi: linkedNames(katilimci.fields["Çalışan"], calisanMap),
                  }))}
                />

                <EgitimPlaniActions recordId={plan.id} durum={durum} />
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
