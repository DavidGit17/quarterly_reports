import { NextResponse } from "next/server";
import { getDb } from "@/server/db/mongodb";

type FormConfigDocument = {
  key: string;
  value: string;
  updatedAt: Date;
};

const getCollection = async () => {
  const db = await getDb();
  return db.collection<FormConfigDocument>("form_configs");
};

export async function GET() {
  try {
    const collection = await getCollection();
    const configs = await collection.find({}).toArray();
    const result: Record<string, string> = {};
    for (const doc of configs) {
      result[doc.key] = doc.value;
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: "Failed to load configs" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body as { key: string; value: string };

    if (!key || value === undefined) {
      return NextResponse.json({ message: "key and value are required" }, { status: 400 });
    }

    const collection = await getCollection();
    await collection.updateOne(
      { key },
      {
        $set: {
          key,
          value,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Failed to save config" }, { status: 500 });
  }
}
