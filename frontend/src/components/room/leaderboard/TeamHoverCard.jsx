import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import TeamHoverCardContent from "./TeamHoverCardContent";

const CARD_WIDTH = 280;
const VIEWPORT_MARGIN = 12;
const OFFSET_X = 12;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function useHoverCapable() {
  const [hoverCapable, setHoverCapable] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverCapable(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return hoverCapable;
}

export default function TeamHoverCard({
  open,
  team,
  anchorEl,
  onCardMouseEnter,
  onCardMouseLeave,
}) {
  const hoverCapable = useHoverCapable();
  const cardRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !team || !anchorEl || !cardRef.current) return;

    const compute = () => {
      const rect = anchorEl.getBoundingClientRect();
      const card = cardRef.current;
      const cardRect = card.getBoundingClientRect();

      let left = rect.right + OFFSET_X;
      if (left + CARD_WIDTH + VIEWPORT_MARGIN > window.innerWidth) {
        left = rect.left - CARD_WIDTH - OFFSET_X;
      }
      left = clamp(left, VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN - CARD_WIDTH);

      const desiredTop = rect.top + rect.height / 2 - cardRect.height / 2;
      const top = clamp(
        desiredTop,
        VIEWPORT_MARGIN,
        window.innerHeight - VIEWPORT_MARGIN - cardRect.height
      );

      setPos({ left, top });
    };

    compute();
    const onScrollOrResize = () => requestAnimationFrame(compute);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, team, anchorEl]);

  if (!mounted || !hoverCapable || !team) return null;

  return createPortal(
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[80] pointer-events-none"
    >
      <div
        ref={cardRef}
        className={[
          "pointer-events-auto",
          "w-[280px]",
          "rounded-2xl",
          "bg-white",
          "border border-gray-200",
          "px-5 py-4",
          "shadow-[0_10px_25px_rgba(0,0,0,0.06)]",
          "transition-all duration-200 ease-out",
          open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
        ].join(" ")}
        style={{ left: pos.left, top: pos.top, position: "fixed" }}
        onMouseEnter={onCardMouseEnter}
        onMouseLeave={onCardMouseLeave}
      >
        <TeamHoverCardContent team={team} />
      </div>
    </div>,
    document.body
  );
}

