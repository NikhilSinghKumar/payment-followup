import { NextResponse } from "next/server";
import { runNotificationScheduler } from "@/lib/notifications/notification-scheduler";

export async function GET(request) {
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.json(await runNotificationScheduler());
}
