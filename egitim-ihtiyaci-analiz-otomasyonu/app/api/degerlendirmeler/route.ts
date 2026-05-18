import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createAirtableRecord,
  getAirtableRecords,
} from "@/lib/airtable";

type AnyFields = Record<string, unknown>;

type DegerlendirmeCreateFields = {
  "Değerlendirme No"?: string;
  "Çalışan"?: string[];
  "Değerlendiren"?: string[];
  "Değerlendirme Tarihi"?: string;
  "Dönem"?: string;
  "Durum"?: string;
  "Genel Puan"?: number;
  "Genel Yorum"?: string;
  "API Status"?: string;
  "Created By User ID"?: string;
  "Updated By User ID"?: string;
  "n8n Status"?: string;
  "AI Status"?: string;
  "Automation Lock"?: boolean;
  "Automation Error"?: string;
  "AI Summary"?: string;
  "AI Recommendation Reason"?: string;
  "AI Recommendation Count"?: number;
};

type DegerlendirmeDetayCreateFields = {
  "Değerlendirme"?: string[];
  "Kriter"?: string[];
  "Puan"?: number;
  "Yorum"?: string;
};

type EgitimOnerisiCreateFields = {
  "Öneri No"?: string;
  "Çalışan"?: string[];
  "Değerlendirme"?: string[];
  "Kriter"?: string[];
  "Önerilen Eğitim"?: string[];
  "Sebep"?: string;
  "Öncelik"?: string;
  "Durum"?: string;
  "Öneri Tarihi"?: string;
  "API Status"?: string;
  "Frontend Visible"?: boolean;
  "Source"?: string;
  "AI Confidence Score"?: number;
  "n8n Status"?: string;
  "Automation Error"?: string;
  "AI Recommendation Reason"?: string;
};

type KriterPuanInput = {
  kriterId: string;
  puan: number;
  yorum: string;
};

function getReadableRecordName(record: { id: string; fields: AnyFields }, preferredFields: string[]) {
  for (const fieldName of preferredFields) {
    const value = record.fields[fieldName];

    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  const firstReadableString = Object.values(record.fields).find((value) => {
    return typeof value === "string" && value.trim() !== "";
  });

  if (typeof firstReadableString === "string") {
    return firstReadableString;
  }

  return record.id;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function calculatePriority(score: number) {
  if (score <= 2) {
    return "Yüksek";
  }

  if (score <= 3) {
    return "Orta";
  }

  return "Düşük";
}

function findTrainingForCriterion(
  kriterId: string,
  kriterName: string,
  egitimler: { id: string; fields: AnyFields }[]
) {
  const linkedMatch = egitimler.find((egitim) => {
    return Object.values(egitim.fields).some((value) => {
      return Array.isArray(value) && value.includes(kriterId);
    });
  });

  if (linkedMatch) {
    return linkedMatch.id;
  }

  const normalizedCriterion = kriterName.toLocaleLowerCase("tr-TR");

  const nameMatch = egitimler.find((egitim) => {
    const egitimName = getReadableRecordName(egitim, [
      "Eğitim Adı",
      "Name",
      "Training Name",
      "Ad",
    ]).toLocaleLowerCase("tr-TR");

    return (
      egitimName.includes(normalizedCriterion) ||
      normalizedCriterion
        .split(" ")
        .filter((word) => word.length > 3)
        .some((word) => egitimName.includes(word))
    );
  });

  if (nameMatch) {
    return nameMatch.id;
  }

  return egitimler[0]?.id || "";
}

export async function POST(request: Request) {
  try {
    const access = await requireApiRole(["Admin", "İK", "Yönetici", "Değerlendirici"]);

    if (access.denied) {
      return access.denied;
    }
    const user = await currentUser();
    const body = await request.json();

    const calisanId = String(body.calisanId || "").trim();
    const degerlendirenId = String(body.degerlendirenId || "").trim();
    const tarih = String(body.tarih || "").trim();
    const donem = String(body.donem || "").trim();
    const genelYorum = String(body.genelYorum || "").trim();

    const kriterPuanlari = Array.isArray(body.kriterPuanlari)
      ? (body.kriterPuanlari as KriterPuanInput[])
      : [];

    if (!calisanId) {
      return NextResponse.json(
        { message: "Çalışan seçimi zorunludur." },
        { status: 400 }
      );
    }

    if (!degerlendirenId) {
      return NextResponse.json(
        { message: "Değerlendiren seçimi zorunludur." },
        { status: 400 }
      );
    }

    if (!tarih) {
      return NextResponse.json(
        { message: "Değerlendirme tarihi zorunludur." },
        { status: 400 }
      );
    }

    if (!donem) {
      return NextResponse.json(
        { message: "Dönem bilgisi zorunludur." },
        { status: 400 }
      );
    }

    if (!genelYorum) {
      return NextResponse.json(
        { message: "Genel yorum zorunludur." },
        { status: 400 }
      );
    }

    if (kriterPuanlari.length === 0) {
      return NextResponse.json(
        { message: "En az bir yetkinlik puanı girilmelidir." },
        { status: 400 }
      );
    }

    const invalidScore = kriterPuanlari.find((item) => {
      return (
        !item.kriterId ||
        !Number.isFinite(Number(item.puan)) ||
        Number(item.puan) < 1 ||
        Number(item.puan) > 5
      );
    });

    if (invalidScore) {
      return NextResponse.json(
        { message: "Tüm kriter puanları 1 ile 5 arasında olmalıdır." },
        { status: 400 }
      );
    }

    const [kriterler, egitimler] = await Promise.all([
      getAirtableRecords<AnyFields>("Yetkinlik Kriterleri"),
      getAirtableRecords<AnyFields>("Eğitimler"),
    ]);

    const kriterMap = new Map<string, string>();

    kriterler.forEach((kriter) => {
      kriterMap.set(
        kriter.id,
        getReadableRecordName(kriter, ["Kriter Adı", "Name", "Ad"])
      );
    });

    const genelPuan =
      kriterPuanlari.reduce((total, item) => total + Number(item.puan), 0) /
      kriterPuanlari.length;

    const now = new Date();

    const createdEvaluation =
      await createAirtableRecord<DegerlendirmeCreateFields>(
        "Değerlendirmeler",
        {
          "Değerlendirme No": `DGR-${now.getTime()}`,
          "Çalışan": [calisanId],
          "Değerlendiren": [degerlendirenId],
          "Değerlendirme Tarihi": tarih,
          "Dönem": donem,
          "Durum": "Tamamlandı",
          "Genel Puan": Number(genelPuan.toFixed(1)),
          "Genel Yorum": genelYorum,
          "API Status": "Ready",
          "Created By User ID": user?.id || "anonymous",
          "Updated By User ID": user?.id || "anonymous",
          "n8n Status": "Pending",
          "AI Status": "Queued",
          "Automation Lock": false,
          "Automation Error": "",
          "AI Summary": "",
          "AI Recommendation Reason": "Kural tabanlı değerlendirme oluşturuldu.",
        }
      );

    for (const item of kriterPuanlari) {
      await createAirtableRecord<DegerlendirmeDetayCreateFields>(
        "Değerlendirme Detayları",
        {
          "Değerlendirme": [createdEvaluation.id],
          "Kriter": [item.kriterId],
          "Puan": Number(item.puan),
          "Yorum": item.yorum || "",
        }
      );
    }

    const lowScores = kriterPuanlari.filter((item) => Number(item.puan) <= 3);

    for (const item of lowScores) {
      const kriterName = kriterMap.get(item.kriterId) || item.kriterId;
      const trainingId = findTrainingForCriterion(
        item.kriterId,
        kriterName,
        egitimler
      );

      if (!trainingId) {
        continue;
      }

      const priority = calculatePriority(Number(item.puan));

      await createAirtableRecord<EgitimOnerisiCreateFields>(
        "Eğitim Önerileri",
        {
          "Öneri No": `ONR-${Date.now()}-${item.kriterId.slice(-4)}`,
          "Çalışan": [calisanId],
          "Değerlendirme": [createdEvaluation.id],
          "Kriter": [item.kriterId],
          "Önerilen Eğitim": [trainingId],
          "Sebep": `${kriterName} kriterinde ${item.puan}/5 puan alındığı için eğitim önerisi oluşturuldu.`,
          "Öncelik": priority,
          "Durum": "Önerildi",
          "Öneri Tarihi": getToday(),
          "API Status": "Ready",
          "Frontend Visible": true,
          "Source": "Rule-Based",
          "AI Confidence Score": 0.7,
          "n8n Status": "Skipped",
          "Automation Error": "",
          "AI Recommendation Reason": `${kriterName} kriterinde düşük puan tespit edildi.`,
        }
      );
    }

    return NextResponse.json({
      success: true,
      record: createdEvaluation,
      recommendationCount: lowScores.length,
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