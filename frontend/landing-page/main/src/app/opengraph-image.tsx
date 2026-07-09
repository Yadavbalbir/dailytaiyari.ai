import { ImageResponse } from "next/og";

export const alt =
  "DailyTaiyari — LMS & website platform for coaching institutes, schools and colleges";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #171717 55%, #7c2d12 140%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #f97316, #d946ef)",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            dt
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>DailyTaiyari</div>
        </div>

        <div style={{ display: "flex", fontSize: 66, fontWeight: 800, lineHeight: 1.1, maxWidth: 960 }}>
          Your own branded learning portal — on your own domain
        </div>

        <div style={{ display: "flex", fontSize: 30, color: "#d4d4d4", marginTop: 28, maxWidth: 900 }}>
          White-label LMS for coaching institutes, schools & colleges. Live classes,
          mock tests, courses & real-time analytics.
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 44 }}>
          {["Live classes", "Mock tests", "Course builder", "Analytics"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 600,
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(249,115,22,0.18)",
                border: "1px solid rgba(249,115,22,0.45)",
                color: "#fdba74",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
