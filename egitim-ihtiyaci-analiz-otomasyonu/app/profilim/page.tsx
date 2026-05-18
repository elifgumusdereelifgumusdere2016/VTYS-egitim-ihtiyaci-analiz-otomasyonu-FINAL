import AppShell from "@/components/AppShell";
import ProfilOlusturForm from "@/components/ProfilOlusturForm";
import ProfilKatilimActions from "@/components/ProfilKatilimActions";
import ProfilPlanKayitActions from "@/components/ProfilPlanKayitActions";
import { getAirtableRecords } from "@/lib/airtable";
import { getCurrentAppUser } from "@/lib/yetki";

type AnyFields = Record<string, unknown>;

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

function normalize(value: unknown) {
  return String(value || "").trim().toLocaleLowerCase("tr-TR");
}

function getArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
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

function getPuanClass(value: unknown) {
  const puan = Number(value);

  if (!Number.isFinite(puan)) return "text-slate-900";
  if (puan >= 4) return "text-green-600";
  if (puan >= 3) return "text-amber-600";

  return "text-red-600";
}

function getStatusClass(value: unknown) {
  const status = String(value || "");

  if (status.includes("Tamamlandı") || status.includes("Onaylandı")) {
    return "bg-green-100 text-green-700";
  }

  if (status.includes("Devam") || status.includes("Katılacak") || status.includes("Katıldı")) {
    return "bg-blue-100 text-blue-700";
  }

  if (status.includes("Planlandı") || status.includes("Önerildi") || status.includes("Bekliyor")) {
    return "bg-amber-100 text-amber-800";
  }

  if (status.includes("Reddedildi") || status.includes("İptal") || status.includes("Katılamayacak")) {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default async function ProfilimPage() {
  const appUser = await getCurrentAppUser();

  const [
    calisanlar,
    departmanlar,
    degerlendirmeler,
    egitimOnerileri,
    egitimler,
    kriterler,
    katilimcilar,
    egitimPlanlari,
  ] = await Promise.all([
    getAirtableRecords<AnyFields>("Çalışanlar"),
    getAirtableRecords<AnyFields>("Departmanlar"),
    getAirtableRecords<AnyFields>("Değerlendirmeler"),
    getAirtableRecords<AnyFields>("Eğitim Önerileri"),
    getAirtableRecords<AnyFields>("Eğitimler"),
    getAirtableRecords<AnyFields>("Yetkinlik Kriterleri"),
    getAirtableRecords<AnyFields>("Eğitim Planı Katılımcıları"),
    getAirtableRecords<AnyFields>("Eğitim Planları"),
  ]);

  const departmanMap = createNameMap(departmanlar, [
    "Departman Adı",
    "Name",
    "Ad",
  ]);

  const egitimMap = createNameMap(egitimler, [
    "Eğitim Adı",
    "Name",
    "Ad",
  ]);

  const kriterMap = createNameMap(kriterler, [
    "Kriter Adı",
    "Name",
    "Ad",
  ]);

  const planMap = createNameMap(egitimPlanlari, [
    "Plan Adı",
    "Name",
    "Ad",
  ]);

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

  const kullaniciDegerlendirmeleri = degerlendirmeler
    .filter((record) => getArray(record.fields["Çalışan"]).includes(employeeId))
    .sort((a, b) => {
      const tarihA = String(a.fields["Değerlendirme Tarihi"] || "");
      const tarihB = String(b.fields["Değerlendirme Tarihi"] || "");

      return tarihB.localeCompare(tarihA);
    });

  const kullaniciOnerileri = egitimOnerileri
    .filter((record) => {
      return (
        getArray(record.fields["Çalışan"]).includes(employeeId) &&
        record.fields["Frontend Visible"] !== false &&
        record.fields["API Status"] !== "Archived"
      );
    })
    .slice(0, 6);

  const kullaniciKatilimlari = katilimcilar.filter((record) =>
    getArray(record.fields["Çalışan"]).includes(employeeId)
  );

  const joinedPlanIds = new Set(
    kullaniciKatilimlari.flatMap((record) => getArray(record.fields["Eğitim Planı"]))
  );

  const katilabilecegimPlanlar = egitimPlanlari.filter((plan) => {
    const hasStatus = Boolean(plan.fields["Durum"]);
    const isVisible = plan.fields["Frontend Visible"] !== false;
    const isArchived = plan.fields["API Status"] === "Archived";
    const alreadyJoined = joinedPlanIds.has(plan.id);

    return hasStatus && isVisible && !isArchived && !alreadyJoined;
  });

  return (
    <AppShell
      allowedRoles={["Admin", "İK", "Yönetici", "Değerlendirici", "Çalışan"]}
      title="Profilim"
      subtitle="Kişisel profil, değerlendirme ve eğitim bilgileriniz"
    >
      {!currentEmployee ? (
        <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <h3 className="text-2xl font-black text-slate-900">
            Çalışan profili bulunamadı
          </h3>

          <p className="mt-3 max-w-2xl text-slate-500">
            Bu kullanıcı hesabına bağlı bir çalışan kaydı bulunmuyor. Profilinizi
            oluşturduktan sonra değerlendirme ve eğitim bilgileriniz burada görüntülenir.
          </p>

          <ProfilOlusturForm
            defaultName={appUser.name}
            defaultEmail={appUser.email}
          />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="glass-card p-5">
              <p className="text-sm text-slate-500">Değerlendirme</p>
              <p className="mt-2 text-3xl font-black text-yellow-600">
                {kullaniciDegerlendirmeleri.length}
              </p>
            </div>

            <div className="glass-card p-5">
              <p className="text-sm text-slate-500">Eğitim Önerisi</p>
              <p className="mt-2 text-3xl font-black text-red-600">
                {kullaniciOnerileri.length}
              </p>
            </div>

            <div className="glass-card p-5">
              <p className="text-sm text-slate-500">Eğitim Planı</p>
              <p className="mt-2 text-3xl font-black text-blue-600">
                {kullaniciKatilimlari.length}
              </p>
            </div>

            <div className="glass-card p-5">
              <p className="text-sm text-slate-500">Durum</p>
              <p className="mt-2 text-3xl font-black text-green-600">
                {formatValue(currentEmployee.fields["Durum"])}
              </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur xl:col-span-1">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 to-yellow-500 text-2xl font-black text-slate-900 shadow-lg">
                {formatValue(currentEmployee.fields["Ad Soyad"]).charAt(0)}
              </div>

              <h3 className="text-3xl font-black text-slate-900">
                {formatValue(currentEmployee.fields["Ad Soyad"])}
              </h3>

              <p className="mt-2 text-slate-500">
                {formatValue(currentEmployee.fields["Pozisyon"])}
              </p>

              <div className="mt-6 rounded-3xl bg-yellow-50 p-5">
                <p className="text-sm text-slate-500">E-posta</p>
                <p className="mt-2 font-black text-slate-900">
                  {formatValue(currentEmployee.fields["E-posta"] || appUser.email)}
                </p>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur xl:col-span-2">
              <h3 className="mb-6 text-2xl font-black text-slate-900">
                Profil Bilgileri
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                  <p className="text-sm text-slate-500">Departman</p>
                  <p className="mt-2 font-black text-slate-900">
                    {linkedNames(currentEmployee.fields["Departman"], departmanMap)}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                  <p className="text-sm text-slate-500">İşe Giriş Tarihi</p>
                  <p className="mt-2 font-black text-slate-900">
                    {formatValue(currentEmployee.fields["İşe Giriş Tarihi"])}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                  <p className="text-sm text-slate-500">Ortalama Puan</p>
                  <p
                    className={`mt-2 text-2xl font-black ${getPuanClass(
                      currentEmployee.fields["Ortalama Puan"]
                    )}`}
                  >
                    {formatValue(currentEmployee.fields["Ortalama Puan"])}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                  <p className="text-sm text-slate-500">Eğitim İhtiyacı</p>
                  <p className="mt-2 font-black text-slate-900">
                    {formatValue(currentEmployee.fields["Eğitim İhtiyacı Var Mı"])}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
              <h3 className="mb-6 text-2xl font-black text-slate-900">
                Değerlendirmelerim
              </h3>

              {kullaniciDegerlendirmeleri.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm font-medium text-slate-500">
                  Değerlendirme kaydı bulunamadı.
                </div>
              ) : (
                <div className="space-y-4">
                  {kullaniciDegerlendirmeleri.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-slate-900">
                            {formatValue(record.fields["Dönem"])}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatValue(record.fields["Değerlendirme Tarihi"])}
                          </p>
                        </div>

                        <p
                          className={`text-2xl font-black ${getPuanClass(
                            record.fields["Genel Puan"]
                          )}`}
                        >
                          {formatValue(record.fields["Genel Puan"])}
                        </p>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {formatValue(record.fields["Genel Yorum"])}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
              <h3 className="mb-6 text-2xl font-black text-slate-900">
                Eğitim Önerilerim
              </h3>

              {kullaniciOnerileri.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm font-medium text-slate-500">
                  Eğitim önerisi bulunamadı.
                </div>
              ) : (
                <div className="space-y-4">
                  {kullaniciOnerileri.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5"
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">
                            {linkedNames(record.fields["Önerilen Eğitim"], egitimMap)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Kriter: {linkedNames(record.fields["Kriter"], kriterMap)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                            record.fields["Durum"]
                          )}`}
                        >
                          {formatValue(record.fields["Durum"])}
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-slate-600">
                        {formatValue(record.fields["Sebep"])}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
            <h3 className="mb-6 text-2xl font-black text-slate-900">
              Eğitim Planlarım
            </h3>

            {kullaniciKatilimlari.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm font-medium text-slate-500">
                Eğitim planı katılım kaydı bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {kullaniciKatilimlari.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5"
                  >
                    <p className="font-black text-slate-900">
                      {linkedNames(record.fields["Eğitim Planı"], planMap)}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs text-slate-500">Katılım Durumu</p>
                        <p className="mt-1 font-black text-slate-900">
                          {formatValue(record.fields["Katılım Durumu"])}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs text-slate-500">Tamamlama Durumu</p>
                        <p className="mt-1 font-black text-slate-900">
                          {formatValue(record.fields["Tamamlama Durumu"])}
                        </p>
                      </div>
                    </div>

                    <ProfilKatilimActions
                      katilimciId={record.id}
                      katilimDurumu={formatValue(record.fields["Katılım Durumu"])}
                      tamamlamaDurumu={formatValue(record.fields["Tamamlama Durumu"])}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
            <h3 className="mb-6 text-2xl font-black text-slate-900">
              Katılabileceğim Eğitimler
            </h3>

            {katilabilecegimPlanlar.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm font-medium text-slate-500">
                Katılabileceğiniz aktif eğitim planı bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {katilabilecegimPlanlar.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">
                          {formatValue(plan.fields["Plan Adı"])}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Eğitim: {linkedNames(plan.fields["Eğitim"], egitimMap)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                          plan.fields["Durum"]
                        )}`}
                      >
                        {formatValue(plan.fields["Durum"])}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs text-slate-500">Başlangıç</p>
                        <p className="mt-1 font-black text-slate-900">
                          {formatValue(plan.fields["Başlangıç Tarihi"])}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs text-slate-500">Bitiş</p>
                        <p className="mt-1 font-black text-slate-900">
                          {formatValue(plan.fields["Bitiş Tarihi"])}
                        </p>
                      </div>
                    </div>

                    <ProfilPlanKayitActions planId={plan.id} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
