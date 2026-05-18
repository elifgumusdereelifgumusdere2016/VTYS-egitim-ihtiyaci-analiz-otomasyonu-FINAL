import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  getAirtableRecordById,
  getAirtableRecords,
  showField,
} from "@/lib/airtable";

type CalisanFields = {
  "Ad Soyad"?: string;
  "E-posta"?: string;
  "Telefon"?: string;
  "Departman"?: string[];
  "Pozisyon"?: string;
  "Yönetici"?: string[];
  "İşe Giriş Tarihi"?: string;
  "Durum"?: string;
  "Ortalama Puan"?: number;
  "Eğitim İhtiyacı Var Mı"?: string;
  "Profil Görünür Mü"?: boolean;
  "Notlar"?: string;
};

type DepartmanFields = {
  "Departman Adı"?: string;
  "Departman Kodu"?: string;
};

type KullaniciFields = {
  "Ad Soyad"?: string;
  "E-posta"?: string;
  "Rol"?: string;
};

type DegerlendirmeFields = {
  "Değerlendirme No"?: string;
  "Çalışan"?: string[];
  "Değerlendiren"?: string[];
  "Değerlendirme Tarihi"?: string;
  "Dönem"?: string;
  "Durum"?: string;
  "Genel Puan"?: number;
  "Genel Yorum"?: string;
};

type EgitimOnerisiFields = {
  "Öneri No"?: string;
  "Çalışan"?: string[];
  "Değerlendirme"?: string[];
  "Kriter"?: string[];
  "Önerilen Eğitim"?: string[];
  "Sebep"?: string;
  "Öncelik"?: string;
  "Durum"?: string;
  "Öneri Tarihi"?: string;
  "Frontend Visible"?: boolean;
};

type KriterFields = {
  "Kriter Adı"?: string;
};

type EgitimFields = {
  "Eğitim Adı"?: string;
  "Kategori"?: string;
  "Seviye"?: string;
  "Süre"?: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatValue(value: unknown) {
  const text = showField(value);

  if (text === "-" || text.trim() === "") {
    return "Bilgi yok";
  }

  return text;
}

function getInitials(name: string) {
  if (!name || name === "Bilgi yok") {
    return "Ç";
  }

  const parts = name.split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function getDurumClass(durum: string) {
  if (durum === "Aktif" || durum === "Tamamlandı" || durum === "Onaylandı") {
    return "bg-green-100 text-green-700";
  }

  if (durum === "İzinli" || durum === "Planlandı") {
    return "bg-sky-100 text-sky-700";
  }

  if (durum === "Önerildi" || durum === "Onay Bekliyor") {
    return "bg-amber-100 text-amber-800";
  }

  if (durum === "Reddedildi" || durum === "İptal Edildi") {
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

function getEgitimIhtiyaciClass(deger: string) {
  const lower = deger.toLowerCase();

  if (lower.includes("unable to generate formula")) {
    return "bg-orange-100 text-orange-800";
  }

  if (lower.includes("evet") || lower.includes("var")) {
    return "bg-amber-100 text-amber-800";
  }

  if (lower.includes("hayır") || lower.includes("yok")) {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

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

export default async function CalisanDetayPage({ params }: PageProps) {
  const { id } = await params;

  const [
    record,
    departmanlar,
    kullanicilar,
    degerlendirmeler,
    egitimOnerileri,
    kriterler,
    egitimler,
  ] = await Promise.all([
    getAirtableRecordById<CalisanFields>("Çalışanlar", id),
    getAirtableRecords<DepartmanFields>("Departmanlar"),
    getAirtableRecords<KullaniciFields>("Kullanıcılar"),
    getAirtableRecords<DegerlendirmeFields>("Değerlendirmeler"),
    getAirtableRecords<EgitimOnerisiFields>("Eğitim Önerileri"),
    getAirtableRecords<KriterFields>("Yetkinlik Kriterleri"),
    getAirtableRecords<EgitimFields>("Eğitimler"),
  ]);

  const calisan = record.fields;

  const departmanMap = createNameMap(departmanlar, "Departman Adı");
  const kullaniciMap = createNameMap(kullanicilar, "Ad Soyad");
  const kriterMap = createNameMap(kriterler, "Kriter Adı");
  const egitimMap = createNameMap(egitimler, "Eğitim Adı");

  const adSoyad = formatValue(calisan["Ad Soyad"]);
  const pozisyon = formatValue(calisan["Pozisyon"]);
  const durum = formatValue(calisan["Durum"]);
  const egitimIhtiyaci = formatValue(calisan["Eğitim İhtiyacı Var Mı"]);

  const calisanDegerlendirmeleri = degerlendirmeler
    .filter((degerlendirme) => {
      return degerlendirme.fields["Çalışan"]?.includes(id);
    })
    .sort((a, b) => {
      const dateA = a.fields["Değerlendirme Tarihi"] || "";
      const dateB = b.fields["Değerlendirme Tarihi"] || "";

      return dateB.localeCompare(dateA);
    });

  const calisanOnerileri = egitimOnerileri
    .filter((oneri) => {
      return (
        oneri.fields["Çalışan"]?.includes(id) &&
        oneri.fields["Frontend Visible"] !== false
      );
    })
    .slice(0, 6);

  return (
    <AppShell
      title="Çalışan Detayı"
      subtitle="Çalışanın profil bilgileri, değerlendirme geçmişi ve eğitim önerileri"
    >
      <div className="mb-6">
        <Link
          href="/calisanlar"
          className="inline-flex rounded-full border border-yellow-200 bg-white/85 px-5 py-2 text-sm font-bold text-slate-800 shadow-sm backdrop-blur transition hover:bg-yellow-100"
        >
          ← Çalışan Listesine Dön
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur xl:col-span-1">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 to-yellow-500 text-2xl font-black text-slate-900 shadow-lg">
            {getInitials(adSoyad)}
          </div>

          <h3 className="text-3xl font-black text-slate-900">{adSoyad}</h3>

          <p className="mt-2 text-base font-medium text-slate-500">
            {pozisyon}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-4 py-2 text-xs font-bold ${getDurumClass(
                durum
              )}`}
            >
              {durum}
            </span>

            <span
              className={`rounded-full px-4 py-2 text-xs font-bold ${getEgitimIhtiyaciClass(
                egitimIhtiyaci
              )}`}
            >
              Eğitim İhtiyacı: {egitimIhtiyaci}
            </span>
          </div>

          <div className="mt-8 rounded-3xl bg-gradient-to-r from-yellow-50 to-pink-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              Çalışan Özeti
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Bu bölüm çalışanın aktif durumunu, pozisyonunu ve eğitim ihtiyacı
              bilgisini hızlıca gösterir.
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur xl:col-span-2">
          <h3 className="mb-6 text-2xl font-black text-slate-900">
            Profil Bilgileri
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm">
              <p className="text-sm text-slate-500">E-posta</p>
              <p className="mt-2 font-bold text-slate-900">
                {formatValue(calisan["E-posta"])}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm">
              <p className="text-sm text-slate-500">Telefon</p>
              <p className="mt-2 font-bold text-slate-900">
                {formatValue(calisan["Telefon"])}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm">
              <p className="text-sm text-slate-500">Departman</p>
              <p className="mt-2 font-bold break-words text-slate-900">
                {linkedNames(calisan["Departman"], departmanMap)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm">
              <p className="text-sm text-slate-500">Yönetici</p>
              <p className="mt-2 font-bold break-words text-slate-900">
                {linkedNames(calisan["Yönetici"], kullaniciMap)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm">
              <p className="text-sm text-slate-500">İşe Giriş Tarihi</p>
              <p className="mt-2 font-bold text-slate-900">
                {formatValue(calisan["İşe Giriş Tarihi"])}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm">
              <p className="text-sm text-slate-500">Ortalama Puan</p>
              <p className="mt-2 font-bold text-slate-900">
                {formatValue(calisan["Ortalama Puan"])}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <h3 className="mb-6 text-2xl font-black text-slate-900">
            Değerlendirme Geçmişi
          </h3>

          {calisanDegerlendirmeleri.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-5 text-sm font-medium text-slate-500">
              Bu çalışan için değerlendirme kaydı bulunamadı.
            </div>
          ) : (
            <div className="space-y-4">
              {calisanDegerlendirmeleri.map((degerlendirme) => {
                const degerlendiren = linkedNames(
                  degerlendirme.fields["Değerlendiren"],
                  kullaniciMap
                );

                const durumText = formatValue(degerlendirme.fields["Durum"]);

                return (
                  <div
                    key={degerlendirme.id}
                    className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">
                          {formatValue(degerlendirme.fields["Dönem"])}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Değerlendiren: {degerlendiren}
                        </p>
                        <p className="text-sm text-slate-500">
                          Tarih:{" "}
                          {formatValue(
                            degerlendirme.fields["Değerlendirme Tarihi"]
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-500">Genel Puan</p>
                        <p className="text-2xl font-black text-yellow-600">
                          {formatValue(degerlendirme.fields["Genel Puan"])}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getDurumClass(
                          durumText
                        )}`}
                      >
                        {durumText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <h3 className="mb-6 text-2xl font-black text-slate-900">
            Eğitim Önerileri
          </h3>

          {calisanOnerileri.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-5 text-sm font-medium text-slate-500">
              Bu çalışan için eğitim önerisi bulunamadı.
            </div>
          ) : (
            <div className="space-y-4">
              {calisanOnerileri.map((oneri) => {
                const oncelikText = formatValue(oneri.fields["Öncelik"]);
                const durumText = formatValue(oneri.fields["Durum"]);

                return (
                  <div
                    key={oneri.id}
                    className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">
                          {linkedNames(oneri.fields["Önerilen Eğitim"], egitimMap)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Kriter: {linkedNames(oneri.fields["Kriter"], kriterMap)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getOncelikClass(
                          oncelikText
                        )}`}
                      >
                        {oncelikText}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      {formatValue(oneri.fields["Sebep"])}
                    </p>

                    <div className="mt-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getDurumClass(
                          durumText
                        )}`}
                      >
                        {durumText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}