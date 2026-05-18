import { NextResponse } from "next/server";
import {
  getAirtableRecordById,
  getAirtableRecords,
  updateAirtableRecord,
} from "@/lib/airtable";
import { getCurrentAppUser } from "@/lib/yetki";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AnyFields = Record<string, unknown>;

type CalisanFields = {
  "Ad Soyad"?: string;
  "E-posta"?: string;
  "Kullanıcı Hesabı"?: string[];
};

type KatilimciFields = {
  "Eğitim Planı"?: string[];
  "Çalışan"?: string[];
  "Katılım Durumu"?: string;
  "Tamamlama Durumu"?: string;
  "Sertifika Verildi Mi"?: boolean;
  "Participant Response Source"?: string;
};

function normalize(value: unknown) {
  return String(value || "").trim().toLocaleLowerCase("tr-TR");
}

function getArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

async function findCurrentEmployee(appUser: {
  email: string;
  airtableRecordId: string;
}) {
  const calisanlar = await getAirtableRecords<CalisanFields>("Çalışanlar");

  return calisanlar.find((calisan) => {
    const emailMatch = normalize(calisan.fields["E-posta"]) === normalize(appUser.email);

    const userLinkMatch =
      appUser.airtableRecordId &&
      getArray(calisan.fields["Kullanıcı Hesabı"]).includes(appUser.airtableRecordId);

    return emailMatch || userLinkMatch;
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const appUser = await getCurrentAppUser();

    if (!appUser.id) {
      return NextResponse.json(
        { message: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const action = String(body.action || "").trim();

    const currentEmployee = await findCurrentEmployee(appUser);

    if (!currentEmployee) {
      return NextResponse.json(
        { message: "Çalışan profili bulunamadı." },
        { status: 404 }
      );
    }

    const katilimci = await getAirtableRecordById<KatilimciFields>(
      "Eğitim Planı Katılımcıları",
      id
    );

    const ownsRecord = getArray(katilimci.fields["Çalışan"]).includes(
      currentEmployee.id
    );

    if (!ownsRecord) {
      return NextResponse.json(
        { message: "Bu katılım kaydını güncelleme yetkiniz yok." },
        { status: 403 }
      );
    }

    let fields: Partial<KatilimciFields>;

    if (action === "accept") {
      fields = {
        "Katılım Durumu": "Katılacak",
        "Participant Response Source": "Employee",
      };
    } else if (action === "decline") {
      fields = {
        "Katılım Durumu": "Katılamayacak",
        "Tamamlama Durumu": "Tamamlanmadı",
        "Participant Response Source": "Employee",
      };
    } else if (action === "complete") {
      fields = {
        "Katılım Durumu": "Katıldı",
        "Tamamlama Durumu": "Tamamlandı",
        "Participant Response Source": "Employee",
      };
    } else {
      return NextResponse.json(
        { message: "Geçersiz işlem." },
        { status: 400 }
      );
    }

    const updatedRecord = await updateAirtableRecord<KatilimciFields>(
      "Eğitim Planı Katılımcıları",
      id,
      fields
    );

    return NextResponse.json({
      success: true,
      record: updatedRecord,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Beklenmeyen bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}