type AirtableRecord<T> = {
  id: string;
  createdTime: string;
  fields: T;
};

type AirtableResponse<T> = {
  records: AirtableRecord<T>[];
};

const mojibakePairs: [string, string][] = [
  ["\u00C3\u2021", "\u00C7"],
  ["\u00C3\u0087", "\u00C7"],
  ["\u00C3\u00A7", "\u00E7"],

  ["\u00C4\u00B1", "\u0131"],
  ["\u00C4\u00B0", "\u0130"],

  ["\u00C4\u0178", "\u011F"],
  ["\u00C4\u017E", "\u011E"],

  ["\u00C3\u00BC", "\u00FC"],
  ["\u00C3\u0153", "\u00DC"],
  ["\u00C3\u009C", "\u00DC"],

  ["\u00C3\u00B6", "\u00F6"],
  ["\u00C3\u2013", "\u00D6"],
  ["\u00C3\u0096", "\u00D6"],

  ["\u00C5\u0178", "\u015F"],
  ["\u00C5\u017E", "\u015E"],
  ["\u00C5\u017D", "\u015E"],
];

function repairText(value: string) {
  let repaired = value;

  for (const [broken, fixed] of mojibakePairs) {
    repaired = repaired.split(broken).join(fixed);
  }

  return repaired;
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return repairText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (value && typeof value === "object") {
    const normalizedObject: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      normalizedObject[repairText(key)] = normalizeValue(item);
    });

    return normalizedObject;
  }

  return value;
}

function normalizeFields<T>(fields: T): T {
  return normalizeValue(fields) as T;
}

function getAirtableConfig() {
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!token || token.includes("BURAYA")) {
    throw new Error(
      "Airtable token eksik. .env.local içindeki AIRTABLE_PERSONAL_ACCESS_TOKEN değerini gerçek token ile değiştir."
    );
  }

  if (!baseId) {
    throw new Error("AIRTABLE_BASE_ID .env.local içinde yok.");
  }

  return { token, baseId };
}

export async function getAirtableRecords<T>(
  tableName: string
): Promise<AirtableRecord<T>[]> {
  const { token, baseId } = getAirtableConfig();
  const safeTableName = repairText(tableName);

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(safeTableName)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Airtable veri çekme hatası. Tablo: ${safeTableName}. Status: ${response.status}. Detay: ${errorText}`
    );
  }

  const data = (await response.json()) as AirtableResponse<T>;

  return data.records;
}

export async function getAirtableRecordById<T>(
  tableName: string,
  recordId: string
): Promise<AirtableRecord<T>> {
  const { token, baseId } = getAirtableConfig();
  const safeTableName = repairText(tableName);

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
      safeTableName
    )}/${recordId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Airtable kayıt çekme hatası. Tablo: ${safeTableName}. Record ID: ${recordId}. Status: ${response.status}. Detay: ${errorText}`
    );
  }

  return response.json();
}

export async function createAirtableRecord<T>(
  tableName: string,
  fields: T
): Promise<AirtableRecord<T>> {
  const { token, baseId } = getAirtableConfig();
  const safeTableName = repairText(tableName);

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(safeTableName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: normalizeFields(fields),
        typecast: true,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Airtable kayıt oluşturma hatası. Tablo: ${safeTableName}. Status: ${response.status}. Detay: ${errorText}`
    );
  }

  return response.json();
}

export async function updateAirtableRecord<T>(
  tableName: string,
  recordId: string,
  fields: Partial<T>
): Promise<AirtableRecord<T>> {
  const { token, baseId } = getAirtableConfig();
  const safeTableName = repairText(tableName);

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
      safeTableName
    )}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: normalizeFields(fields),
        typecast: true,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Airtable kayıt güncelleme hatası. Tablo: ${safeTableName}. Record ID: ${recordId}. Status: ${response.status}. Detay: ${errorText}`
    );
  }

  return response.json();
}

export async function deleteAirtableRecord(
  tableName: string,
  recordId: string
): Promise<{ id: string; deleted: boolean }> {
  const { token, baseId } = getAirtableConfig();
  const safeTableName = repairText(tableName);

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
      safeTableName
    )}/${recordId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Airtable kayıt silme hatası. Tablo: ${safeTableName}. Record ID: ${recordId}. Status: ${response.status}. Detay: ${errorText}`
    );
  }

  return response.json();
}

export function showField(value: unknown): string {
  if (value === undefined || value === null) {
    return "-";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
