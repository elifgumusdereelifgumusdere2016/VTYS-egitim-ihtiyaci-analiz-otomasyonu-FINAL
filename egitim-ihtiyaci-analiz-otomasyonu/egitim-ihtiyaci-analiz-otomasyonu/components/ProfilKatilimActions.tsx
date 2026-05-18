"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  katilimciId: string;
  katilimDurumu: string;
  tamamlamaDurumu: string;
};

type ActionType = "accept" | "decline" | "complete";

export default function ProfilKatilimActions({
  katilimciId,
  katilimDurumu,
  tamamlamaDurumu,
}: Props) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<ActionType | "">("");
  const [hata, setHata] = useState("");

  async function handleAction(action: ActionType) {
    setLoadingAction(action);
    setHata("");

    try {
      const response = await fetch(`/api/profilim/katilim/${katilimciId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Katılım durumu güncellenemedi.");
      }

      router.refresh();
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div className="mt-4 rounded-3xl border border-yellow-100 bg-yellow-50/70 p-4">
      <p className="mb-3 text-sm font-black text-slate-900">
        Katılım İşlemleri
      </p>

      <div className="flex flex-wrap gap-3">
        {katilimDurumu !== "Katılacak" && (
          <button
            type="button"
            onClick={() => handleAction("accept")}
            disabled={loadingAction !== ""}
            className="rounded-full bg-green-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "accept" ? "Güncelleniyor..." : "Katılacağım"}
          </button>
        )}

        {katilimDurumu !== "Katılamayacak" && (
          <button
            type="button"
            onClick={() => handleAction("decline")}
            disabled={loadingAction !== ""}
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "decline" ? "Güncelleniyor..." : "Katılamayacağım"}
          </button>
        )}

        {tamamlamaDurumu !== "Tamamlandı" && katilimDurumu !== "Katılamayacak" && (
          <button
            type="button"
            onClick={() => handleAction("complete")}
            disabled={loadingAction !== ""}
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "complete" ? "Güncelleniyor..." : "Tamamladım"}
          </button>
        )}
      </div>

      {hata && <p className="mt-3 text-sm font-bold text-red-600">{hata}</p>}
    </div>
  );
}
