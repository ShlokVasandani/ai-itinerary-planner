import { ImageResponse } from "next/og";

export const alt = "Sekai: real itineraries for 20 cities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FBF7F0", padding: 72, color: "#16130F" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 44, height: 44, background: "#FF5A36", borderRadius: 12 }} />
          Sekai
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>Real itineraries for 20 cities.</div>
          <div style={{ fontSize: 34, color: "#5B564F" }}>Verified places, real opening hours, real distances.</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {["Day-by-day plans", "Cost ranges", "Book from the official site"].map((t) => (
            <div key={t} style={{ background: "#FFD23F", padding: "12px 22px", borderRadius: 999, fontSize: 26, fontWeight: 600 }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
