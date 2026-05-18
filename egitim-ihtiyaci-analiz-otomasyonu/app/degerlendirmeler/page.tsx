import AppShell from "@/components/AppShell";
import YeniDegerlendirmeForm from "@/components/YeniDegerlendirmeForm";
import { getAirtableRecords } from "@/lib/airtable";

type AnyFields = Record<string, unknown>;

type DegerlendirmeFields = {
  "Değerlendirme No"?: string;
  "Çalışan"?: string[];
  "Değerlendiren"?: string[];
  "Değerlendirme Tarihi"?: string;
  "Dönem"?: string;
  "Durum"?: string;
  "Genel Puan"?: number;
  "Genel Yorum"?: string;
  "API Status"?: string;
};

type DegerlendirmeDetayFields = {
  "Değerlendirme"?: string[];
  "Kriter"?: string[];
  "Puan"?: number;
  "Yorum"?: string;
};

type AirtableLikeRecord = {
  id: string;
  fields: AnyFields;
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

  const firstReadableString = Object.values(record.fields).find((value) => {
    return typeof value === "string" && value.trim() !== "";
  });

  if (typeof firstReadableString === "string") {
    return firstReadableString;
  }

  return record.id;
}

function createNameMap(records: AirtableLikeRecord[], preferredFields: string[]) {
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

  if (durum === "Taslak") {
    return "bg-slate-100 text-slate-700";
  }

  if (durum === "İptal Edildi") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-800";
}

function getPuanClass(puan: number) {
  if (puan >= 4) {
    return "text-green-600";
  }

  if (puan >= 3) {
    return "text-amber-600";
  }

  return "text-red-600";
}

export default async function DegerlendirmelerPage() {
  const [
    degerlendirmeler,
    degerlendirmeDetaylari,
    calisanlar,
    kullanicilar,
    kriterler,
  ] = await Promise.all([
    getAirtableRecords<DegerlendirmeFields>("Değerlendirmeler"),
    getAirtableRecords<DegerlendirmeDetayFields>("Değerlendirme Detayları"),
    getAirtableRecords<AnyFields>("Çalışanlar"),
    getAirtableRecords<AnyFields>("Kullanıcılar"),
    getAirtableRecords<AnyFields>("Yetkinlik Kriterleri"),
  ]);

  const calisanMap = createNameMap(calisanlar, [
    "Ad Soyad",
    "Name",
    "Full Name",
    "Çalışan",
  ]);

  const kullaniciMap = createNameMap(kullanicilar, [
    "Ad Soyad",
    "Name",
    "Full Name",
    "Kullanıcı",
  ]);

  const kriterMap = createNameMap(kriterler, [
    "Kriter Adı",
    "Name",
    "Ad",
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

  const kullaniciOptions = kullanicilar.map((kullanici) => ({
    id: kullanici.id,
    label: getReadableRecordName(kullanici, [
      "Ad Soyad",
      "Name",
      "Full Name",
      "Kullanıcı",
    ]),
  }));

  const kriterOptions = kriterler.map((kriter) => ({
    id: kriter.id,
    label: getReadableRecordName(kriter, [
      "Kriter Adı",
      "Name",
      "Ad",
    ]),
  }));

  const siraliDegerlendirmeler = degerlendirmeler.sort((a, b) => {
    const tarihA = a.fields["Değerlendirme Tarihi"] || "";
    const tarihB = b.fields["Değerlendirme Tarihi"] || "";

    return tarihB.localeCompare(tarihA);
  });

  const tamamlananSayisi = degerlendirmeler.filter(
    (degerlendirme) => degerlendirme.fields["Durum"] === "Tamamlandı"
  ).length;

  const ortalamaPuan =
    degerlendirmeler.length === 0
      ? 0
      : degerlendirmeler.reduce((total, degerlendirme) => {
          return total + Number(degerlendirme.fields["Genel Puan"] || 0);
        }, 0) / degerlendirmeler.length;

  function getDetaylar(degerlendirmeId: string) {
    return degerlendirmeDetaylari.filter((detay) => {
      return detay.fields["Değerlendirme"]?.includes(degerlendirmeId);
    });
  }

  return (
    <AppShell
      allowedRoles={["Admin", "İK", "Yönetici", "Değerlendirici"]}
      title="Değerlendirme Detayları"
      subtitle="Çalışan değerlendirmelerini oluşturun ve takip edin"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Toplam Değerlendirme</p>
          <p className="mt-2 text-3xl font-black text-yellow-600">
            {degerlendirmeler.length}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Tamamlanan</p>
          <p className="mt-2 text-3xl font-black text-green-600">
            {tamamlananSayisi}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Ortalama Puan</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {ortalamaPuan.toFixed(1)}
          </p>
        </div>
      </div>

      <YeniDegerlendirmeForm
        calisanlar={calisanOptions}
        kullanicilar={kullaniciOptions}
        kriterler={kriterOptions}
      />

      {siraliDegerlendirmeler.length === 0 ? (
        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 text-sm font-medium text-slate-500 shadow-xl backdrop-blur">
          Henüz değerlendirme kaydı bulunmuyor.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {siraliDegerlendirmeler.map((degerlendirme) => {
            const durum = formatValue(degerlendirme.fields["Durum"]);
            const puan = Number(degerlendirme.fields["Genel Puan"] || 0);
            const detaylar = getDetaylar(degerlendirme.id);

            return (
              <div
                key={degerlendirme.id}
                className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur"
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">
                      {formatValue(degerlendirme.fields["Değerlendirme No"])}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-slate-900">
                      {linkedNames(degerlendirme.fields["Çalışan"], calisanMap)}
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
                    <p className="text-sm text-slate-500">Değerlendiren</p>
                    <p className="mt-2 font-bold text-slate-900">
                      {linkedNames(
                        degerlendirme.fields["Değerlendiren"],
                        kullaniciMap
                      )}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Tarih</p>
                    <p className="mt-2 font-bold text-slate-900">
                      {formatValue(degerlendirme.fields["Değerlendirme Tarihi"])}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Dönem</p>
                    <p className="mt-2 font-bold text-slate-900">
                      {formatValue(degerlendirme.fields["Dönem"])}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Genel Puan</p>
                    <p className={`mt-2 text-2xl font-black ${getPuanClass(puan)}`}>
                      {puan || "Bilgi yok"}
                    </p>
                  </div>
                </div>

                {detaylar.length > 0 && (
                  <div className="mt-4 rounded-3xl border border-yellow-100 bg-yellow-50/60 p-4">
                    <p className="mb-3 font-black text-slate-900">
                      Yetkinlik Detayları
                    </p>

                    <div className="space-y-3">
                      {detaylar.map((detay) => {
                        const detayPuan = Number(detay.fields["Puan"] || 0);

                        return (
                          <div
                            key={detay.id}
                            className="rounded-2xl bg-white p-4 shadow-sm"
                          >
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="font-bold text-slate-900">
                                {linkedNames(detay.fields["Kriter"], kriterMap)}
                              </p>
                              <p className={`font-black ${getPuanClass(detayPuan)}`}>
                                {detayPuan}/5
                              </p>
                            </div>

                            <p className="text-sm leading-6 text-slate-600">
                              {formatValue(detay.fields["Yorum"])}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Genel Yorum</p>
                  <p className="mt-2 leading-7 text-slate-700">
                    {formatValue(degerlendirme.fields["Genel Yorum"])}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
