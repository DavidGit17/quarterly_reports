import bcrypt from "bcryptjs";
import { ObjectId, type Filter } from "mongodb";
import { NextResponse } from "next/server";
import {
  requireAdmin,
  getUsersCollection,
  UserRole,
  UserStatus,
  UserDocument,
} from "@/server/auth/auth";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { getMongoRouteErrorResponse } from "@/server/db/mongodb";

export type AdminUserRecord = {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  project?: string;
  profileImage?: string;
  createdAt: string;
};

const MAX_USERS_LIMIT = 100;
const DEFAULT_USERS_LIMIT = 50;

export async function GET(request: Request) {
  try {
    const { user: _currentUser, error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(MAX_USERS_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_USERS_LIMIT), 10)));

    const query: Filter<UserDocument> & {
      $or?: Array<{
        username?: { $regex: string; $options: string };
        email?: { $regex: string; $options: string };
      }>;
    } = {};
    if (
      roleFilter &&
      ["coordinator", "facilitator", "admin"].includes(roleFilter)
    ) {
      query.role = roleFilter as UserRole;
    }
    if (statusFilter && ["active", "inactive"].includes(statusFilter)) {
      query.status = statusFilter as UserStatus;
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { username: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const usersCollection = await getUsersCollection();
    const skip = (page - 1) * limit;
    const [total, users] = await Promise.all([
      usersCollection.countDocuments(query),
      usersCollection
        .find(query)
        .project({ password: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    const mapped: AdminUserRecord[] = users.map((user) => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status || "active",
      project: user.project,
      profileImage: user.profileImage,
      createdAt: user.createdAt.toISOString(),
    }));

    const counts = await Promise.all([
      usersCollection.countDocuments({ role: "coordinator" }),
      usersCollection.countDocuments({ role: "facilitator" }),
      usersCollection.countDocuments({ role: "admin" }),
    ]);

    return NextResponse.json({
      users: mapped,
      counts: {
        coordinator: counts[0],
        facilitator: counts[1],
        admin: counts[2],
        total: counts[0] + counts[1] + counts[2],
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const mongoError = getMongoRouteErrorResponse(error);
    return NextResponse.json(
      { message: mongoError?.message || "Failed to fetch users." },
      { status: mongoError?.status || 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user: _currentUser, error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const rateLimitResult = await checkRateLimit(request, "create-user");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const payload = (await request.json()) as {
      username?: string;
      email?: string;
      password?: string;
      role?: string;
      project?: string;
      status?: string;
    };

    const username = payload.username?.trim() || "";
    const email = payload.email?.trim() || "";
    const password = payload.password || "";
    const role =
      payload.role === "facilitator"
        ? "facilitator"
        : payload.role === "admin"
          ? "admin"
          : "coordinator";
    const project = payload.project?.trim() || "";
    const status: UserStatus =
      payload.status === "inactive" ? "inactive" : "active";

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Username, email and password are required." },
        { status: 400 },
      );
    }

    if (!project && role !== "admin") {
      return NextResponse.json(
        { message: "Project is required for non-admin users." },
        { status: 400 },
      );
    }

    const usersCollection = await getUsersCollection();

    const existingUser = await usersCollection.findOne({
      $or: [
        { usernameLower: username.toLowerCase() },
        { emailLower: email.toLowerCase() },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username or email already exists." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertResult = await usersCollection.insertOne({
      username,
      usernameLower: username.toLowerCase(),
      email,
      emailLower: email.toLowerCase(),
      password: hashedPassword,
      role,
      status,
      project: role !== "admin" ? project : undefined,
      profileImage: "",
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "User created successfully.",
        user: {
          _id: insertResult.insertedId.toString(),
          username,
          email,
          role,
          status,
          project: role !== "admin" ? project : undefined,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const mongoError = getMongoRouteErrorResponse(error);
    return NextResponse.json(
      { message: mongoError?.message || "Failed to create user." },
      { status: mongoError?.status || 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { user: _currentUser, error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const rateLimitResult = await checkRateLimit(request, "update-user");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const payload = (await request.json()) as {
      id?: string;
      username?: string;
      email?: string;
      password?: string;
      role?: string;
      project?: string;
      status?: string;
    };

    const userId = payload.id?.trim();
    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required." },
        { status: 400 },
      );
    }

    const updateFields: Record<string, unknown> = {};

    if (payload.username?.trim()) {
      updateFields.username = payload.username.trim();
      updateFields.usernameLower = payload.username.trim().toLowerCase();
    }
    if (payload.email?.trim()) {
      updateFields.email = payload.email.trim();
      updateFields.emailLower = payload.email.trim().toLowerCase();
    }
    if (payload.password) {
      updateFields.password = await bcrypt.hash(payload.password, 10);
    }
    if (payload.role) {
      const newRole =
        payload.role === "facilitator"
          ? "facilitator"
          : payload.role === "admin"
            ? "admin"
            : "coordinator";
      updateFields.role = newRole;
      if (newRole === "admin") {
        updateFields.project = undefined;
      }
    }
    if (payload.project !== undefined) {
      updateFields.project = payload.project.trim() || undefined;
    }
    if (payload.status === "active" || payload.status === "inactive") {
      updateFields.status = payload.status;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { message: "No fields to update." },
        { status: 400 },
      );
    }

    const usersCollection = await getUsersCollection();
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateFields },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "User updated successfully." });
  } catch (error) {
    const mongoError = getMongoRouteErrorResponse(error);
    return NextResponse.json(
      { message: mongoError?.message || "Failed to update user." },
      { status: mongoError?.status || 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { user: currentUser, error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const rateLimitResult = await checkRateLimit(request, "delete-user");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required." },
        { status: 400 },
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        { message: "Cannot delete yourself." },
        { status: 400 },
      );
    }

    const usersCollection = await getUsersCollection();
    const result = await usersCollection.deleteOne({
      _id: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "User deleted successfully." });
  } catch (error) {
    const mongoError = getMongoRouteErrorResponse(error);
    return NextResponse.json(
      { message: mongoError?.message || "Failed to delete user." },
      { status: mongoError?.status || 500 },
    );
  }
}
