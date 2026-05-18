import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiYetki";
import {
  getAirtableRecordById,
  updateAirtableRecord,
} from "@/lib/airtable";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type KullaniciFields = {
  "Ad Soyad"?: string;
  "E-posta"?: string;
  "Rol"?: string;
  "Clerk User ID"?: string;
  "Aktif Mi"?: boolean;
};

const allowedRoles = ["Admin", "İK", "Yönetici", "Değerlendirici", "Çalışan"];

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const access = await requireApiRole(["Admin", "İK"]);

    if (access.denied) {
      return access.denied;
    }

    const { id } = await context.params;
    const body = await request.json();

    const role = String(body.role || "").trim();
    const active = Boolean(body.active);

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { message: "Geçersiz kullanıcı rolü." },
        { status: 400 }
      );
    }

    if (access.user.role !== "Admin" && role === "Admin") {
      return NextResponse.json(
        { message: "Admin rolü sadece Admin tarafından atanabilir." },
        { status: 403 }
      );
    }

    const targetUser = await getAirtableRecordById<KullaniciFields>(
      "Kullanıcılar",
      id
    );

    if (
      targetUser.fields["Clerk User ID"] === access.user.id &&
      active === false
    ) {
      return NextResponse.json(
        { message: "Kendi hesabınızı pasif hale getiremezsiniz." },
        { status: 400 }
      );
    }

    const updatedRecord = await updateAirtableRecord<KullaniciFields>(
      "Kullanıcılar",
      id,
      {
        "Rol": role,
        "Aktif Mi": active,
      }
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