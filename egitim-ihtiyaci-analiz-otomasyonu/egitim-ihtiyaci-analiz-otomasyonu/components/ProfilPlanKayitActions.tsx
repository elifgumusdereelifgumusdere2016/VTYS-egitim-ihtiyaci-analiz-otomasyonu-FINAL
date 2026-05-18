"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  planId: string;
};

export default function ProfilPlanKayitActions({ planId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");

  async function handleJoin() {
    setLoading(true);
    setHata("");

    try {
      const response = await fetch(`/api/profilim/planlar/${planId}/katil`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Eğitim planına katılım oluşturulamadı.");
      }

      router.refresh();
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleJoin}
        disabled={loading}
        className="rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-5 py-2 text-xs font-black text-slate-900 shadow-md transition hover:from-yellow-200 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Kaydediliyor..." : "Eğitime Katıl"}
      </button>

      {hata && (
        <p className="mt-3 text-sm font-bold text-red-600">{hata}</p>
      )}
    </div>
  );
}
