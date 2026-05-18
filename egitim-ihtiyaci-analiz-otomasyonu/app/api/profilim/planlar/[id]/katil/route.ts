import { NextResponse } from "next/server";
import {
  createAirtableRecord,
  getAirtableRecordById,
  getAirtableRecords,
} from "@/lib/airtable";
import { getCurrentAppUser } from "@/lib/yetki";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
  "Notification Status"?: string;
  "Reminder Count"?: number;
  "Participant Response Source"?: string;
};

type PlanFields = {
  "Durum"?: string;
  "Frontend Visible"?: boolean;
  "API Status"?: string;
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
    const emailMatch =
      normalize(calisan.fields["E-posta"]) === normalize(appUser.email);

    const userLinkMatch =
      appUser.airtableRecordId &&
      getArray(calisan.fields["Kullanıcı Hesabı"]).includes(
        appUser.airtableRecordId
      );

    return emailMatch || userLinkMatch;
  });
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const appUser = await getCurrentAppUser();

    if (!appUser.id) {
      return NextResponse.json(
        { message: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const currentEmployee = await findCurrentEmployee(appUser);

    if (!currentEmployee) {
      return NextResponse.json(
        { message: "Çalışan profili bulunamadı." },
        { status: 404 }
      );
    }

    const plan = await getAirtableRecordById<PlanFields>("Eğitim Planları", id);

    if (plan.fields["API Status"] === "Archived") {
      return NextResponse.json(
        { message: "Bu eğitim planı aktif değil." },
        { status: 400 }
      );
    }

    const katilimcilar =
      await getAirtableRecords<KatilimciFields>("Eğitim Planı Katılımcıları");

    const alreadyJoined = katilimcilar.some((record) => {
      return (
        getArray(record.fields["Eğitim Planı"]).includes(id) &&
        getArray(record.fields["Çalışan"]).includes(currentEmployee.id)
      );
    });

    if (alreadyJoined) {
      return NextResponse.json(
        { message: "Bu eğitim planına zaten katıldınız." },
        { status: 400 }
      );
    }

    const createdRecord = await createAirtableRecord<KatilimciFields>(
      "Eğitim Planı Katılımcıları",
      {
        "Eğitim Planı": [id],
        "Çalışan": [currentEmployee.id],
        "Katılım Durumu": "Katılacak",
        "Tamamlama Durumu": "Bekliyor",
        "Sertifika Verildi Mi": false,
        "Notification Status": "Pending",
        "Reminder Count": 0,
        "Participant Response Source": "Employee",
      }
    );

    return NextResponse.json({
      success: true,
      record: createdRecord,
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