import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import {
  getNotificationsCollection,
  toNotificationResponse,
} from "@/server/notifications/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const collection = await getNotificationsCollection();
    const docs = await collection
      .find()
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      notifications: docs.map(toNotificationResponse),
      unreadCount: docs.filter((d) => !d.read).length,
    });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to load notifications." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const body = (await request.json()) as {
      action: "markRead" | "markAllRead" | "clearAll" | "delete";
      id?: string;
    };

    const collection = await getNotificationsCollection();

    if (body.action === "markRead" && body.id) {
      await collection.updateOne(
        { _id: new ObjectId(body.id) },
        { $set: { read: true } },
      );
    } else if (body.action === "markAllRead") {
      await collection.updateMany(
        { read: false },
        { $set: { read: true } },
      );
    } else if (body.action === "clearAll") {
      await collection.deleteMany({});
    } else if (body.action === "delete" && body.id) {
      await collection.deleteOne({ _id: new ObjectId(body.id) });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const mongoError = getMongoRouteErrorResponse(err);
    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to update notifications." },
      { status: 500 },
    );
  }
}
