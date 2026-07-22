import { NextResponse } from "next/server";
import { runNotificationScheduler } from "@/lib/notifications/notification-scheduler";

export async function GET() {
  try {
    const result = await runNotificationScheduler();

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
