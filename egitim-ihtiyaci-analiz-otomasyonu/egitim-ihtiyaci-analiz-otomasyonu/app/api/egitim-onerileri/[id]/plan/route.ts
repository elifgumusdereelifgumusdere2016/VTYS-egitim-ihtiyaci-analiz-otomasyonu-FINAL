import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiYetki";
import {
  createAirtableRecord,
  getAirtableRecordById,
  updateAirtableRecord,
} from "@/lib/airtable";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type OneriFields = {
  "Öneri No"?: string;
  "Çalışan"?: string[];
  "Kriter"?: string[];
  "Önerilen Eğitim"?: string[];
  "Öncelik"?: string;
  "Durum"?: string;
};

type PlanCreateFields = {
  "Plan Adı"?: string;
  "Eğitim"?: string[];
  "Başlangıç Tarihi"?: string;
  "Bitiş Tarihi"?: string;
  "Durum"?: string;
  "İlgili Öneriler"?: string[];
  "Açıklama"?: string;
  "API Status"?: string;
  "Frontend Visible"?: boolean;
  "Source"?: string;
  "n8n Status"?: string;
  "Automation Error"?: string;
  "Notification Status"?: string;
  "Reminder Count"?: number;
};

type KatilimciCreateFields = {
  "Eğitim Planı"?: string[];
  "Çalışan"?: string[];
  "Katılım Durumu"?: string;
  "Tamamlama Durumu"?: string;
  "Sertifika Verildi Mi"?: boolean;
  "Notification Status"?: string;
  "Reminder Count"?: number;
  "Participant Response Source"?: string;
};

type OneriUpdateFields = {
  "Durum"?: string;
  "API Status"?: string;
  "Frontend Visible"?: boolean;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const access = await requireApiRole(["Admin", "İK"]);

    if (access.denied) {
      return access.denied;
    }
    const { id } = await context.params;
    const body = await request.json();

    const baslangicTarihi = String(body.baslangicTarihi || "").trim();
    const bitisTarihi = String(body.bitisTarihi || "").trim();

    if (!baslangicTarihi || !bitisTarihi) {
      return NextResponse.json(
        { message: "Başlangıç ve bitiş tarihi zorunludur." },
        { status: 400 }
      );
    }

    const oneri = await getAirtableRecordById<OneriFields>(
      "Eğitim Önerileri",
      id
    );

    if (oneri.fields["Durum"] !== "Onaylandı") {
      return NextResponse.json(
        { message: "Sadece onaylanmış öneriler eğitim planına dönüştürülebilir." },
        { status: 400 }
      );
    }

    const egitimIds = oneri.fields["Önerilen Eğitim"] || [];
    const calisanIds = oneri.fields["Çalışan"] || [];

    if (egitimIds.length === 0) {
      return NextResponse.json(
        { message: "Bu öneride bağlı eğitim bulunamadı." },
        { status: 400 }
      );
    }

    const planAdi = `Öneriden Oluşturulan Eğitim Planı - ${
      oneri.fields["Öneri No"] || id.slice(-5)
    }`;

    const createdPlan = await createAirtableRecord<PlanCreateFields>(
      "Eğitim Planları",
      {
        "Plan Adı": planAdi,
        "Eğitim": egitimIds,
        "Başlangıç Tarihi": baslangicTarihi,
        "Bitiş Tarihi": bitisTarihi,
        "Durum": "Planlandı",
        "İlgili Öneriler": [id],
        "Açıklama": "Onaylanan eğitim önerisinden oluşturuldu.",
        "API Status": "Ready",
        "Frontend Visible": true,
        "Source": "Rule-Based",
        "n8n Status": "Pending",
        "Automation Error": "",
        "Notification Status": "Pending",
        "Reminder Count": 0,
      }
    );

    if (calisanIds.length > 0) {
      await createAirtableRecord<KatilimciCreateFields>(
        "Eğitim Planı Katılımcıları",
        {
          "Eğitim Planı": [createdPlan.id],
          "Çalışan": [calisanIds[0]],
          "Katılım Durumu": "Davet Edildi",
          "Tamamlama Durumu": "Bekliyor",
          "Sertifika Verildi Mi": false,
          "Notification Status": "Pending",
          "Reminder Count": 0,
          "Participant Response Source": "System",
        }
      );
    }

    await updateAirtableRecord<OneriUpdateFields>("Eğitim Önerileri", id, {
      "Durum": "Eğitim Planına Eklendi",
      "API Status": "Ready",
      "Frontend Visible": true,
    });

    return NextResponse.json({
      success: true,
      plan: createdPlan,
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