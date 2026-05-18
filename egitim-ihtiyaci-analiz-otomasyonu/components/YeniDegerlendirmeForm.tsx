"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: string;
  label: string;
};

type KriterPuan = {
  puan: string;
  yorum: string;
};

type Props = {
  calisanlar: Option[];
  kullanicilar: Option[];
  kriterler: Option[];
};

export default function YeniDegerlendirmeForm({
  calisanlar,
  kullanicilar,
  kriterler,
}: Props) {
  const router = useRouter();

  const [calisanId, setCalisanId] = useState(calisanlar[0]?.id || "");
  const [degerlendirenId, setDegerlendirenId] = useState(
    kullanicilar[0]?.id || ""
  );
  const [tarih, setTarih] = useState("");
  const [donem, setDonem] = useState("");
  const [genelYorum, setGenelYorum] = useState("");
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");

  const [kriterPuanlari, setKriterPuanlari] = useState<
    Record<string, KriterPuan>
  >(() => {
    const initial: Record<string, KriterPuan> = {};

    kriterler.forEach((kriter) => {
      initial[kriter.id] = {
        puan: "3",
        yorum: "",
      };
    });

    return initial;
  });

  function updateKriterPuan(kriterId: string, field: keyof KriterPuan, value: string) {
    setKriterPuanlari((previous) => ({
      ...previous,
      [kriterId]: {
        ...previous[kriterId],
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setHata("");

    try {
      const response = await fetch("/api/degerlendirmeler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          calisanId,
          degerlendirenId,
          tarih,
          donem,
          genelYorum,
          kriterPuanlari: Object.entries(kriterPuanlari).map(
            ([kriterId, value]) => ({
              kriterId,
              puan: Number(value.puan),
              yorum: value.yorum,
            })
          ),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Değerlendirme oluşturulamadı.");
      }

      setTarih("");
      setDonem("");
      setGenelYorum("");

      const resetScores: Record<string, KriterPuan> = {};

      kriterler.forEach((kriter) => {
        resetScores[kriter.id] = {
          puan: "3",
          yorum: "",
        };
      });

      setKriterPuanlari(resetScores);
      router.refresh();
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
      <h3 className="mb-5 text-2xl font-black text-slate-900">
        Yeni Değerlendirme Oluştur
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Çalışan
            </label>
            <select
              value={calisanId}
              onChange={(event) => setCalisanId(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
            >
              {calisanlar.map((calisan) => (
                <option key={calisan.id} value={calisan.id}>
                  {calisan.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Değerlendiren
            </label>
            <select
              value={degerlendirenId}
              onChange={(event) => setDegerlendirenId(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
            >
              {kullanicilar.map((kullanici) => (
                <option key={kullanici.id} value={kullanici.id}>
                  {kullanici.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Değerlendirme Tarihi
            </label>
            <input
              type="date"
              value={tarih}
              onChange={(event) => setTarih(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Dönem
            </label>
            <input
              value={donem}
              onChange={(event) => setDonem(event.target.value)}
              required
              placeholder="Örnek: 2026 Mayıs"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-100 bg-yellow-50/60 p-5">
          <h4 className="mb-4 text-lg font-black text-slate-900">
            Yetkinlik Puanları
          </h4>

          {kriterler.length === 0 ? (
            <p className="text-sm font-medium text-slate-500">
              Yetkinlik kriteri bulunamadı.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {kriterler.map((kriter) => (
                <div
                  key={kriter.id}
                  className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-black text-slate-900">{kriter.label}</p>

                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={kriterPuanlari[kriter.id]?.puan || "3"}
                      onChange={(event) =>
                        updateKriterPuan(kriter.id, "puan", event.target.value)
                      }
                      className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center font-black text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>

                  <textarea
                    value={kriterPuanlari[kriter.id]?.yorum || ""}
                    onChange={(event) =>
                      updateKriterPuan(kriter.id, "yorum", event.target.value)
                    }
                    placeholder="Bu kriter için kısa yorum"
                    className="min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Genel Yorum
          </label>
          <textarea
            value={genelYorum}
            onChange={(event) => setGenelYorum(event.target.value)}
            required
            placeholder="Çalışanın genel performansı ve gelişim alanları"
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        {hata && (
          <div className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">
            {hata}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || kriterler.length === 0}
          className="rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-8 py-3 font-black text-slate-900 shadow-lg shadow-yellow-200 transition hover:from-yellow-200 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Kaydediliyor..." : "Değerlendirme Oluştur"}
        </button>
      </form>
    </div>
  );
}
