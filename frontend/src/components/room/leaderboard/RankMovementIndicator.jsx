import React, { memo, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

function getMovementStyle(rankChange) {
  if (rankChange > 0) {
    return {
      Icon: ArrowUp,
      text: `+${rankChange}`,
      className: "text-emerald-600",
    };
  }
  if (rankChange < 0) {
    return {
      Icon: ArrowDown,
      text: `${rankChange}`,
      className: "text-red-500",
    };
  }
  return {
    Icon: Minus,
    text: "0",
    className: "text-slate-400",
  };
}

function RankMovementIndicatorImpl({ rankChange = 0 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [rankChange]);

  const { Icon, text, className } = getMovementStyle(rankChange);

  return (
    <span
      className={[
        "inline-flex items-center gap-1",
        "text-xs font-medium",
        className,
        "transition-all duration-150 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-0.5",
      ].join(" ")}
      aria-label={`Rank change ${text}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{text}</span>
    </span>
  );
}

const RankMovementIndicator = memo(RankMovementIndicatorImpl);
RankMovementIndicator.displayName = "RankMovementIndicator";

export default RankMovementIndicator;

