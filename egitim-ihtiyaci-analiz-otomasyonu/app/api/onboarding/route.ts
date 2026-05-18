import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createAirtableRecord,
  getAirtableRecords,
  updateAirtableRecord,
} from "@/lib/airtable";

type UserFields = {
  "Ad Soyad"?: string;
  "E-posta"?: string;
  "Rol"?: string;
  "Clerk User ID"?: string;
  "Auth Provider"?: string;
  "Aktif Mi"?: boolean;
  "Son Giriş Tarihi"?: string;
  "Notlar"?: string;
};

type CalisanFields = {
  "Ad Soyad"?: string;
  "E-posta"?: string;
  "Pozisyon"?: string;
  "Durum"?: string;
  "Profil Görünür Mü"?: boolean;
  "Kullanıcı Hesabı"?: string[];
  "Notlar"?: string;
};

function normalize(value: unknown) {
  return String(value || "").trim().toLocaleLowerCase("tr-TR");
}

function mapRoleToAirtableRole(role: string) {
  const roleMap: Record<string, string> = {
    Admin: "Admin",
    HR: "İK",
    Manager: "Yönetici",
    Evaluator: "Değerlendirici",
    Employee: "Çalışan",
  };

  return roleMap[role] || "Çalışan";
}

function getRolePosition(role: string) {
  const roleMap: Record<string, string> = {
    Admin: "Sistem Yöneticisi",
    HR: "İnsan Kaynakları",
    Manager: "Yönetici",
    Evaluator: "Değerlendirici",
    Employee: "Çalışan",
  };

  return roleMap[role] || "Çalışan";
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const primaryEmail =
      user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)
        ?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      "";

    const displayName = String(body.displayName || "").trim();
    const email = String(body.email || primaryEmail).trim();
    const role = String(body.role || "Employee").trim();
    const department = String(body.department || "").trim();

    if (!displayName) {
      return NextResponse.json(
        { message: "Ad soyad zorunludur." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { message: "E-posta zorunludur." },
        { status: 400 }
      );
    }

    const airtableRole = mapRoleToAirtableRole(role);
    const now = new Date().toISOString();

    const kullanicilar = await getAirtableRecords<UserFields>("Kullanıcılar");

    let appUserRecord = kullanicilar.find((record) => {
      return (
        record.fields["Clerk User ID"] === user.id ||
        normalize(record.fields["E-posta"]) === normalize(email)
      );
    });

    if (appUserRecord) {
      appUserRecord = await updateAirtableRecord<UserFields>(
        "Kullanıcılar",
        appUserRecord.id,
        {
          "Ad Soyad": displayName,
          "E-posta": email,
          "Rol": airtableRole,
          "Clerk User ID": user.id,
          "Auth Provider": "Clerk",
          "Aktif Mi": true,
          "Son Giriş Tarihi": now,
          "Onboarding Completed": true,
          "Last Sync Source": "Clerk",
          "Notlar": department
            ? `Onboarding güncellendi. Departman: ${department}.`
            : "Onboarding güncellendi.",
        }
      );
    } else {
      appUserRecord = await createAirtableRecord<UserFields>("Kullanıcılar", {
        "Ad Soyad": displayName,
        "E-posta": email,
        "Rol": airtableRole,
        "Clerk User ID": user.id,
        "Auth Provider": "Clerk",
        "Aktif Mi": true,
        "Son Giriş Tarihi": now,
        "Notlar": department
          ? `Onboarding tamamlandı. Departman: ${department}.`
          : "Onboarding tamamlandı.",
      });
    }

    const calisanlar = await getAirtableRecords<CalisanFields>("Çalışanlar");

    const existingEmployee = calisanlar.find((record) => {
      return normalize(record.fields["E-posta"]) === normalize(email);
    });

    if (existingEmployee) {
      await updateAirtableRecord<CalisanFields>(
        "Çalışanlar",
        existingEmployee.id,
        {
          "Ad Soyad": displayName,
          "E-posta": email,
          "Pozisyon": getRolePosition(role),
          "Durum": "Aktif",
          "Profil Görünür Mü": true,
          "Profile Source": "Onboarding",
          "Last Profile Sync": now,
          "Kullanıcı Hesabı": [appUserRecord.id],
          "Notlar": department
            ? `Kullanıcı hesabı ile eşleştirildi. Departman: ${department}.`
            : "Kullanıcı hesabı ile eşleştirildi.",
        }
      );
    } else {
      await createAirtableRecord<CalisanFields>("Çalışanlar", {
        "Ad Soyad": displayName,
        "E-posta": email,
        "Pozisyon": getRolePosition(role),
        "Durum": "Aktif",
        "Profil Görünür Mü": true,
        "Kullanıcı Hesabı": [appUserRecord.id],
        "Notlar": department
          ? `Onboarding ile oluşturuldu. Departman: ${department}.`
          : "Onboarding ile oluşturuldu.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Profiliniz oluşturuldu.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}
