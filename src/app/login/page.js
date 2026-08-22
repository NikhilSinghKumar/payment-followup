import LoginForm from "@/app/components/auth/LoginForm";
import Image from "next/image";

export const metadata = {
  title: "Login | PAFEX Express Courier & Cargo",
  description: "Sign in to PAFEX Express Courier & Cargo",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-100 via-red-50 to-purple-50 flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      {/* Background Logistics Line Art Diagram */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <svg
          className="h-full w-full opacity-70"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* ================= PATH CONNECTOR LINES & DOTS ================= */}
          <g
            stroke="#cbd5e1"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Top Left Line to Plane */}
            <path d="M 348 240 L 348 160 L 250 160" />
            <circle cx="348" cy="240" r="3.5" fill="#708aaf" stroke="none" />
            <circle cx="174" cy="370" r="3.5" fill="#688ab9" stroke="none" />

            {/* Middle Left Transit Path with S-curve */}
            <path d="M 174 500 L 250 500 C 270 500 270 550 290 550 C 310 550 310 600 330 600 L 400 600 L 400 650 L 320 650 L 320 720 L 250 720" />
            <circle cx="254" cy="500" r="4.5" fill="#a1badd" stroke="none" />
            <circle cx="280" cy="720" r="3.5" fill="#a1c3f3" stroke="none" />

            {/* Bottom Left connector to center */}
            <path d="M 360 740 L 470 740 L 470 790 L 740 790 L 740 740" />
            <circle cx="740" cy="740" r="3.5" fill="#a6c5f0" stroke="none" />
            <circle cx="1046" cy="740" r="4" fill="#a3bee4" stroke="none" />

            {/* Top Right Connector */}
            <path d="M 960 250 L 1030 250 L 1030 210 L 1150 210" />
            <circle cx="1030" cy="250" r="3.5" fill="#478ae9" stroke="none" />
            <circle cx="1156" cy="210" r="3.5" fill="#94a3b8" stroke="none" />

            {/* Middle Right Connector to Warehouse & Globe */}
            <path d="M 1195 300 L 1150 340 L 1090 340" />
            <circle cx="1195" cy="300" r="3.5" fill="#406ba7" stroke="none" />

            {/* Bottom Right Line to Network Globe */}
            <path d="M 1190 460 L 1230 460" />
            <path d="M 1090 580 L 1090 640 L 1155 640" />
            <circle cx="1090" cy="580" r="3.5" fill="#214e8d" stroke="none" />
            <circle cx="1155" cy="640" r="3.5" fill="#2e61a8" stroke="none" />

            {/* Long Bottom Connector Horizontal */}
            <path d="M 740 740 L 1046 740" />
          </g>

          {/* ================= TOP LEFT: AIRPLANE & SUSPENDED CONTAINER ================= */}
          <g
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* Airplane */}
            <path d="M 120 160 L 220 130 C 235 125 250 135 245 145 C 240 155 225 160 210 165 L 140 185 Z" />
            <path d="M 175 145 L 155 105 L 175 102 L 200 138" />
            <path d="M 100 135 L 125 125 L 130 162 Z" />
            {/* Cockpit window */}
            <path d="M 230 138 Q 236 138 238 142" strokeWidth="1.8" />
            {/* Suspension cable / hoist */}
            <path d="M 185 165 L 185 200" strokeWidth="1.2" />
            <path d="M 185 200 L 160 220" strokeWidth="1.2" />
            <path d="M 185 200 L 210 220" strokeWidth="1.2" />
            {/* Shipping Container */}
            <rect
              x="132"
              y="220"
              width="110"
              height="70"
              rx="3"
              stroke="#94a3b8"
              strokeWidth="1.6"
            />
            {/* Container vertical corrugation lines */}
            <line x1="148" y1="230" x2="148" y2="280" strokeWidth="1.2" />
            <line x1="160" y1="230" x2="160" y2="280" strokeWidth="1.2" />
            <line x1="172" y1="230" x2="172" y2="280" strokeWidth="1.2" />
            <line x1="184" y1="230" x2="184" y2="280" strokeWidth="1.2" />
            <line x1="196" y1="230" x2="196" y2="280" strokeWidth="1.2" />
            <line x1="208" y1="230" x2="208" y2="280" strokeWidth="1.2" />
            <line x1="220" y1="230" x2="220" y2="280" strokeWidth="1.2" />
          </g>

          {/* ================= MIDDLE LEFT: FAST DELIVERY TRUCK ================= */}
          <g
            stroke="#c98888"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* Speed motion lines */}
            <line x1="262" y1="410" x2="282" y2="410" strokeWidth="1.3" />
            <line x1="270" y1="422" x2="295" y2="422" strokeWidth="1.3" />
            <line x1="255" y1="434" x2="285" y2="434" strokeWidth="1.3" />
            <line x1="265" y1="446" x2="280" y2="446" strokeWidth="1.3" />
            {/* Truck Cargo Box */}
            <rect
              x="290"
              y="405"
              width="75"
              height="50"
              rx="3"
              strokeWidth="1.5"
            />
            {/* Truck Cabin */}
            <path
              d="M 365 425 L 385 425 L 400 442 L 400 455 L 365 455 Z"
              strokeWidth="1.5"
            />
            <path
              d="M 372 430 L 383 430 L 392 442 L 372 442 Z"
              strokeWidth="1.2"
            />
            {/* Wheels */}
            <circle cx="315" cy="458" r="8" strokeWidth="1.5" />
            <circle cx="385" cy="458" r="8" strokeWidth="1.5" />
          </g>

          {/* ================= BOTTOM LEFT: WAREHOUSE & PALLET BOXES ================= */}
          <g
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* Warehouse building */}
            <path
              d="M 110 770 L 110 670 L 195 625 L 280 670 L 280 770 Z"
              strokeWidth="1.6"
            />
            {/* Warehouse shutter door */}
            <rect x="135" y="675" width="120" height="95" strokeWidth="1.4" />
            <line x1="135" y1="695" x2="255" y2="695" strokeWidth="1" />
            <line x1="135" y1="715" x2="255" y2="715" strokeWidth="1" />
            <line x1="135" y1="735" x2="255" y2="735" strokeWidth="1" />
            <line x1="135" y1="755" x2="255" y2="755" strokeWidth="1" />

            {/* Boxes in foreground */}
            {/* Stacked Box 1 (Left front) */}
            <rect
              x="135"
              y="725"
              width="30"
              height="30"
              rx="1"
              strokeWidth="1.4"
            />
            <path d="M 145 735 L 155 735 M 150 725 L 150 745" strokeWidth="1" />
            {/* Stacked Box 2 (Left back) */}
            <rect
              x="145"
              y="755"
              width="30"
              height="30"
              rx="1"
              strokeWidth="1.4"
            />
            {/* Large Box 3 (Right isometric) */}
            <path
              d="M 210 750 L 245 730 L 285 745 L 250 768 Z"
              strokeWidth="1.4"
            />
            <path
              d="M 210 750 L 210 790 L 250 812 L 250 768"
              strokeWidth="1.4"
            />
            <path d="M 285 745 L 285 785 L 250 812" strokeWidth="1.4" />
            <line x1="228" y1="740" x2="268" y2="757" strokeWidth="1" />
          </g>

          {/* ================= TOP RIGHT: WAREHOUSE & BOX ================= */}
          <g
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* Warehouse building */}
            <path
              d="M 1195 280 L 1195 180 L 1275 135 L 1355 180 L 1355 280 Z"
              strokeWidth="1.6"
            />
            <rect x="1220" y="190" width="105" height="90" strokeWidth="1.4" />
            <line x1="1220" y1="210" x2="1325" y2="210" strokeWidth="1" />
            <line x1="1220" y1="230" x2="1325" y2="230" strokeWidth="1" />
            <line x1="1220" y1="250" x2="1325" y2="250" strokeWidth="1" />
            <line x1="1220" y1="270" x2="1325" y2="270" strokeWidth="1" />

            {/* Small box left */}
            <rect x="1230" y="250" width="22" height="22" strokeWidth="1.2" />
            <line x1="1241" y1="250" x2="1241" y2="260" strokeWidth="1" />
            {/* Large box isometric right */}
            <path
              d="M 1260 255 L 1290 238 L 1320 252 L 1290 270 Z"
              strokeWidth="1.4"
            />
            <path
              d="M 1260 255 L 1260 290 L 1290 307 L 1290 270"
              strokeWidth="1.4"
            />
            <path d="M 1320 252 L 1320 287 L 1290 307" strokeWidth="1.4" />
            <line x1="1275" y1="246" x2="1305" y2="261" strokeWidth="1" />
          </g>

          {/* ================= MIDDLE RIGHT: MAP PIN, GLOBE & COURIER PARCEL ================= */}
          <g
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* Location Pin */}
            <g transform="translate(1020, 350)">
              <path
                d="M 16 0 C 7.16 0 0 7.16 0 16 C 0 28 16 42 16 42 C 16 42 32 28 32 16 C 32 7.16 24.84 0 16 0 Z"
                strokeWidth="1.4"
              />
              <circle cx="16" cy="16" r="6" strokeWidth="1.4" />
            </g>

            {/* World Globe */}
            <circle cx="1100" cy="450" r="60" strokeWidth="1.6" />
            {/* Continents outlines */}
            <path
              d="M 1055 425 Q 1065 405 1085 410 Q 1100 425 1090 445 Q 1070 455 1055 425 Z"
              strokeWidth="1.2"
            />
            <path
              d="M 1080 465 Q 1095 455 1115 460 Q 1125 480 1105 500 Q 1085 490 1080 465 Z"
              strokeWidth="1.2"
            />
            <path
              d="M 1125 415 Q 1145 425 1150 440 Q 1135 455 1125 435 Z"
              strokeWidth="1.2"
            />

            {/* Courier parcel next to globe */}
            <g transform="translate(1120, 490)">
              <rect
                x="0"
                y="0"
                width="60"
                height="48"
                rx="2"
                strokeWidth="1.4"
              />
              <line x1="0" y1="20" x2="60" y2="20" strokeWidth="1" />
              <line x1="38" y1="36" x2="52" y2="36" strokeWidth="1" />
              <line x1="38" y1="40" x2="48" y2="40" strokeWidth="1" />
            </g>
          </g>

          {/* ================= BOTTOM RIGHT: WIREFRAME NETWORK GLOBE ================= */}
          <g
            stroke="#94a3b8"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* Location Pin */}
            <g transform="translate(1308, 590)">
              <path
                d="M 16 0 C 7.16 0 0 7.16 0 16 C 0 28 16 42 16 42 C 16 42 32 28 32 16 C 32 7.16 24.84 0 16 0 Z"
                strokeWidth="1.4"
              />
              <circle cx="16" cy="16" r="6" strokeWidth="1.4" />
            </g>

            {/* Network Sphere */}
            <circle cx="1260" cy="700" r="72" strokeWidth="1.6" />
            <ellipse cx="1260" cy="700" rx="72" ry="28" strokeWidth="1.2" />
            <ellipse cx="1260" cy="700" rx="30" ry="72" strokeWidth="1.2" />
            <line x1="1260" y1="628" x2="1260" y2="772" strokeWidth="1.2" />
            <line x1="1188" y1="700" x2="1332" y2="700" strokeWidth="1.2" />

            {/* Cross diagonal chords for wireframe mesh */}
            <path d="M 1210 650 L 1310 750" strokeWidth="0.9" />
            <path d="M 1210 750 L 1310 650" strokeWidth="0.9" />

            {/* Network Nodes on the sphere */}
            <circle cx="1245" cy="670" r="3.5" fill="#6386b6" stroke="none" />
            <circle cx="1285" cy="710" r="3.5" fill="#6389be" stroke="none" />
            <circle cx="1215" cy="720" r="3" fill="#1d447c" stroke="none" />
            <circle cx="1295" cy="660" r="3" fill="#94a3b8" stroke="none" />

            {/* Sparkle star */}
            <path
              d="M 1330 800 Q 1345 800 1345 785 Q 1345 800 1360 800 Q 1345 800 1345 815 Q 1345 800 1330 800 Z"
              fill="#a7bedd"
              stroke="none"
              opacity="0.3"
            />
          </g>
        </svg>
      </div>

      {/* Top spacer */}
      <div className="h-4 sm:h-8" />

      {/* Center Container: PAFEX Brand Logo + Login Card */}
      <div className="relative z-10 mx-auto flex w-full max-w-[460px] flex-col items-center">
        {/* Pafex Logo */}
        <div className="mb-4 flex flex-col items-center justify-center">
          <Image
            src="/pafex_logo.png"
            alt="PAFEX Express Courier & Cargo"
            width={180}
            height={60}
            priority
            referrerPolicy="no-referrer"
            className="h-20 w-auto object-contain drop-shadow-xs"
          />
        </div>

        {/* The White Login Card */}
        <div className="w-full rounded-[28px] border border-slate-100/90 bg-gradient-r from-indigo-600 to-purple-300 p-7 sm:p-9 shadow-sm backdrop-blur-xs">
          <LoginForm />
        </div>
      </div>

      {/* Footer Area */}
      <footer className="relative z-10 mt-6 flex w-full items-center justify-between px-2 sm:px-6">
        {/* Bottom Left Circle Badge 'N' */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1e22] text-xs font-bold text-white shadow-sm ring-2 ring-white/60">
          <span>N</span>
        </div>

        {/* Center Copyright Notice */}
        <div className="flex-1 text-center pr-8 sm:pr-0">
          <p className="text-[11px] sm:text-xs text-indigo-400 font-normal">
            © 2026 Prakash Airfreight India Pvt Ltd (Pafex)
          </p>
        </div>

        {/* Balance layout spacer for right side */}
        <div className="hidden sm:block w-8" />
      </footer>
    </div>
  );
}
