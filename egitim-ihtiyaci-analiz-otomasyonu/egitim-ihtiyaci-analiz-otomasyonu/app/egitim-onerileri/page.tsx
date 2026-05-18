import AppShell from "@/components/AppShell";
import EgitimOnerisiActions from "@/components/EgitimOnerisiActions";
import OneridenPlanOlustur from "@/components/OneridenPlanOlustur";
import { getAirtableRecords } from "@/lib/airtable";

type CalisanFields = {
  "Ad Soyad"?: string;
};

type KriterFields = {
  "Kriter Adı"?: string;
};

type EgitimFields = {
  "Eğitim Adı"?: string;
};

type EgitimOnerisiFields = {
  "Öneri No"?: string;
  "Çalışan"?: string[];
  "Kriter"?: string[];
  "Önerilen Eğitim"?: string[];
  "Sebep"?: string;
  "Öncelik"?: string;
  "Durum"?: string;
  "Öneri Tarihi"?: string;
  "Frontend Visible"?: boolean;
  "API Status"?: string;
};

function createNameMap<T>(
  records: { id: string; fields: T }[],
  fieldName: keyof T
) {
  const map = new Map<string, string>();

  records.forEach((record) => {
    const value = record.fields[fieldName];

    if (typeof value === "string" && value.trim() !== "") {
      map.set(record.id, value);
    }
  });

  return map;
}

function linkedNames(ids: string[] | undefined, map: Map<string, string>) {
  if (!ids || ids.length === 0) {
    return "Bilgi yok";
  }

  return ids.map((id) => map.get(id) || id).join(", ");
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "Bilgi yok";
  }

  return String(value);
}

function getDurumClass(durum: string) {
  if (durum === "Onaylandı" || durum === "Eğitim Planına Eklendi") {
    return "bg-green-100 text-green-700";
  }

  if (durum === "Önerildi" || durum === "Onay Bekliyor") {
    return "bg-amber-100 text-amber-800";
  }

  if (durum === "Reddedildi") {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getOncelikClass(oncelik: string) {
  if (oncelik === "Yüksek") {
    return "bg-red-100 text-red-700";
  }

  if (oncelik === "Orta") {
    return "bg-amber-100 text-amber-800";
  }

  if (oncelik === "Düşük") {
    return "bg-green-100 text-green-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getOncelikWeight(oncelik: string) {
  if (oncelik === "Yüksek") return 3;
  if (oncelik === "Orta") return 2;
  if (oncelik === "Düşük") return 1;
  return 0;
}

export default async function EgitimOnerileriPage() {
  const [oneriler, calisanlar, kriterler, egitimler] = await Promise.all([
    getAirtableRecords<EgitimOnerisiFields>("Eğitim Önerileri"),
    getAirtableRecords<CalisanFields>("Çalışanlar"),
    getAirtableRecords<KriterFields>("Yetkinlik Kriterleri"),
    getAirtableRecords<EgitimFields>("Eğitimler"),
  ]);

  const calisanMap = createNameMap(calisanlar, "Ad Soyad");
  const kriterMap = createNameMap(kriterler, "Kriter Adı");
  const egitimMap = createNameMap(egitimler, "Eğitim Adı");

  const gosterilecekOneriler = oneriler
    .filter((oneri) => {
      return (
        oneri.fields["Frontend Visible"] !== false &&
        oneri.fields["API Status"] !== "Archived"
      );
    })
    .sort((a, b) => {
      const oncelikFarki =
        getOncelikWeight(b.fields["Öncelik"] || "") -
        getOncelikWeight(a.fields["Öncelik"] || "");

      if (oncelikFarki !== 0) {
        return oncelikFarki;
      }

      const tarihA = a.fields["Öneri Tarihi"] || "";
      const tarihB = b.fields["Öneri Tarihi"] || "";

      return tarihB.localeCompare(tarihA);
    });

  const yuksekOncelikSayisi = gosterilecekOneriler.filter(
    (oneri) => oneri.fields["Öncelik"] === "Yüksek"
  ).length;

  const bekleyenSayisi = gosterilecekOneriler.filter((oneri) => {
    const durum = oneri.fields["Durum"];
    return durum === "Önerildi" || durum === "Onay Bekliyor";
  }).length;

  const planaEklenenSayisi = gosterilecekOneriler.filter(
    (oneri) => oneri.fields["Durum"] === "Eğitim Planına Eklendi"
  ).length;

  return (
    <AppShell
      allowedRoles={["Admin", "İK", "Yönetici"]}
      title="Eğitim Önerileri"
      subtitle="Değerlendirme sonuçlarına göre oluşturulan eğitim önerilerini yönetin"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Toplam Öneri</p>
          <p className="mt-2 text-3xl font-black text-yellow-600">
            {gosterilecekOneriler.length}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Yüksek Öncelikli</p>
          <p className="mt-2 text-3xl font-black text-red-600">
            {yuksekOncelikSayisi}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Onay Bekleyen</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {bekleyenSayisi}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Plana Eklenen</p>
          <p className="mt-2 text-3xl font-black text-green-600">
            {planaEklenenSayisi}
          </p>
        </div>
      </div>

      {gosterilecekOneriler.length === 0 ? (
        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 text-sm font-medium text-slate-500 shadow-xl backdrop-blur">
          Gösterilecek eğitim önerisi bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {gosterilecekOneriler.map((oneri) => {
            const oncelik = formatValue(oneri.fields["Öncelik"]);
            const durum = formatValue(oneri.fields["Durum"]);

            return (
              <div
                key={oneri.id}
                className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur"
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">
                      {formatValue(oneri.fields["Öneri No"])}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-slate-900">
                      {linkedNames(oneri.fields["Önerilen Eğitim"], egitimMap)}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getOncelikClass(
                        oncelik
                      )}`}
                    >
                      {oncelik}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getDurumClass(
                        durum
                      )}`}
                    >
                      {durum}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Çalışan</p>
                    <p className="mt-2 font-bold text-slate-900">
                      {linkedNames(oneri.fields["Çalışan"], calisanMap)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Yetkinlik Kriteri</p>
                    <p className="mt-2 font-bold text-slate-900">
                      {linkedNames(oneri.fields["Kriter"], kriterMap)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Gerekçe</p>
                  <p className="mt-2 leading-7 text-slate-700">
                    {formatValue(oneri.fields["Sebep"])}
                  </p>
                </div>

                <div className="mt-4 text-sm text-slate-500">
                  Öneri Tarihi: {formatValue(oneri.fields["Öneri Tarihi"])}
                </div>

                <EgitimOnerisiActions recordId={oneri.id} durum={durum} />

                <OneridenPlanOlustur oneriId={oneri.id} durum={durum} />
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
