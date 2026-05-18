import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiYetki";
import { updateAirtableRecord } from "@/lib/airtable";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PlanUpdateFields = {
  "Durum"?: string;
  "API Status"?: string;
  "Frontend Visible"?: boolean;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const access = await requireApiRole(["Admin", "İK"]);

    if (access.denied) {
      return access.denied;
    }
    const { id } = await context.params;
    const body = await request.json();
    const action = String(body.action || "").trim();

    let fields: PlanUpdateFields;

    if (action === "plan") {
      fields = {
        "Durum": "Planlandı",
        "API Status": "Ready",
        "Frontend Visible": true,
      };
    } else if (action === "start") {
      fields = {
        "Durum": "Devam Ediyor",
        "API Status": "Ready",
        "Frontend Visible": true,
      };
    } else if (action === "complete") {
      fields = {
        "Durum": "Tamamlandı",
        "API Status": "Ready",
        "Frontend Visible": true,
      };
    } else if (action === "cancel") {
      fields = {
        "Durum": "İptal Edildi",
        "API Status": "Archived",
        "Frontend Visible": false,
      };
    } else {
      return NextResponse.json(
        { message: "Geçersiz işlem." },
        { status: 400 }
      );
    }

    const updatedRecord = await updateAirtableRecord<PlanUpdateFields>(
      "Eğitim Planları",
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