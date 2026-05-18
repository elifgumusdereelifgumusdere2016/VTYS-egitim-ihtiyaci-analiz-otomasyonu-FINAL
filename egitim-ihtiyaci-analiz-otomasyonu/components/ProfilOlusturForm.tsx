"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  defaultName: string;
  defaultEmail: string;
};

export default function ProfilOlusturForm({ defaultName, defaultEmail }: Props) {
  const router = useRouter();

  const [adSoyad, setAdSoyad] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [pozisyon, setPozisyon] = useState("");
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setHata("");

    try {
      const response = await fetch("/api/profilim/calisan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          adSoyad,
          email,
          pozisyon
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profil oluşturulamadı.");
      }

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
      className="mt-6 max-w-3xl rounded-3xl border border-yellow-100 bg-yellow-50/70 p-6"
    >
      <h4 className="text-xl font-black text-slate-900">
        Çalışan Profili Oluştur
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Profil bilgilerinizi girerek çalışan kaydınızı oluşturabilirsiniz.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Ad Soyad
          </label>
          <input
            value={adSoyad}
            onChange={(event) => setAdSoyad(event.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            E-posta
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Pozisyon
          </label>
          <input
            value={pozisyon}
            onChange={(event) => setPozisyon(event.target.value)}
            placeholder="Örnek: İnsan Kaynakları Uzmanı"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
      </div>

      {hata && (
        <div className="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">
          {hata}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-8 py-3 font-black text-slate-900 shadow-lg shadow-yellow-200 transition hover:from-yellow-200 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Oluşturuluyor..." : "Profilimi Oluştur"}
      </button>
    </form>
  );
}
