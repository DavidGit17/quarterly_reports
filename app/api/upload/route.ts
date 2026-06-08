import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireActiveUser } from "@/server/auth/auth";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: Request) {
  try {
    const { user: currentUser, error } = await requireActiveUser();
    if (error || !currentUser) {
      return NextResponse.json({ message: error!.message }, { status: error!.status });
    }

    const rateLimitResult = await checkRateLimit(request, "create-project");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: `File type ${file.type} is not allowed. Allowed types: JPEG, PNG, WebP, GIF.` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File size exceeds 5 MB limit." },
        { status: 400 },
      );
    }

    const ext = path.extname(file.name) || ".bin";
    const filename = `${currentUser.id}-${Date.now()}${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(UPLOAD_DIR, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ url, filename }, { status: 201 });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    return NextResponse.json(
      { message: mongoError?.message || "Upload failed." },
      { status: mongoError?.status || 500 },
    );
  }
}
