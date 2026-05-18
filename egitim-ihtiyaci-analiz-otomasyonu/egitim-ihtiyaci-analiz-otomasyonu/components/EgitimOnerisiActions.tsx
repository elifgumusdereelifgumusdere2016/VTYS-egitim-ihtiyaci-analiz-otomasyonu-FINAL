"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  recordId: string;
  durum: string;
};

export default function EgitimOnerisiActions({ recordId, durum }: Props) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"" | "approve" | "reject">("");
  const [errorMessage, setErrorMessage] = useState("");

  const finalDurumlar = ["Onaylandı", "Reddedildi", "Eğitim Planına Eklendi"];

  if (finalDurumlar.includes(durum)) {
    return null;
  }

  async function handleAction(action: "approve" | "reject") {
    setLoadingAction(action);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/egitim-onerileri/${recordId}`, {
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
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleAction("approve")}
          disabled={loadingAction !== ""}
          className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "approve" ? "Onaylanıyor..." : "Onayla"}
        </button>

        <button
          type="button"
          onClick={() => handleAction("reject")}
          disabled={loadingAction !== ""}
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "reject" ? "Reddediliyor..." : "Reddet"}
        </button>
      </div>

      {errorMessage && (
        <p className="mt-3 text-sm font-medium text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
