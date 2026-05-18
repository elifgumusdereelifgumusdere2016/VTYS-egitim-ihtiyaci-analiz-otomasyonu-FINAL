"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  recordId: string;
  durum: string;
};

type ActionType = "plan" | "start" | "complete" | "cancel";

export default function EgitimPlaniActions({ recordId, durum }: Props) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<ActionType | "">("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleAction(action: ActionType) {
    setLoadingAction(action);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/egitim-planlari/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "İşlem gerçekleştirilemedi.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Bir hata oluştu."
      );
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
      <p className="mb-3 text-sm font-bold text-slate-700">İşlemler</p>

      <div className="flex flex-wrap gap-3">
        {durum !== "Planlandı" && (
          <button
            type="button"
            onClick={() => handleAction("plan")}
            disabled={loadingAction !== ""}
            className="rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "plan" ? "Güncelleniyor..." : "Planlandı Yap"}
          </button>
        )}

        {durum !== "Devam Ediyor" && durum !== "Tamamlandı" && (
          <button
            type="button"
            onClick={() => handleAction("start")}
            disabled={loadingAction !== ""}
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "start" ? "Başlatılıyor..." : "Başlat"}
          </button>
        )}

        {durum !== "Tamamlandı" && (
          <button
            type="button"
            onClick={() => handleAction("complete")}
            disabled={loadingAction !== ""}
            className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "complete" ? "Tamamlanıyor..." : "Tamamla"}
          </button>
        )}

        {durum !== "İptal Edildi" && (
          <button
            type="button"
            onClick={() => handleAction("cancel")}
            disabled={loadingAction !== ""}
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "cancel" ? "İptal ediliyor..." : "İptal Et"}
          </button>
        )}
      </div>

      {errorMessage && (
        <p className="mt-3 text-sm font-medium text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
