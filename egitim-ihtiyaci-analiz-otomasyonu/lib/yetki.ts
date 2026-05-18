import { currentUser } from "@clerk/nextjs/server";
import { getAirtableRecords } from "@/lib/airtable";

export type KullaniciRolu =
  | "Admin"
  | "İK"
  | "Yönetici"
  | "Değerlendirici"
  | "Çalışan"
  | "Misafir";

type KullaniciFields = {
  "Ad Soyad"?: string;
  "E-posta"?: string;
  "Rol"?: string;
  "Clerk User ID"?: string;
  "Auth Provider"?: string;
  "Aktif Mi"?: boolean;
};

function normalizeRole(role: unknown): KullaniciRolu {
  const value = String(role || "").trim().toLocaleLowerCase("tr-TR");

  if (value === "admin") return "Admin";
  if (value === "ik" || value === "hr") return "İK";

  if (value === "yönetici" || value === "yonetici" || value === "manager") {
    return "Yönetici";
  }

  if (
    value === "değerlendirici" ||
    value === "degerlendirici" ||
    value === "evaluator"
  ) {
    return "Değerlendirici";
  }

  if (value === "çalışan" || value === "calisan" || value === "employee") {
    return "Çalışan";
  }

  return "Çalışan";
}

export async function getCurrentAppUser() {
  const user = await currentUser();

  if (!user) {
    return {
      id: "",
      airtableRecordId: "",
      name: "Misafir",
      email: "",
      role: "Misafir" as KullaniciRolu,
      active: false,
    };
  }

  const email =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)
      ?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";

  try {
    const kullanicilar = await getAirtableRecords<KullaniciFields>("Kullanıcılar");

    const airtableUser = kullanicilar.find((record) => {
      return (
        record.fields["Clerk User ID"] === user.id ||
        record.fields["E-posta"] === email
      );
    });

    return {
      id: user.id,
      airtableRecordId: airtableUser?.id || "",
      name:
        airtableUser?.fields["Ad Soyad"] ||
        user.fullName ||
        user.firstName ||
        "Kullanıcı",
      email,
      role: normalizeRole(airtableUser?.fields["Rol"]),
      active: airtableUser?.fields["Aktif Mi"] !== false,
    };
  } catch {
    return {
      id: user.id,
      airtableRecordId: "",
      name: user.fullName || user.firstName || "Kullanıcı",
      email,
      role: "Çalışan" as KullaniciRolu,
      active: true,
    };
  }
}

export function roleCanAccess(role: KullaniciRolu, allowedRoles: KullaniciRolu[]) {
  if (role === "Admin") {
    return true;
  }

  return allowedRoles.includes(role);
}
