import React, { memo, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function normalizeEfficiencyLevel({ efficiency, efficiencyLevel }) {
  if (efficiencyLevel) return efficiencyLevel;

  const v = (efficiency || "").replace(/\s+/g, " ").trim();
  if (!v) return "medium";

  // High: O(1), O(n)
  if (/^O\(\s*1\s*\)$/i.test(v) || /^O\(\s*n\s*\)$/i.test(v)) return "high";

  // Medium: O(n log n)
  if (/^O\(\s*n\s*log\s*n\s*\)$/i.test(v) || /^O\(\s*n\s*log\s*\(?n\)?\s*\)$/i.test(v)) {
    return "medium";
  }

  // Low: O(n^2) / O(n²) / anything worse
  if (/^O\(\s*n\s*\^\s*2\s*\)$/i.test(v) || /^O\(\s*n²\s*\)$/i.test(v) || /^O\(\s*n\*n\s*\)$/i.test(v)) {
    return "low";
  }

  // Default safely
  return "medium";
}

function getEfficiencyTheme(level) {
  if (level === "high") {
    return "bg-emerald-50 text-emerald-600 border-emerald-200";
  }
  if (level === "low") {
    return "bg-rose-50 text-rose-600 border-rose-200";
  }
  return "bg-amber-50 text-amber-600 border-amber-200";
}

function EfficiencyBadgeImpl({ efficiency, efficiencyLevel }) {
  const level = useMemo(
    () => normalizeEfficiencyLevel({ efficiency, efficiencyLevel }),
    [efficiency, efficiencyLevel]
  );

  const label = (efficiency || "").trim() || (level === "high" ? "High" : level === "low" ? "Low" : "Medium");
  const theme = getEfficiencyTheme(level);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={[
            "inline-flex items-center justify-center",
            "h-6 px-3",
            "rounded-full border",
            "text-xs font-medium",
            theme,
            "transition-opacity duration-150 ease-out",
            "hover:opacity-95",
          ].join(" ")}
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="bg-white text-slate-700 border border-gray-200 shadow-[0_10px_25px_rgba(0,0,0,0.06)] rounded-xl px-3 py-2"
      >
        Best solution time complexity submitted by this team.
      </TooltipContent>
    </Tooltip>
  );
}

const EfficiencyBadge = memo(EfficiencyBadgeImpl);
EfficiencyBadge.displayName = "EfficiencyBadge";

export default EfficiencyBadge;

