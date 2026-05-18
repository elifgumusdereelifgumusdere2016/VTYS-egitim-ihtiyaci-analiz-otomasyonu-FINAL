import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiYetki";
import {
  createAirtableRecord,
  deleteAirtableRecord,
  getAirtableRecords,
} from "@/lib/airtable";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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

export async function POST(request: Request, context: RouteContext) {
  try {
    const access = await requireApiRole(["Admin", "İK"]);

    if (access.denied) {
      return access.denied;
    }
    const { id } = await context.params;
    const body = await request.json();
    const calisanId = String(body.calisanId || "").trim();

    if (!calisanId) {
      return NextResponse.json(
        { message: "Çalışan seçimi zorunludur." },
        { status: 400 }
      );
    }

    const mevcutKatilimcilar =
      await getAirtableRecords<KatilimciFields>("Eğitim Planı Katılımcıları");

    const zatenVar = mevcutKatilimcilar.some((katilimci) => {
      return (
        katilimci.fields["Eğitim Planı"]?.includes(id) &&
        katilimci.fields["Çalışan"]?.includes(calisanId)
      );
    });

    if (zatenVar) {
      return NextResponse.json(
        { message: "Bu çalışan zaten eğitim planına eklenmiş." },
        { status: 400 }
      );
    }

    const createdRecord = await createAirtableRecord<KatilimciFields>(
      "Eğitim Planı Katılımcıları",
      {
        "Eğitim Planı": [id],
        "Çalışan": [calisanId],
        "Katılım Durumu": "Davet Edildi",
        "Tamamlama Durumu": "Bekliyor",
        "Sertifika Verildi Mi": false,
        "Notification Status": "Pending",
        "Reminder Count": 0,
        "Participant Response Source": "Admin",
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

export async function DELETE(request: Request) {
  try {
    const access = await requireApiRole(["Admin", "İK"]);

    if (access.denied) {
      return access.denied;
    }
    const url = new URL(request.url);
    const katilimciId = url.searchParams.get("katilimciId");

    if (!katilimciId) {
      return NextResponse.json(
        { message: "Katılımcı kaydı bulunamadı." },
        { status: 400 }
      );
    }

    const deletedRecord = await deleteAirtableRecord(
      "Eğitim Planı Katılımcıları",
      katilimciId
    );

    return NextResponse.json({
      success: true,
      record: deletedRecord,
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