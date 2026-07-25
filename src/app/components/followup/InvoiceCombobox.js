"use client";

import { useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InvoiceCombobox({
  invoices = [],
  value,
  onChange,
  disabled = false,
}) {
  const selectedInvoice = useMemo(
    () => invoices.find((i) => i.id === value),
    [invoices, value],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedInvoice ? selectedInvoice.invoiceNumber : "Select Invoice"}

          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[500px] p-0">
        <Command>
          <CommandInput placeholder="Search invoice..." />

          <CommandEmpty>No invoice found.</CommandEmpty>

          <CommandGroup className="max-h-80 overflow-auto">
            {invoices.map((invoice) => (
              <CommandItem
                key={invoice.id}
                value={`${invoice.invoiceNumber} ${invoice.subClientName ?? ""}`}
                onSelect={() => onChange(invoice)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === invoice.id ? "opacity-100" : "opacity-0",
                  )}
                />

                <div className="flex w-full flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{invoice.invoiceNumber}</span>

                    <span className="font-semibold">
                      ₹{Number(invoice.due).toLocaleString()}
                    </span>
                  </div>

                  {invoice.subClientName && (
                    <span className="text-xs text-gray-500">
                      {invoice.subClientName}
                    </span>
                  )}

                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span>Due : {invoice.dueDays} Days</span>

                    <span
                      className={
                        invoice.status === "overdue"
                          ? "font-medium text-red-600"
                          : invoice.status === "partial"
                            ? "font-medium text-yellow-600"
                            : "font-medium text-blue-600"
                      }
                    >
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
