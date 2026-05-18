"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CalisanOption = {
  id: string;
  label: string;
};

type KatilimciItem = {
  id: string;
  calisanIds: string[];
  calisanAdi: string;
};

type Props = {
  planId: string;
  calisanlar: CalisanOption[];
  katilimcilar: KatilimciItem[];
};

export default function EgitimPlaniKatilimciYonetimi({
  planId,
  calisanlar,
  katilimcilar,
}: Props) {
  const router = useRouter();

  const mevcutCalisanIds = useMemo(() => {
    return new Set(katilimcilar.flatMap((katilimci) => katilimci.calisanIds));
  }, [katilimcilar]);

  const eklenebilirCalisanlar = calisanlar.filter(
    (calisan) => !mevcutCalisanIds.has(calisan.id)
  );

  const [selectedCalisanId, setSelectedCalisanId] = useState(
    eklenebilirCalisanlar[0]?.id || ""
  );
  const [loadingAction, setLoadingAction] = useState("");
  const [hata, setHata] = useState("");

  async function handleAdd() {
    if (!selectedCalisanId) {
      setHata("Eklenecek çalışan seçilmelidir.");
      return;
    }

    setLoadingAction("add");
    setHata("");

    try {
      const response = await fetch(`/api/egitim-planlari/${planId}/katilimcilar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          calisanId: selectedCalisanId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Katılımcı eklenemedi.");
      }

      router.refresh();
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoadingAction("");
    }
  }

  async function handleRemove(katilimciId: string) {
    setLoadingAction(katilimciId);
    setHata("");

    try {
      const response = await fetch(
        `/api/egitim-planlari/${planId}/katilimcilar?katilimciId=${katilimciId}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Katılımcı çıkarılamadı.");
      }

      router.refresh();
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-bold text-slate-900">Katılımcılar</p>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
          {katilimcilar.length} kişi
        </span>
      </div>

      {katilimcilar.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">
          Katılımcı kaydı bulunamadı.
        </p>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {katilimcilar.map((katilimci) => (
            <div
              key={katilimci.id}
              className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
            >
              <span>{katilimci.calisanAdi}</span>

              <button
                type="button"
                onClick={() => handleRemove(katilimci.id)}
                disabled={loadingAction !== ""}
                className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-black text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === katilimci.id ? "..." : "Çıkar"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
        <select
          value={selectedCalisanId}
          onChange={(event) => setSelectedCalisanId(event.target.value)}
          disabled={eklenebilirCalisanlar.length === 0}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-60"
        >
          {eklenebilirCalisanlar.length === 0 ? (
            <option value="">Tüm çalışanlar eklendi</option>
          ) : (
            eklenebilirCalisanlar.map((calisan) => (
              <option key={calisan.id} value={calisan.id}>
                {calisan.label}
              </option>
            ))
          )}
        </select>

        <button
          type="button"
          onClick={handleAdd}
          disabled={loadingAction !== "" || eklenebilirCalisanlar.length === 0}
          className="rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-5 py-3 text-xs font-black text-slate-900 shadow-md transition hover:from-yellow-200 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "add" ? "Ekleniyor..." : "Katılımcı Ekle"}
        </button>
      </div>

      {hata && (
        <p className="mt-3 text-sm font-bold text-red-600">
          {hata}
        </p>
      )}
    </div>
  );
}
