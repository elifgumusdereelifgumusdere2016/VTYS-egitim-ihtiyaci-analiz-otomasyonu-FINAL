import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getAirtableRecords, showField } from "@/lib/airtable";

type CalisanFields = {
  "Ad Soyad"?: string;
  "E-posta"?: string;
  "Telefon"?: string;
  "Departman"?: string[];
  "Pozisyon"?: string;
  "Durum"?: string;
  "Eğitim İhtiyacı Var Mı"?: string;
  "Profil Görünür Mü"?: boolean;
};

function getDurumClass(durum: string) {
  if (durum === "Aktif") {
    return "bg-green-100 text-green-700";
  }

  if (durum === "İzinli") {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getEgitimIhtiyaciClass(deger: string) {
  if (
    deger.toLowerCase().includes("evet") ||
    deger.toLowerCase().includes("var")
  ) {
    return "bg-amber-100 text-amber-800";
  }

  if (
    deger.toLowerCase().includes("hayır") ||
    deger.toLowerCase().includes("yok")
  ) {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default async function CalisanlarPage() {
  const records = await getAirtableRecords<CalisanFields>("Çalışanlar");

  const aktifCalisanSayisi = records.filter(
    (record) => record.fields["Durum"] === "Aktif"
  ).length;

  const gorunurProfilSayisi = records.filter(
    (record) => record.fields["Profil Görünür Mü"] === true
  ).length;

  return (
    <AppShell
      title="Çalışan Listesi"
      subtitle="Airtable veritabanından gelen gerçek çalışan kayıtları"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Toplam Çalışan</p>
          <p className="mt-2 text-3xl font-black text-yellow-600">
            {records.length}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Aktif Çalışan</p>
          <p className="mt-2 text-3xl font-black text-pink-500">
            {aktifCalisanSayisi}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Görünür Profil</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {gorunurProfilSayisi}
          </p>
        </div>
      </div>

      <div className="glass-card-strong overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-head text-left">
            <tr>
              <th className="p-4">Ad Soyad</th>
              <th className="p-4">E-posta</th>
              <th className="p-4">Departman</th>
              <th className="p-4">Pozisyon</th>
              <th className="p-4">Durum</th>
              <th className="p-4">Eğitim İhtiyacı</th>
              <th className="p-4">İşlem</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => {
              const durum = showField(record.fields["Durum"]);
              const egitimIhtiyaci = showField(
                record.fields["Eğitim İhtiyacı Var Mı"]
              );

              return (
                <tr key={record.id} className="table-row soft-line border-t">
                  <td className="p-4 font-semibold text-slate-900">
                    {showField(record.fields["Ad Soyad"])}
                  </td>

                  <td className="p-4">
                    {showField(record.fields["E-posta"])}
                  </td>

                  <td className="p-4">
                    {showField(record.fields["Departman"])}
                  </td>

                  <td className="p-4">
                    {showField(record.fields["Pozisyon"])}
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getDurumClass(
                        durum
                      )}`}
                    >
                      {durum}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getEgitimIhtiyaciClass(
                        egitimIhtiyaci
                      )}`}
                    >
                      {egitimIhtiyaci}
                    </span>
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/calisanlar/${record.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-5 py-2 text-xs font-black text-slate-900 shadow-md transition hover:from-slate-800 hover:to-slate-900 hover:text-white"
                    >
                      Detay Gör
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
