import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiYetki";
import { createAirtableRecord } from "@/lib/airtable";

type PlanCreateFields = {
  "Plan Adı"?: string;
  "Eğitim"?: string[];
  "Sorumlu Kişi"?: string[];
  "Başlangıç Tarihi"?: string;
  "Bitiş Tarihi"?: string;
  "Durum"?: string;
  "Açıklama"?: string;
  "API Status"?: string;
  "Frontend Visible"?: boolean;
  "Source"?: string;
  "n8n Status"?: string;
  "Automation Error"?: string;
  "Notification Status"?: string;
  "Reminder Count"?: number;
};

export async function POST(request: Request) {
  try {
    const access = await requireApiRole(["Admin", "İK"]);

    if (access.denied) {
      return access.denied;
    }
    const body = await request.json();

    const planAdi = String(body.planAdi || "").trim();
    const egitimId = String(body.egitimId || "").trim();
    const sorumluKisiId = String(body.sorumluKisiId || "").trim();
    const baslangicTarihi = String(body.baslangicTarihi || "").trim();
    const bitisTarihi = String(body.bitisTarihi || "").trim();
    const aciklama = String(body.aciklama || "").trim();

    if (!planAdi) {
      return NextResponse.json(
        { message: "Plan adı zorunludur." },
        { status: 400 }
      );
    }

    if (!egitimId) {
      return NextResponse.json(
        { message: "Eğitim seçimi zorunludur." },
        { status: 400 }
      );
    }

    if (!baslangicTarihi || !bitisTarihi) {
      return NextResponse.json(
        { message: "Başlangıç ve bitiş tarihi zorunludur." },
        { status: 400 }
      );
    }

    const fields: PlanCreateFields = {
      "Plan Adı": planAdi,
      "Eğitim": [egitimId],
      "Başlangıç Tarihi": baslangicTarihi,
      "Bitiş Tarihi": bitisTarihi,
      "Durum": "Planlandı",
      "Açıklama": aciklama,
      "API Status": "Ready",
      "Frontend Visible": true,
      "Source": "Manual",
      "n8n Status": "Pending",
      "Automation Error": "",
      "Notification Status": "Pending",
      "Reminder Count": 0,
    };

    if (sorumluKisiId) {
      fields["Sorumlu Kişi"] = [sorumluKisiId];
    }

    const createdRecord = await createAirtableRecord<PlanCreateFields>(
      "Eğitim Planları",
      fields
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