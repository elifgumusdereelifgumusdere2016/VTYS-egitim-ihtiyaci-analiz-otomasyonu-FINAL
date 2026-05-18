import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiYetki";
import { updateAirtableRecord } from "@/lib/airtable";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type OneriUpdateFields = {
  "Durum"?: string;
  "API Status"?: string;
  "Frontend Visible"?: boolean;
  "Approved By User ID"?: string;
  "Approved At"?: string;
  "n8n Status"?: string;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const access = await requireApiRole(["Admin", "İK", "Yönetici"]);

    if (access.denied) {
      return access.denied;
    }
    const { id } = await context.params;
    const body = await request.json();
    const action = String(body.action || "").trim();

    let fields: OneriUpdateFields;

    if (action === "approve") {
      fields = {
        "Durum": "Onaylandı",
        "API Status": "Ready",
        "Frontend Visible": true,
        "Approved By User ID": access.user.id,
        "Approved At": new Date().toISOString(),
        "n8n Status": "Pending",
      };
    } else if (action === "reject") {
      fields = {
        "Durum": "Reddedildi",
        "API Status": "Archived",
        "Frontend Visible": false,
      };
    } else {
      return NextResponse.json(
        { message: "Geçersiz işlem." },
        { status: 400 }
      );
    }

    const updatedRecord = await updateAirtableRecord<OneriUpdateFields>(
      "Eğitim Önerileri",
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