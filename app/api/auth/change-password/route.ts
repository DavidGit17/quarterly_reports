import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db/mongodb";
import {
  getUsersCollection,
  requireActiveUser,
} from "@/server/auth/auth";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireActiveUser();

    if (error || !user) {
      return NextResponse.json(
        { message: error?.message || "Unauthorized." },
        { status: error?.status || 401 },
      );
    }

    const payload = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const { currentPassword, newPassword, confirmPassword } = payload;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          message: "Current password, new password, and confirm password are required.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters." },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "New password and confirm password do not match." },
        { status: 400 },
      );
    }

    const usersCollection = await getUsersCollection();
    const db = await getDb();
    const users = db.collection("users");

    const userRecord = await users.findOne({ _id: new ObjectId(user.id) });

    if (!userRecord) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 },
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      userRecord.password,
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { message: "Current password is incorrect." },
        { status: 400 },
      );
    }

    const isSameAsCurrent = await bcrypt.compare(
      newPassword,
      userRecord.password,
    );

    if (isSameAsCurrent) {
      return NextResponse.json(
        {
          message:
            "New password must be different from the current password.",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await users.updateOne(
      { _id: userRecord._id },
      { $set: { password: hashedPassword } },
    );

    return NextResponse.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    const mongoError = getMongoRouteErrorResponse(error);

    if (mongoError) {
      return NextResponse.json(
        { message: mongoError.message },
        { status: mongoError.status },
      );
    }

    return NextResponse.json(
      { message: "Unable to change password right now." },
      { status: 500 },
    );
  }
}
