"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  recordId: string;
  currentRole: string;
  currentActive: boolean;
};

const roller = ["Admin", "İK", "Yönetici", "Değerlendirici", "Çalışan"];

export default function KullaniciYonetimiActions({
  recordId,
  currentRole,
  currentActive,
}: Props) {
  const router = useRouter();

  const [role, setRole] = useState(currentRole || "Çalışan");
  const [active, setActive] = useState(currentActive);
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");

  async function handleSave() {
    setLoading(true);
    setHata("");

    try {
      const response = await fetch(`/api/kullanicilar/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role,
          active
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Kullanıcı güncellenemedi.");
      }

      router.refresh();
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <select
        value={role}
        onChange={(event) => setRole(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
      >
        {roller.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        value={active ? "active" : "passive"}
        onChange={(event) => setActive(event.target.value === "active")}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
      >
        <option value="active">Aktif</option>
        <option value="passive">Pasif</option>
      </select>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="w-full rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-4 py-2 text-xs font-black text-slate-900 shadow-md transition hover:from-yellow-200 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>

      {hata && (
        <p className="text-xs font-bold text-red-600">{hata}</p>
      )}
    </div>
  );
}
