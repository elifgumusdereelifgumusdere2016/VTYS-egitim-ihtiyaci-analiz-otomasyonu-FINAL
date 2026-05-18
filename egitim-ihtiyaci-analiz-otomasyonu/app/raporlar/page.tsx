import AppShell from "@/components/AppShell";
import { getAirtableRecords } from "@/lib/airtable";

type CalisanFields = {
  "Ad Soyad"?: string;
  "Durum"?: string;
  "Eğitim İhtiyacı Var Mı"?: string;
};

type DegerlendirmeFields = {
  "Genel Puan"?: number | string;
  "Durum"?: string;
};

type OneriFields = {
  "Öncelik"?: string;
  "Durum"?: string;
  "Frontend Visible"?: boolean;
  "API Status"?: string;
};

type PlanFields = {
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

function percentage(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function isCompleted(value: unknown) {
  const text = normalize(value);
  return text.includes("tamam") || text.includes("complete");
}

function hasTrainingNeed(value: unknown) {
  const text = normalize(value);
  return text.includes("evet") || text.includes("var") || text.includes("ihtiyaç");
}

export default async function RaporlarPage() {
  const [calisanlar, degerlendirmeler, oneriler, planlar] = await Promise.all([
    getAirtableRecords<CalisanFields>("Çalışanlar"),
    getAirtableRecords<DegerlendirmeFields>("Değerlendirmeler"),
    getAirtableRecords<OneriFields>("Eğitim Önerileri"),
    getAirtableRecords<PlanFields>("Eğitim Planları"),
  ]);

  const aktifCalisanlar = calisanlar.filter((calisan) =>
    normalize(calisan.fields["Durum"]).includes("aktif")
  );

  const aktifCalisanSayisi =
    aktifCalisanlar.length > 0 ? aktifCalisanlar.length : calisanlar.length;

  const egitimIhtiyaciOlanCalisanSayisi = calisanlar.filter((calisan) =>
    hasTrainingNeed(calisan.fields["Eğitim İhtiyacı Var Mı"])
  ).length;

  const gecerliPuanlar = degerlendirmeler
    .map((degerlendirme) => toSafeNumber(degerlendirme.fields["Genel Puan"]))
    .filter((puan): puan is number => puan !== null);

  const ortalamaPuan =
    gecerliPuanlar.length === 0
      ? 0
      : gecerliPuanlar.reduce((total, puan) => total + puan, 0) /
        gecerliPuanlar.length;

  const tamamlananDegerlendirmeSayisi = degerlendirmeler.filter(
    (degerlendirme) =>
      isCompleted(degerlendirme.fields["Durum"]) ||
      toSafeNumber(degerlendirme.fields["Genel Puan"]) !== null
  ).length;

  const gosterilebilirOneriler = oneriler.filter((oneri) => {
    return (
      oneri.fields["Frontend Visible"] !== false &&
      oneri.fields["API Status"] !== "Archived"
    );
  });

  const yuksekOncelikliOneriSayisi = gosterilebilirOneriler.filter(
    (oneri) => oneri.fields["Öncelik"] === "Yüksek"
  ).length;

  const onaylananOneriSayisi = gosterilebilirOneriler.filter((oneri) => {
    const durum = oneri.fields["Durum"];
    return durum === "Onaylandı" || durum === "Eğitim Planına Eklendi";
  }).length;

  const gosterilebilirPlanlar = planlar.filter((plan) => {
    return Boolean(plan.fields["Durum"]);
  });

  const planlananSayisi = gosterilebilirPlanlar.filter(
    (plan) => plan.fields["Durum"] === "Planlandı"
  ).length;

  const devamEdenSayisi = gosterilebilirPlanlar.filter(
    (plan) => plan.fields["Durum"] === "Devam Ediyor"
  ).length;

  const tamamlananPlanSayisi = gosterilebilirPlanlar.filter(
    (plan) => plan.fields["Durum"] === "Tamamlandı"
  ).length;

  return (
    <AppShell
      allowedRoles={["Admin", "İK", "Yönetici"]}
      title="Raporlar"
      subtitle="Eğitim ihtiyacı, değerlendirme ve eğitim planı performans raporları"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Aktif Çalışan</p>
          <p className="mt-2 text-3xl font-black text-yellow-600">
            {aktifCalisanSayisi}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Eğitim İhtiyacı Oranı</p>
          <p className="mt-2 text-3xl font-black text-red-600">
            {percentage(egitimIhtiyaciOlanCalisanSayisi, calisanlar.length)}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Ortalama Puan</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {ortalamaPuan.toFixed(1)}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Tamamlanan Eğitim</p>
          <p className="mt-2 text-3xl font-black text-green-600">
            {tamamlananPlanSayisi}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <h3 className="mb-5 text-2xl font-black text-slate-900">
            Değerlendirme Özeti
          </h3>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Toplam Değerlendirme</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {degerlendirmeler.length}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Tamamlanan Değerlendirme</p>
              <p className="mt-2 text-2xl font-black text-green-600">
                {tamamlananDegerlendirmeSayisi}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Tamamlanma Oranı</p>
              <p className="mt-2 text-2xl font-black text-yellow-600">
                {percentage(tamamlananDegerlendirmeSayisi, degerlendirmeler.length)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <h3 className="mb-5 text-2xl font-black text-slate-900">
            Eğitim Önerisi Özeti
          </h3>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Toplam Görünür Öneri</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {gosterilebilirOneriler.length}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Yüksek Öncelikli Öneri</p>
              <p className="mt-2 text-2xl font-black text-red-600">
                {yuksekOncelikliOneriSayisi}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Onaylanan Öneri</p>
              <p className="mt-2 text-2xl font-black text-green-600">
                {onaylananOneriSayisi}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur xl:col-span-2">
          <h3 className="mb-5 text-2xl font-black text-slate-900">
            Eğitim Planı Durumu
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Planlandı</p>
              <p className="mt-2 text-2xl font-black text-amber-600">
                {planlananSayisi}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Devam Ediyor</p>
              <p className="mt-2 text-2xl font-black text-blue-600">
                {devamEdenSayisi}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Tamamlandı</p>
              <p className="mt-2 text-2xl font-black text-green-600">
                {tamamlananPlanSayisi}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
