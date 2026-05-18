import { NextResponse } from "next/server";
import { createAirtableRecord, getAirtableRecords } from "@/lib/airtable";
import { getCurrentAppUser } from "@/lib/yetki";

type CalisanFields = {
  "Ad Soyad"?: string;
  "E-posta"?: string;
  "Pozisyon"?: string;
  "Durum"?: string;
  "Profil Görünür Mü"?: boolean;
  "Kullanıcı Hesabı"?: string[];
};

export async function POST(request: Request) {
  try {
    const appUser = await getCurrentAppUser();

    if (!appUser.id) {
      return NextResponse.json(
        { message: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const adSoyad = String(body.adSoyad || "").trim();
    const email = String(body.email || "").trim();
    const pozisyon = String(body.pozisyon || "").trim();

    if (!adSoyad) {
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

    const calisanlar = await getAirtableRecords<CalisanFields>("Çalışanlar");

    const existingEmployee = calisanlar.find((record) => {
      return String(record.fields["E-posta"] || "")
        .trim()
        .toLocaleLowerCase("tr-TR") === email.toLocaleLowerCase("tr-TR");
    });

    if (existingEmployee) {
      return NextResponse.json(
        { message: "Bu e-posta ile çalışan profili zaten var." },
        { status: 400 }
      );
    }

    const fields: CalisanFields = {
      "Ad Soyad": adSoyad,
      "E-posta": email,
      "Pozisyon": pozisyon,
      "Durum": "Aktif",
      "Profil Görünür Mü": true,
    };

    if (appUser.airtableRecordId) {
      fields["Kullanıcı Hesabı"] = [appUser.airtableRecordId];
    }

    const createdRecord = await createAirtableRecord<CalisanFields>(
      "Çalışanlar",
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