"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import AmountRangeSlider from "./AmountRangeSlider";

export default function AmountRangeFilter() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="h-[40px] px-4 rounded-lg border border-zinc-300 bg-white text-sm hover:bg-zinc-50">
          Amount Range
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4">
        <AmountRangeSlider />
      </PopoverContent>
    </Popover>
  );
}
