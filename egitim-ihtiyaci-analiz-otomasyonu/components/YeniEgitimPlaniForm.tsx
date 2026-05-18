"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: string;
  label: string;
};

type Props = {
  egitimler: Option[];
  kullanicilar: Option[];
};

export default function YeniEgitimPlaniForm({ egitimler, kullanicilar }: Props) {
  const router = useRouter();

  const [planAdi, setPlanAdi] = useState("");
  const [egitimId, setEgitimId] = useState(egitimler[0]?.id || "");
  const [sorumluKisiId, setSorumluKisiId] = useState(kullanicilar[0]?.id || "");
  const [baslangicTarihi, setBaslangicTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setHata("");

    try {
      const response = await fetch("/api/egitim-planlari", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          planAdi,
          egitimId,
          sorumluKisiId,
          baslangicTarihi,
          bitisTarihi,
          aciklama
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Eğitim planı oluşturulamadı.");
      }

      setPlanAdi("");
      setBaslangicTarihi("");
      setBitisTarihi("");
      setAciklama("");

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
        Yeni Eğitim Planı Oluştur
      </h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="xl:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Plan Adı
          </label>
          <input
            value={planAdi}
            onChange={(event) => setPlanAdi(event.target.value)}
            required
            placeholder="Örnek: Haziran 2026 Liderlik Eğitimi"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Eğitim
          </label>
          <select
            value={egitimId}
            onChange={(event) => setEgitimId(event.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          >
            {egitimler.map((egitim) => (
              <option key={egitim.id} value={egitim.id}>
                {egitim.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Sorumlu Kişi
          </label>
          <select
            value={sorumluKisiId}
            onChange={(event) => setSorumluKisiId(event.target.value)}
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
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            value={baslangicTarihi}
            onChange={(event) => setBaslangicTarihi(event.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Bitiş Tarihi
          </label>
          <input
            type="date"
            value={bitisTarihi}
            onChange={(event) => setBitisTarihi(event.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Açıklama
          </label>
          <textarea
            value={aciklama}
            onChange={(event) => setAciklama(event.target.value)}
            placeholder="Eğitim planı ile ilgili kısa açıklama"
            className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        {hata && (
          <div className="xl:col-span-2 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">
            {hata}
          </div>
        )}

        <div className="xl:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-8 py-3 font-black text-slate-900 shadow-lg shadow-yellow-200 transition hover:from-yellow-200 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Kaydediliyor..." : "Eğitim Planı Oluştur"}
          </button>
        </div>
      </form>
    </div>
  );
}
