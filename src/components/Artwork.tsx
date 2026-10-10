import { useId, useState, useEffect } from "react";
import type { AccessLevel, VisaDNA } from "../shared/contracts";
import { accessColors } from "../frontend/engine";
import { getCountryLandmark } from "../data/countryLandmarks";

export function Landscape({ compact = false }: { compact?: boolean }) {
  const id = useId();
  return (
    <svg
      className={compact ? "landscape compact" : "landscape"}
      viewBox="0 0 1440 240"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor="#c7e6ed" />
          <stop offset="1" stopColor="#3F88C5" />
        </linearGradient>
      </defs>
      <path
        d="M0 98 94 34 160 78 208 54 341 153 417 109 567 187 735 159 919 194 1051 169 1210 187 1370 137 1440 159V240H0Z"
        fill="#d5e8e8"
      />
      <path
        d="m0 136 86-81 47 46 60-22 139 109 128-50 113 68 201-30 147 25 130-32 123 28 180-60 86 15v88H0Z"
        fill="#8bc2d6"
      />
      <path
        d="m0 167 103-76 128 88 123-35 172 62 179-15 237 38H0Z"
        fill="#3F88C5"
      />
      <path
        d="m0 186 107-35 95 32 135-21 121 60H0Z"
        fill="#136F63"
        opacity=".55"
      />
      <path d="M0 220Q350 204 700 214T1440 207V240H0Z" fill={`url(#${id})`} />
      <path
        d="M0 206Q90 164 229 222L277 240H0ZM1180 240q92-87 260-70v70Z"
        fill="#8fa96a"
      />
      {[30, 60, 87, 125, 1310, 1340, 1370, 1412].map((x, i) => (
        <g
          key={x}
          transform={`translate(${x} ${i < 4 ? 170 + (i % 3) * 12 : 152 + (i % 3) * 12})`}
        >
          <path d="M0 36V-28" stroke="#032B43" strokeWidth="4" />
          <path d="M-14 17 0-54 14 17Z" fill={i % 2 ? "#136F63" : "#032B43"} />
        </g>
      ))}
      {[1250, 1282, 1322, 1360, 1390].map((x, i) => (
        <g key={x} transform={`translate(${x} ${195 - (i % 3) * 12})`}>
          <rect width="26" height="31" rx="2" fill="#fff9e9" />
          <path d="m-3 0 16-13L29 0Z" fill={i % 2 ? "#FFBA08" : "#D00000"} />
          <path d="M6 9h4v6H6zm10 0h4v6h-4zM11 22h5v9h-5z" fill="#032B43" />
        </g>
      ))}
      <g transform="translate(790 184)">
        <path d="M0 29h47l-8 7H9Z" fill="#fffdf7" />
        <path d="M25-22v49H3Z" fill="#fffdf7" />
        <path d="M28-8v35h17Z" fill="#FFBA08" />
        <path d="M26-25v56" stroke="#032B43" strokeWidth="1.5" />
      </g>
      <path
        d="M600 228h100m150 1h87M405 223h70"
        stroke="#fff"
        strokeWidth="2"
        opacity=".5"
      />
    </svg>
  );
}

export function PostcardArt({
  variant = 0,
  countryId,
}: {
  variant?: number;
  countryId?: string;
}) {
  const id = useId();
  const landmark = countryId ? getCountryLandmark(countryId) : null;
  const [imgStatus, setImgStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    landmark?.imagePath ? "loading" : "idle",
  );

  useEffect(() => {
    if (landmark?.imagePath) {
      setImgStatus("loading");
    } else {
      setImgStatus("idle");
    }
  }, [countryId, landmark?.imagePath]);

  const hasImage = Boolean(landmark?.imagePath && imgStatus !== "error");

  return (
    <div className="postcard-art-wrap">
      {hasImage ? (
        <>
          {imgStatus === "loading" && <div className="postcard-shimmer" />}
          <img
            src={landmark!.imagePath}
            alt={landmark ? `${landmark.landmarkName}, ${landmark.countryName}` : "Iconic landmark"}
            className={`postcard-photo ${imgStatus === "loaded" ? "loaded" : "loading"}`}
            onLoad={() => setImgStatus("loaded")}
            onError={() => setImgStatus("error")}
          />
        </>
      ) : (
        <svg
          className="postcard-art"
          viewBox="0 0 420 236"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label={
            landmark
              ? `${landmark.landmarkName}, ${landmark.countryName}`
              : [
                  "A mountain and a Japanese garden",
                  "An island in a turquoise sea",
                  "A bridge between two shores",
                  "An open garden gate",
                ][variant % 4]
          }
        >
          <defs>
            <linearGradient id={id} x2="0" y2="1">
              <stop stopColor="#a9d7eb" />
              <stop offset="1" stopColor="#f6f4df" />
            </linearGradient>
          </defs>
          <rect width="420" height="236" fill={`url(#${id})`} />
          <circle cx="318" cy="45" r="24" fill="#FFBA08" opacity=".85" />
          <path d="M15 175 149 42 286 175Z" fill="#3F88C5" />
          <path d="m115 76 34-34 42 41-24-8-17 9-16-12Z" fill="#fffdf7" />
          <path d="m191 172 110-89 119 94v53H0v-46Z" fill="#136F63" opacity=".35" />
          <path d="M0 174q115-25 214 13t206-6v49H0Z" fill="#3F88C5" opacity=".65" />
          {variant % 4 === 0 ? (
            <g>
              <path d="M281 236V93m85 143V93" stroke="#D00000" strokeWidth="15" />
              <path
                d="M266 91q60 12 117-1M274 112h103"
                stroke="#D00000"
                strokeWidth="12"
              />
              <path
                d="M0 236V94m0 48 62-28M0 172l90-30"
                stroke="#032B43"
                strokeWidth="7"
              />
              {[10, 36, 61, 83, 104, 14, 48, 83].map((x, i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={100 + (i % 3) * 23}
                  r="19"
                  fill={i % 2 ? "#ecd5c3" : "#f8e4d5"}
                />
              ))}
            </g>
          ) : variant % 4 === 1 ? (
            <g>
              <ellipse cx="177" cy="210" rx="118" ry="23" fill="#f9dfa0" />
              <path
                d="m148 210 7-107m0 6q-53-49-72-3 49-14 72 3-12-65 22-56 15 19-22 56 65-33 77 10-35-18-77-10"
                fill="#136F63"
                stroke="#136F63"
                strokeWidth="8"
              />
            </g>
          ) : variant % 4 === 2 ? (
            <g>
              <path
                d="M17 213q193-161 387 0"
                fill="none"
                stroke="#fff8df"
                strokeWidth="25"
              />
              <path
                d="M17 190q193-161 387 0"
                fill="none"
                stroke="#FFBA08"
                strokeWidth="5"
              />
              {[60, 110, 160, 210, 260, 310, 360].map((x) => (
                <path
                  key={x}
                  d={`M${x} ${122 + Math.abs(210 - x) * 0.3}v30`}
                  stroke="#FFBA08"
                  strokeWidth="4"
                />
              ))}
            </g>
          ) : (
            <g>
              <path
                d="M115 236V108a95 95 0 0 1 190 0v128"
                fill="none"
                stroke="#eac685"
                strokeWidth="31"
              />
              <path d="M121 236V108l59 25v103m119 0V108l-58 25v103" fill="#136F63" />
              <path d="M155 146v73m113-73v73" stroke="#FFBA08" strokeWidth="3" />
            </g>
          )}
          <path
            d="M0 234q48-28 99-1m233 1q49-29 88-5"
            stroke="#136F63"
            strokeWidth="12"
          />
        </svg>
      )}
      {landmark && (
        <div className="postcard-landmark-badge" title={`${landmark.landmarkName} (${landmark.location})`}>
          <span className="landmark-title">
            📍 <b>{landmark.landmarkName}</b>
          </span>
          <span className="landmark-loc">{landmark.location}</span>
        </div>
      )}
    </div>
  );
}

export function PassportBook({
  name,
  code,
  alternate = false,
}: {
  name: string;
  code: string;
  alternate?: boolean;
}) {
  return (
    <div className={`passport-book ${alternate ? "alternate" : ""}`}>
      <span>{name.toUpperCase()}</span>
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="26" />
        <ellipse cx="40" cy="40" rx="12" ry="26" />
        <path d="M14 40h52M18 25h44M18 55h44" />
      </svg>
      <b>{code}</b>
      <span>PASSPORT</span>
      <span className="passport-chip">▣</span>
    </div>
  );
}

export function DnaFlower({
  dna,
  small = false,
  levels,
}: {
  dna: VisaDNA;
  levels?: readonly AccessLevel[];
  small?: boolean;
}) {
  const colors = [
    accessColors.restricted,
    accessColors.visa_required,
    accessColors.evisa,
    accessColors.visa_on_arrival,
    accessColors.visa_free,
  ];
  return (
    <svg
      className={`dna-flower ${small ? "small" : ""}`}
      viewBox="0 0 500 500"
      role="img"
      aria-label={`Visa DNA for ${dna.passportId}; ${dna.vector.length} destination values. ${dna.summary.visaFree} visa-free, ${dna.summary.visaOnArrival} on arrival, ${dna.summary.evisa} eVisa, ${dna.summary.visaRequired} visa required, ${dna.summary.restricted} restricted, ${dna.summary.unknown} unknown.`}
    >
      {dna.vector.map((value, i) => (
        <g
          key={i}
          transform={`rotate(${(i * 360) / dna.vector.length} 250 250)`}
        >
          <path
            d={`M257 224 C${305 + value * 25} 182 ${320 + value * 90} 131 ${295 + value * 45} ${39 + (1 - value) * 47} C${280 + value * 36} ${19 + (1 - value) * 48} ${263 + value * 28} 31 ${279 + value * 32} ${65 + (1 - value) * 38} C${310 + value * 60} 138 286 188 257 224Z`}
            fill={levels?.[i] ? accessColors[levels[i]] : colors[
                value === 1
                  ? 4
                  : value >= 0.8
                    ? 3
                    : value >= 0.6
                      ? 2
                      : value > 0
                        ? 1
                        : 0
              ]
            }
            opacity={0.8 + (i % 3) * 0.1}
          />
        </g>
      ))}
      <circle
        cx="250"
        cy="250"
        r="25"
        fill="none"
        stroke="#136F63"
        strokeWidth="3"
      />
      <ellipse
        cx="250"
        cy="250"
        rx="11"
        ry="25"
        fill="none"
        stroke="#136F63"
        strokeWidth="2"
      />
      <path
        d="M225 250h50m-46-12h42m-42 24h42"
        stroke="#136F63"
        strokeWidth="2"
      />
    </svg>
  );
}
