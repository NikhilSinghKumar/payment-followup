"use client";

import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AmountRangeSlider({ maxAmount }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const STEP = 5000;

  const MAX_AMOUNT = maxAmount > 0 ? Math.ceil(maxAmount / STEP) * STEP : STEP;

  const [range, setRange] = useState([
    Number(searchParams.get("minAmount") || 0),
    Number(searchParams.get("maxAmount") || MAX_AMOUNT),
  ]);

  // =====================================
  // SYNC SLIDER WITH URL
  // =====================================

  useEffect(() => {
    setRange([
      Number(searchParams.get("minAmount") || 0),
      Number(searchParams.get("maxAmount") || MAX_AMOUNT),
    ]);
  }, [searchParams, MAX_AMOUNT]);

  // =====================================
  // APPLY FILTER
  // =====================================

  function handleCommit(value) {
    const params = new URLSearchParams(searchParams.toString());

    const [minAmount, maxAmount] = value;

    // Remove default values from URL
    if (minAmount === 0) {
      params.delete("minAmount");
    } else {
      params.set("minAmount", String(minAmount));
    }

    if (maxAmount === MAX_AMOUNT) {
      params.delete("maxAmount");
    } else {
      params.set("maxAmount", String(maxAmount));
    }

    router.replace(`/invoices?${params.toString()}`);
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
        onValueCommit={handleCommit}
        min={0}
        max={MAX_AMOUNT}
        step={STEP}
      />
    </div>
  );
}
