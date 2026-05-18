"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OnboardingFormProps = {
  defaultName: string;
  defaultEmail: string;
};

const roles = [
  { value: "Admin", label: "Admin", description: "TÃ¼m sisteme tam eriÅŸim saÄŸlar." },
  { value: "HR", label: "Ä°K", description: "Ã‡alÄ±ÅŸanlarÄ±, deÄŸerlendirmeleri ve eÄŸitim planlarÄ±nÄ± yÃ¶netir." },
  { value: "Manager", label: "YÃ¶netici", description: "Departman ihtiyaÃ§larÄ±nÄ± takip eder ve onay sÃ¼reÃ§lerini yÃ¶netir." },
  { value: "Evaluator", label: "DeÄŸerlendirici", description: "Ã‡alÄ±ÅŸan deÄŸerlendirmeleri oluÅŸturur." },
  { value: "Employee", label: "Ã‡alÄ±ÅŸan", description: "Kendi deÄŸerlendirme ve eÄŸitim bilgilerini gÃ¶rÃ¼ntÃ¼ler." },
];

export default function OnboardingForm({
  defaultName,
  defaultEmail,
}: OnboardingFormProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [role, setRole] = useState("Employee");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          email,
          role,
          department,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Onboarding tamamlanamadÄ±.");
      }

      router.push("/profilim");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Bir hata oluÅŸtu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Ad Soyad
        </label>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="w-full rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-slate-900 shadow-sm outline-none backdrop-blur focus:ring-2 focus:ring-yellow-300"
          placeholder="Ad soyad gir"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          E-posta
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-slate-900 shadow-sm outline-none backdrop-blur focus:ring-2 focus:ring-yellow-300"
          placeholder="E-posta adresini gir"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Departman
        </label>
        <input
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="w-full rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-slate-900 shadow-sm outline-none backdrop-blur focus:ring-2 focus:ring-yellow-300"
          placeholder="Ã–rnek: Ä°K, YazÄ±lÄ±m, SatÄ±ÅŸ"
        />
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-slate-700">
          KullanÄ±m RolÃ¼nÃ¼ SeÃ§
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {roles.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRole(item.value)}
              className={`rounded-3xl border p-4 text-left transition ${
                role === item.value
                  ? "border-yellow-300 bg-yellow-100/80 shadow-md"
                  : "border-white/70 bg-white/60 hover:bg-white/80"
              }`}
            >
              <p className="font-bold text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm text-slate-500">
                {item.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 px-8 py-4 font-bold text-slate-900 shadow-xl shadow-yellow-200 transition hover:from-yellow-200 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Kaydediliyor..." : "Dashboard'a Devam Et"}
      </button>
    </form>
  );
}
