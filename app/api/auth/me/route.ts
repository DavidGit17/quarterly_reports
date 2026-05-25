import { NextResponse } from "next/server";
import { getAuthenticatedUser, getUsersCollection } from "@/server/auth/auth";
import { ObjectId } from "mongodb";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { profileImage?: string };

    if (body.profileImage === undefined) {
      return NextResponse.json(
        { message: "Nothing to update." },
        { status: 400 },
      );
    }

    const usersCollection = await getUsersCollection();

    await usersCollection.updateOne(
      { _id: new ObjectId(user.id) },
      { $set: { profileImage: body.profileImage } },
    );

    return NextResponse.json({
      message: "Profile image updated.",
      profileImage: body.profileImage,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to update profile image." },
      { status: 500 },
    );
  }
}
