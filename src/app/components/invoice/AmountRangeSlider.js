"use client";

import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AmountRangeSlider() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const MAX_AMOUNT = 5000000;
  const STEP = 1000;

  const [range, setRange] = useState([
    Number(searchParams.get("minAmount") || 0),
    Number(searchParams.get("maxAmount") || MAX_AMOUNT),
  ]);

  function applyFilter() {
    const params = new URLSearchParams(searchParams);

    params.set("minAmount", range[0]);
    params.set("maxAmount", range[1]);

    router.push(`/invoices?${params.toString()}`);
  }

  return (
    <div className="w-72 space-y-4">
      <div className="flex justify-between text-sm font-medium">
        <span>₹{range[0].toLocaleString("en-IN")}</span>
        <span>₹{range[1].toLocaleString("en-IN")}</span>
      </div>

      <Slider
        value={range}
        onValueChange={setRange}
        onValueCommit={(value) => {
          const params = new URLSearchParams(searchParams);

          params.set("minAmount", value[0]);
          params.set("maxAmount", value[1]);

          router.push(`/invoices?${params.toString()}`);
        }}
        min={0}
        max={MAX_AMOUNT}
        step={STEP}
      />
    </div>
  );
}
