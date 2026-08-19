"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  Package,
  ArrowRight,
  Calendar,
  Scale,
  Copy,
  Check,
  X,
} from "lucide-react";

export default function AwbDetailsPopover({ awbs = [], invoiceNumber }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(null);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    placement: "bottom",
    maxWidth: 360,
  });
  const [mounted, setMounted] = useState(false);

  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate smart position
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const popoverWidth = Math.min(380, viewportWidth - 32);
    const estimatedHeight = 260; // Estimated height of the popover card

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Determine vertical placement: upward if not enough space below and more space above
    const isUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    let top = isUpward ? triggerRect.top - 8 : triggerRect.bottom + 8;

    // Horizontal positioning: align with trigger, but clamp within viewport
    let left = triggerRect.left;
    if (left + popoverWidth > viewportWidth - 16) {
      left = Math.max(16, viewportWidth - popoverWidth - 16);
    }

    setCoords({
      top,
      left,
      placement: isUpward ? "top" : "bottom",
      popoverWidth,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();

      const handleScrollOrResize = () => {
        updatePosition();
      };

      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);

      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  function handleMouseEnter() {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsOpen(true);
  }

  function handleMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  }

  if (!awbs || awbs.length === 0) {
    return (
      <span className="text-[10px] text-zinc-300 dark:text-zinc-600">—</span>
    );
  }

  function handleCopy(e, awbNumber) {
    e.stopPropagation();
    navigator.clipboard.writeText(awbNumber);
    setCopiedAwb(awbNumber);
    setTimeout(() => {
      setCopiedAwb(null);
    }, 1500);
  }

  const totalWeight = awbs.reduce((sum, a) => sum + (Number(a.weight) || 0), 0);
  const totalAmount = awbs.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  return (
    <div
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Badge */}
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`group inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium shadow-2xs transition cursor-pointer select-none ${
          isOpen
            ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/60 dark:text-blue-200 ring-2 ring-blue-500/20"
            : "border-zinc-200 bg-zinc-50/90 text-zinc-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
        }`}
        title="Click or hover to view AWB details"
      >
        <Package size={12} className="text-blue-600 dark:text-blue-400" />
        {awbs.length === 1 ? (
          <span className="font-mono font-semibold">
            {typeof awbs[0] === "string" ? awbs[0] : awbs[0].awbNumber}
          </span>
        ) : (
          <span className="font-semibold">{awbs.length} AWBs</span>
        )}
        <span
          className={`text-[9px] text-zinc-400 transition-transform duration-150 ${isOpen ? "rotate-180 text-blue-600" : "group-hover:text-blue-500"}`}
        >
          ▾
        </span>
      </div>

      {/* Popover Card Portal */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={popoverRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: "fixed",
              left: `${coords.left}px`,
              top: coords.placement === "top" ? "auto" : `${coords.top}px`,
              bottom:
                coords.placement === "top"
                  ? `${window.innerHeight - coords.top}px`
                  : "auto",
              width: `${coords.popoverWidth}px`,
              zIndex: 99999,
            }}
            className="rounded-xl border border-zinc-200 bg-white p-3 shadow-2xl ring-1 ring-black/10 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Package size={12} />
                </div>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  AWB Details {invoiceNumber ? `(${invoiceNumber})` : ""}
                </span>
                <span className="rounded-full bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {awbs.length}{" "}
                  {awbs.length === 1 ? "Consignment" : "Consignments"}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={13} />
              </button>
            </div>

            {/* AWB Item List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 my-1.5 pr-1 dark:divide-zinc-800">
              {awbs.map((awb, index) => {
                const awbNo = typeof awb === "string" ? awb : awb.awbNumber;
                const origin = typeof awb === "object" ? awb.origin : null;
                const destination =
                  typeof awb === "object" ? awb.destination : null;
                const shipmentDate =
                  typeof awb === "object" ? awb.shipmentDate : null;
                const weight = typeof awb === "object" ? awb.weight : null;
                const amount = typeof awb === "object" ? awb.amount : null;
                const remarks = typeof awb === "object" ? awb.remarks : null;

                return (
                  <div
                    key={awb.id || index}
                    className="py-2 first:pt-1 last:pb-1"
                  >
                    {/* Top line: AWB Number + Copy Button + Amount */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {awbNo}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, awbNo)}
                          className="inline-flex items-center text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Copy AWB number"
                        >
                          {copiedAwb === awbNo ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>

                      {amount && (
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          ₹
                          {Number(amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </div>

                    {/* Route & Shipment Meta */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                      {(origin || destination) && (
                        <div className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                          <span>{origin || "Origin"}</span>
                          <ArrowRight size={10} className="text-zinc-400" />
                          <span>{destination || "Dest"}</span>
                        </div>
                      )}

                      {shipmentDate && (
                        <div className="inline-flex items-center gap-1">
                          <Calendar size={10} className="text-zinc-400" />
                          <span>
                            {new Date(shipmentDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      )}

                      {weight && (
                        <div className="inline-flex items-center gap-1">
                          <Scale size={10} className="text-zinc-400" />
                          <span>{weight} kg</span>
                        </div>
                      )}
                    </div>

                    {/* Remarks if any */}
                    {remarks && (
                      <p className="mt-1 text-[10px] italic text-zinc-500 dark:text-zinc-400">
                        &ldquo;{remarks}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Card Footer Summary */}
            {(totalWeight > 0 || totalAmount > 0 || awbs.length > 1) && (
              <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[10px] font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                <span>Summary</span>
                <div className="flex items-center gap-3">
                  {totalWeight > 0 && (
                    <span>Total Wt: {totalWeight.toFixed(2)} kg</span>
                  )}
                  {totalAmount > 0 && (
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                      Total: ₹
                      {totalAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
