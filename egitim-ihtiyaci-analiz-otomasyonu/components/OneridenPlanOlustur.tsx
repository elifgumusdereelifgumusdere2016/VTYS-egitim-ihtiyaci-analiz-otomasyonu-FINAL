"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  oneriId: string;
  durum: string;
};

export default function OneridenPlanOlustur({ oneriId, durum }: Props) {
  const router = useRouter();

  const [baslangicTarihi, setBaslangicTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");

  if (durum !== "Onaylandı") {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setHata("");

    try {
      const response = await fetch(`/api/egitim-onerileri/${oneriId}/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          baslangicTarihi,
          bitisTarihi
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Eğitim planı oluşturulamadı.");
      }

      setBaslangicTarihi("");
      setBitisTarihi("");

      router.refresh();
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 rounded-3xl border border-yellow-200 bg-yellow-50/80 p-4 shadow-sm"
    >
      <p className="mb-3 text-sm font-black text-slate-900">
        Bu öneriden eğitim planı oluştur
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            value={baslangicTarihi}
            onChange={(event) => setBaslangicTarihi(event.target.value)}
            required
            className="w-full rounded-2xl border border-yellow-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">
            Bitiş Tarihi
          </label>
          <input
            type="date"
            value={bitisTarihi}
            onChange={(event) => setBitisTarihi(event.target.value)}
            required
            className="w-full rounded-2xl border border-yellow-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
      </div>

      {hata && (
        <p className="mt-3 text-sm font-bold text-red-600">
          {hata}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-5 py-2 text-xs font-black text-slate-900 shadow-md transition hover:from-yellow-200 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Plan oluşturuluyor..." : "Plan Oluştur"}
      </button>
    </form>
  );
}
