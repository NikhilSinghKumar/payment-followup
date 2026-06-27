import { NextResponse } from "next/server";

export async function GET() {
  const csv = [
    ["Company Name", "Company Code", "GST Number", "TDS Applicable"],
    ["OTIS Elevator Bangalore", "OTBLR", "29ABCDE1234F1Z5", "Yes"],
    ["OTIS Elevator Chennai", "OTCHN", "33ABCDE1234F1Z5", "No"],
  ]
    .map((row) => row.join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="sub-clients-sample.csv"',
    },
  });
}
