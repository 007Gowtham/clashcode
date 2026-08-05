import React, { memo, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Activity, Snail } from "lucide-react";

function normalizeEfficiencyLevel({ efficiency, efficiencyLevel }) {
  if (efficiencyLevel) return efficiencyLevel;

  const v = (String(efficiency) || "").replace(/\s+/g, " ").trim();
  if (!v) return "medium";

  // High: O(1), O(n), or numbers > 80
  if (/^O\(\s*1\s*\)$/i.test(v) || /^O\(\s*n\s*\)$/i.test(v) || parseInt(v) > 80) return "high";

  // Medium: O(n log n) or numbers between 50 and 80
  if (/^O\(\s*n\s*log\s*n\s*\)$/i.test(v) || /^O\(\s*n\s*log\s*\(?n\)?\s*\)$/i.test(v) || (parseInt(v) > 40 && parseInt(v) <= 80)) {
    return "medium";
  }

  // Low: O(n^2) / O(n²) / anything worse
  if (/^O\(\s*n\s*\^\s*2\s*\)$/i.test(v) || /^O\(\s*n²\s*\)$/i.test(v) || /^O\(\s*n\*n\s*\)$/i.test(v) || parseInt(v) <= 40) {
    return "low";
  }

  // Default safely
  return "medium";
}

function getEfficiencyIcon(level) {
  if (level === "high") {
    return {
      Icon: Zap,
      theme: "bg-[#b2ff59] text-retro-ink border-[3px] border-retro-ink shadow-[3px_3px_0_rgba(15,23,42,1)] rotate-[-2deg]",
      tooltip: "Optimal Efficiency"
    };
  }
  if (level === "low") {
    return {
      Icon: Snail,
      theme: "bg-[#ff4081] text-white border-[3px] border-retro-ink shadow-[3px_3px_0_rgba(15,23,42,1)] rotate-[2deg]",
      tooltip: "Poor Efficiency"
    };
  }
  return {
    Icon: Activity,
    theme: "bg-retro-yellow text-retro-ink border-[3px] border-retro-ink shadow-[3px_3px_0_rgba(15,23,42,1)] rotate-[1deg]",
    tooltip: "Average Efficiency"
  };
}

function EfficiencyBadgeImpl({ efficiency, efficiencyLevel }) {
  const level = useMemo(
    () => normalizeEfficiencyLevel({ efficiency, efficiencyLevel }),
    [efficiency, efficiencyLevel]
  );

  const { Icon, theme, tooltip } = getEfficiencyIcon(level);

  const displayValue = efficiency ? `${efficiency}%` : 'N/A';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={[
            "inline-flex items-center gap-2",
            "px-3 py-1",
            theme,
            "transition-transform duration-200 ease-out",
            "hover:-translate-y-1 hover:translate-x-1 hover:shadow-none cursor-pointer",
          ].join(" ")}
        >
          <Icon className="w-5 h-5 stroke-[3]" />
          <span className="font-black text-xl tracking-widest">{displayValue}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="bg-white font-black tracking-widest uppercase text-retro-ink border-[3px] border-retro-ink shadow-[4px_4px_0_rgba(15,23,42,1)] rounded-none px-3 py-2"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

const EfficiencyBadge = memo(EfficiencyBadgeImpl);
EfficiencyBadge.displayName = "EfficiencyBadge";

export default EfficiencyBadge;

