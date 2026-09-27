import React, { useRef, useState } from "react";

const LABELS = ["", "Awful", "Poor", "Okay", "Good", "Excellent"];
const DESC = [
  "",
  "Not what I expected.",
  "Needs more depth.",
  "Decent, worth watching.",
  "Solid and well-structured.",
  "Absolutely outstanding!",
];
const BASE_COUNTS = [12, 23, 48, 87, 134];
const TOTAL = BASE_COUNTS.reduce((a, b) => a + b, 0);

const P = "#7F77DD";
const EMPTY_F = "#f5f5f5";
const EMPTY_S = "rgba(0,0,0,0.35)";

function StarIcon({ fill }: { fill: number }) {
  const clamped = Math.max(0, Math.min(1, fill));
  const clipId = React.useId();
  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", width: 40, height: 40 }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={40 * clamped} height="40" />
        </clipPath>
      </defs>
      <polygon
        points="20,3 24.9,14.6 37.6,15.6 28.3,24.4 31.1,37 20,30.4 8.9,37 11.7,24.4 2.4,15.6 15.1,14.6"
        style={{
          fill: EMPTY_F,
          stroke: EMPTY_S,
          strokeWidth: 1.8,
          strokeLinejoin: "round",
        }}
      />
      <polygon
        points="20,3 24.9,14.6 37.6,15.6 28.3,24.4 31.1,37 20,30.4 8.9,37 11.7,24.4 2.4,15.6 15.1,14.6"
        clipPath={`url(#${clipId})`}
        style={{
          fill: P,
          stroke: P,
          strokeWidth: 0,
          strokeLinejoin: "round",
          transition: "fill .13s, stroke .13s",
        }}
      />
    </svg>
  );
}

export default function StarRatingSelector() {
  const [sel, setSel] = useState(0);
  const [hov, setHov] = useState(0);
  const [focusIdx, setFocusIdx] = useState(0);
  const starRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const active = hov || sel;

  const pillActive = hov > 0 || sel > 0;
  const pillText = hov
    ? `${hov} — ${LABELS[hov]}`
    : sel
    ? `${sel} — ${LABELS[sel]}`
    : "No rating yet";

  const avgNum = sel ? `${sel}.0` : "—";
  const avgSub = sel ? DESC[sel] : "Select a rating above";

  function handleStarClick(i: number) {
    setSel((prev: number) => (prev === i ? 0 : i));
    setHov(0);
  }

  function focusStar(i: number) {
    const clamped = Math.max(1, Math.min(5, i));
    setFocusIdx(clamped);
    starRefs.current[clamped - 1]?.focus();
  }

  function handleStarKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        focusStar(i + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        focusStar(i - 1);
        break;
      case "Home":
        e.preventDefault();
        focusStar(1);
        break;
      case "End":
        e.preventDefault();
        focusStar(5);
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        handleStarClick(i);
        break;
      default:
        break;
    }
  }

  function clearAll() {
    setSel(0);
    setHov(0);
  }

  return (
    <div
      style={{
        margin: 0,
        fontFamily: "system-ui, sans-serif",
        background: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        padding: "2rem",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 460, width: "100%" }}>
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #e0e0e0",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1.25rem 1.5rem 1rem",
              borderBottom: "0.5px solid #e0e0e0",
            }}
          >
            {/* Course row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: "#EEEDFE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 18,
                  color: "#534AB7",
                }}
              >
                {"</>"}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>
                  Advanced React Patterns
                </p>
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                  By Sarah Chen · 24 lessons
                </p>
              </div>
            </div>

            <p style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a", margin: "0 0 4px" }}>
              How would you rate this course?
            </p>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 1rem" }}>
              Your rating helps other students find great content.
            </p>

            {/* Stars */}
            <div
              role="radiogroup"
              aria-label="Star rating"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                marginBottom: ".75rem",
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  ref={(el) => {
                    starRefs.current[i - 1] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-label={`${i} star${i > 1 ? "s" : ""}`}
                  aria-checked={sel === i}
                  tabIndex={focusIdx === i ? 0 : -1}
                  onFocus={() => setFocusIdx(i)}
                  onMouseEnter={() => setHov(i)}
                  onMouseLeave={() => setHov(0)}
                  onClick={() => handleStarClick(i)}
                  onKeyDown={(e) => handleStarKeyDown(e, i)}
                  onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) =>
                    (e.currentTarget.style.transform = "scale(.92)")
                  }
                  onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: 4,
                    cursor: "pointer",
                    borderRadius: 4,
                    outline: focusIdx === i ? `2px solid ${P}` : "none",
                    outlineOffset: 2,
                    lineHeight: 1,
                    transition: "transform .12s cubic-bezier(.34,1.56,.64,1)",
                  }}
                >
                  <StarIcon fill={i <= active ? 1 : 0} />
                </button>
              ))}
            </div>

            {/* Pill + Clear */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  background: pillActive ? "#EEEDFE" : "#f5f5f5",
                  border: `0.5px solid ${pillActive ? "#AFA9EC" : "#e0e0e0"}`,
                  color: pillActive ? "#3C3489" : "#888",
                  transition: "background .15s, color .15s, border-color .15s",
                  minWidth: 130,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: pillActive ? "#7F77DD" : "#ccc",
                    flexShrink: 0,
                    transition: "background .15s",
                  }}
                />
                <span>{pillText}</span>
              </div>
              {sel > 0 && (
                <button
                  type="button"
                  aria-label="Clear rating"
                  onClick={clearAll}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#aaa",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                    marginLeft: "auto",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "1rem 1.5rem 1.25rem" }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#999",
                letterSpacing: ".05em",
                textTransform: "uppercase",
                margin: "0 0 10px",
              }}
            >
              Rating breakdown
            </p>

            {[5, 4, 3, 2, 1].map((i) => {
              const pct = Math.round((BASE_COUNTS[i - 1] / TOTAL) * 100);
              const isSelected = sel === i;
              return (
                <div
                  key={i}
                  role="button"
                  aria-label={`Filter to ${i} stars`}
                  tabIndex={0}
                  onClick={() => {
                    setSel((prev: number) => (prev === i ? 0 : i));
                  }}
                >
                  <span>{i}</span>
                  <span>{pct}%</span>
                  {isSelected && <span>selected</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
