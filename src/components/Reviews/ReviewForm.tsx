import React, { useState, useEffect } from "react";

// ── Inline StarRating ──────────────────────────────────────────────

const STAR_COLOR = "#7F77DD";
const STAR_EMPTY_FILL = "#f5f5f5";
const STAR_EMPTY_STROKE = "rgba(0,0,0,0.35)";
const STAR_LABELS = ["", "Awful", "Poor", "Okay", "Good", "Excellent"];

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", width: 36, height: 36 }}
    >
      <polygon
        points="20,3 24.9,14.6 37.6,15.6 28.3,24.4 31.1,37 20,30.4 8.9,37 11.7,24.4 2.4,15.6 15.1,14.6"
        style={{
          fill: filled ? STAR_COLOR : STAR_EMPTY_FILL,
          stroke: filled ? STAR_COLOR : STAR_EMPTY_STROKE,
          strokeWidth: filled ? 0 : 1.8,
          strokeLinejoin: "round",
          transition: "fill .13s, stroke .13s",
        }}
      />
    </svg>
  );
}

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

function StarRating({ value, onChange }: StarRatingProps) {
  const [hov, setHov] = useState(0);
  const active = hov || value;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        role="radiogroup"
        aria-label="Star rating"
        style={{ display: "flex", alignItems: "center", gap: 4 }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            aria-checked={value === i}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(0)}
            onClick={() => onChange(value === i ? 0 : i)}
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
              outline: "none",
              lineHeight: 1,
              transition: "transform .12s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            <StarIcon filled={i <= active} />
          </button>
        ))}
      </div>
      {active > 0 && (
        <span style={{ fontSize: 13, color: STAR_COLOR, fontWeight: 600 }}>
          {STAR_LABELS[active]}
        </span>
      )}
    </div>
  );
}

// ── CourseReviewForm ───────────────────────────────────────────────

export interface ExistingReview {
  rating: number;
  text: string;
  author: string;
  date: string;
}

export interface CourseReviewFormProps {
  courseName?: string;
  existingReview?: ExistingReview;
  onSubmit?: (rating: number, text: string) => Promise<void>;
}

const MIN_CHARS = 50;
const MAX_CHARS = 500;

export default function CourseReviewForm({
  courseName = "Advanced React Patterns",
  existingReview,
  onSubmit,
}: CourseReviewFormProps) {
  const isEdit = !!existingReview;

  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [text, setText] = useState(existingReview?.text ?? "");
  const [errors, setErrors] = useState<{ rating?: string; text?: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(!isEdit);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setText(existingReview.text);
    }
  }, [existingReview]);

  const charCount = text.length;
  const charOver = charCount > MAX_CHARS;
  const charNearLimit = charCount >= MAX_CHARS * 0.85;

  function validate(): boolean {
    const newErrors: { rating?: string; text?: string } = {};
    if (rating === 0) newErrors.rating = "Please select a rating.";
    if (text.trim().length < MIN_CHARS)
      newErrors.text = `Write at least ${MIN_CHARS} characters (${MIN_CHARS - text.trim().length} more needed).`;
    if (charOver) newErrors.text = `Trim your review to ${MAX_CHARS} characters.`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(rating, text);
      }
      setSubmitted(true);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit() {
    setSubmitted(false);
    setIsEditing(true);
    setErrors({});
  }

  const containerStyle: React.CSSProperties = {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #F0EFFA 0%, #E8E6F8 50%, #EEF0FF 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  };

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 4px 6px -1px rgba(127,119,221,0.08), 0 20px 48px -8px rgba(127,119,221,0.18)",
    position: "relative",
    overflow: "hidden",
  };

  const accentBarStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: "linear-gradient(90deg, #7F77DD 0%, #A8A3E8 50%, #C5C2F0 100%)",
  };

  // ── Success State ────────────────────────────────────────────────
  if (submitted && !isEditing) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={accentBarStyle} />
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7F77DD, #A8A3E8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                boxShadow: "0 8px 24px rgba(127,119,221,0.35)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M6 14l5.5 5.5L22 9"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#1A1830",
                margin: "0 0 8px",
                letterSpacing: "-0.3px",
              }}
            >
              {isEdit ? "Review updated!" : "Thank you for your review!"}
            </h2>
            <p style={{ fontSize: "14px", color: "#7B78A8", margin: 0, lineHeight: 1.6 }}>
              Your feedback helps others decide if{" "}
              <strong style={{ color: "#4A4770" }}>{courseName}</strong> is right for them.
            </p>
          </div>

          <div
            style={{
              background: "#F8F7FE",
              border: "1px solid #E4E2F7",
              borderRadius: "14px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7F77DD, #C5C2F0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {existingReview?.author?.charAt(0) ?? "Y"}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1830" }}>
                  {existingReview?.author ?? "You"}
                </div>
                <div style={{ fontSize: "11px", color: "#A8A5C4" }}>Just now</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: "2px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width="16" height="16" viewBox="0 0 44 44" fill="none">
                    <path
                      d="M22 4l4.9 9.9 10.9 1.6-7.9 7.7 1.9 10.8L22 29.1l-9.8 5.1 1.9-10.8L6.2 15.5l10.9-1.6L22 4z"
                      fill={s <= rating ? "#7F77DD" : "#E4E2F7"}
                    />
                  </svg>
                ))}
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#3D3A60", lineHeight: 1.65, margin: 0 }}>
              {text}
            </p>
          </div>

          <button
            onClick={handleEdit}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
              (e.currentTarget.style.background = "#F0EFFA")
            }
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
              (e.currentTarget.style.background = "transparent")
            }
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "10px",
              border: "1.5px solid #D4D1F0",
              background: "transparent",
              color: "#7F77DD",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            Edit review
          </button>
        </div>
      </div>
    );
  }

  // ── Form State ───────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={accentBarStyle} />

        <div style={{ marginBottom: "28px" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#7F77DD",
              margin: "0 0 6px",
            }}
          >
            {isEdit ? "Edit your review" : "Rate this course"}
          </p>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1830",
              margin: 0,
              letterSpacing: "-0.3px",
              lineHeight: 1.25,
            }}
          >
            {courseName}
          </h1>
        </div>

        <div style={{ height: "1px", background: "#EFEDFA", marginBottom: "28px" }} />

        <div style={{ marginBottom: errors.rating ? "8px" : "28px" }}>
          <StarRating
            value={rating}
            onChange={(r: number) => {
              setRating(r);
              setErrors((prev) => ({ ...prev, rating: undefined }));
            }}
          />
          {errors.rating && (
            <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#E05A5A", textAlign: "center" }}>
              {errors.rating}
            </p>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#3D3A60",
              marginBottom: "8px",
            }}
          >
            Share your experience
          </label>
          <div style={{ position: "relative" }}>
            <textarea
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setText(e.target.value);
                if (errors.text) setErrors((prev) => ({ ...prev, text: undefined }));
              }}
              onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                if (!errors.text && !charOver) e.currentTarget.style.borderColor = "#7F77DD";
              }}
              onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                if (!errors.text && !charOver) e.currentTarget.style.borderColor = "#D4D1F0";
              }}
              placeholder="What did you learn? What would you tell a friend considering this course?"
              rows={5}
              style={{
                width: "100%",
                padding: "14px",
                paddingBottom: "36px",
                borderRadius: "12px",
                border: `1.5px solid ${errors.text ? "#E05A5A" : charOver ? "#E05A5A" : "#D4D1F0"}`,
                fontSize: "14px",
                color: "#1A1830",
                lineHeight: 1.65,
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
                background: "#FDFCFF",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                right: "14px",
                fontSize: "11px",
                fontWeight: 600,
                color: charOver ? "#E05A5A" : charNearLimit ? "#D4914A" : "#A8A5C4",
                transition: "color 0.15s",
                pointerEvents: "none",
              }}
            >
              {charCount}/{MAX_CHARS}
            </div>
          </div>

          {errors.text ? (
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#E05A5A" }}>{errors.text}</p>
          ) : charCount > 0 && charCount < MIN_CHARS ? (
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#A8A5C4" }}>
              {MIN_CHARS - charCount} more characters needed
            </p>
          ) : null}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(127,119,221,0.5)";
            }
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(127,119,221,0.4)";
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: loading
              ? "linear-gradient(135deg, #A8A3E8, #C5C2F0)"
              : "linear-gradient(135deg, #7F77DD 0%, #9B94E8 100%)",
            color: "white",
            fontSize: "15px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "transform 0.1s, box-shadow 0.15s, background 0.2s",
            boxShadow: loading ? "none" : "0 4px 16px rgba(127,119,221,0.4)",
          }}
        >
          {loading ? (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                style={{ animation: "spin 0.8s linear infinite" }}
              >
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              Submitting…
            </>
          ) : (
            <>{isEdit ? "Update review" : "Submit review"}</>
          )}
        </button>

        {isEdit && !submitted && (
          <p style={{ textAlign: "center", margin: "14px 0 0", fontSize: "12px", color: "#B0ADCC" }}>
            Last reviewed {existingReview?.date}
          </p>
        )}

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
