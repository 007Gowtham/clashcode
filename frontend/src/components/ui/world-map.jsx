"use client";
import { motion } from "motion/react";
import { useMemo, memo, useState, useEffect } from "react";
import { useTheme } from "next-themes";

// Static map cache to avoid regenerating
const mapCache = new Map();

const generateMapSVG = (theme, dotsColor) => {
  const cacheKey = `${theme}-${dotsColor}`;

  if (mapCache.has(cacheKey)) {
    return mapCache.get(cacheKey);
  }

  // Dynamically import only when needed
  const DottedMap = require("dotted-map").default;
  const map = new DottedMap({ height: 100, grid: "diagonal" });

  const defaultColor = theme === "dark" ? "#FFFFFF80" : "#00000080";
  const finalDotsColor = dotsColor || defaultColor;

  const svg = map.getSVG({
    radius: 0.22,
    color: finalDotsColor,
    shape: "circle",
    backgroundColor: theme === "dark" ? "black" : "white",
  });

  mapCache.set(cacheKey, svg);
  return svg;
};

// Memoized components
const AnimatedPath = memo(({ path, delay }) => (
  <motion.path
    d={path}
    fill="none"
    stroke="url(#path-gradient)"
    strokeWidth="1"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{
      duration: 1,
      delay,
      ease: "easeOut",
    }}
  />
));
AnimatedPath.displayName = "AnimatedPath";

const PulsingCircle = memo(({ x, y, color }) => (
  <g>
    <circle cx={x} cy={y} r="2" fill={color} />
    <circle cx={x} cy={y} r="2" fill={color} opacity="0.5">
      <animate
        attributeName="r"
        from="2"
        to="8"
        dur="1.5s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="opacity"
        from="0.5"
        to="0"
        dur="1.5s"
        repeatCount="indefinite"
      />
    </circle>
  </g>
));
PulsingCircle.displayName = "PulsingCircle";

// Optimized projection - pre-calculated constants
const project = (lat, lng) => ({
  x: (lng + 180) * 2.222222222, // 800/360
  y: (90 - lat) * 2.222222222,  // 400/180
});

const createPath = (sx, sy, ex, ey) => {
  const midX = (sx + ex) >> 1; // Bit shift for faster division by 2
  const midY = (sy < ey ? sy : ey) - 50;
  return `M ${sx} ${sy} Q ${midX} ${midY} ${ex} ${ey}`;
};

const WorldMap = memo(({ dots = [], lineColor = "#0ea5e9", dotsColor }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate map SVG with caching
  const svgMap = useMemo(() => {
    if (!mounted) return "";
    return generateMapSVG(theme, dotsColor);
  }, [theme, dotsColor, mounted]);

  // Pre-calculate all paths in one pass
  const pathData = useMemo(() => {
    const result = new Array(dots.length);
    for (let i = 0; i < dots.length; i++) {
      const { start, end } = dots[i];
      const s = project(start.lat, start.lng);
      const e = project(end.lat, end.lng);
      result[i] = {
        path: createPath(s.x, s.y, e.x, e.y),
        sx: s.x,
        sy: s.y,
        ex: e.x,
        ey: e.y,
      };
    }
    return result;
  }, [dots]);

  // Memoize encoded SVG
  const encodedSvg = useMemo(() => {
    if (!svgMap) return "";
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`;
  }, [svgMap]);

  if (!mounted) {
    return (
      <div className="w-full aspect-[2/1] dark:bg-black bg-white rounded-lg relative font-sans" />
    );
  }

  return (
    <div className="w-full aspect-[2/1] dark:bg-black bg-white rounded-lg relative font-sans">
      <img
        src={encodedSvg}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
      />
      <svg
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {pathData.map((data, i) => (
          <AnimatedPath key={i} path={data.path} delay={i * 0.5} />
        ))}

        {pathData.map((data, i) => (
          <g key={`pts-${i}`}>
            <PulsingCircle x={data.sx} y={data.sy} color={lineColor} />
            <PulsingCircle x={data.ex} y={data.ey} color={lineColor} />
          </g>
        ))}
      </svg>
    </div>
  );
});

WorldMap.displayName = "WorldMap";

export default WorldMap;