export default function IslamicHeroBg() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layer 1: Deep gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-primary-850 to-teal-950" />

      {/* Layer 2: Islamic geometric pattern (8-pointed star/Khatim) */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg stroke='%23ffffff' stroke-width='0.6' fill='none'%3E%3Crect x='15' y='15' width='30' height='30'/%3E%3Crect x='15' y='15' width='30' height='30' transform='rotate(45 30 30)'/%3E%3Ccircle cx='30' cy='30' r='21'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Layer 3: Golden nur (divine light) glow behind text */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/8 blur-[100px]" />

      {/* Layer 4: Crescent moon top-right */}
      <svg
        className="absolute right-6 top-6 h-14 w-14 opacity-[0.12] sm:right-12 sm:top-12 sm:h-20 sm:w-20 lg:right-20 lg:top-16 lg:h-28 lg:w-28"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M58,8 A42,42 0 1,0 58,92 A31,31 0 1,1 58,8 Z"
          fill="white"
        />
      </svg>

      {/* Layer 5: Small scattered stars */}
      <svg className="absolute left-[15%] top-[18%] h-2 w-2 opacity-30" viewBox="0 0 10 10">
        <path d="M5,0 L6,4 L10,5 L6,6 L5,10 L4,6 L0,5 L4,4 Z" fill="white" />
      </svg>
      <svg className="absolute left-[80%] top-[25%] h-1.5 w-1.5 opacity-20" viewBox="0 0 10 10">
        <path d="M5,0 L6,4 L10,5 L6,6 L5,10 L4,6 L0,5 L4,4 Z" fill="white" />
      </svg>
      <svg className="absolute left-[25%] top-[60%] h-2 w-2 opacity-15" viewBox="0 0 10 10">
        <path d="M5,0 L6,4 L10,5 L6,6 L5,10 L4,6 L0,5 L4,4 Z" fill="white" />
      </svg>
      <svg className="absolute left-[70%] top-[55%] h-1.5 w-1.5 opacity-20" viewBox="0 0 10 10">
        <path d="M5,0 L6,4 L10,5 L6,6 L5,10 L4,6 L0,5 L4,4 Z" fill="white" />
      </svg>
      <svg className="absolute left-[50%] top-[15%] h-1 w-1 opacity-25" viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="3" fill="white" />
      </svg>
      <svg className="absolute left-[90%] top-[45%] h-1 w-1 opacity-20" viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="3" fill="white" />
      </svg>

      {/* Layer 6: Mosque silhouette at bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1200 220"
        preserveAspectRatio="xMidYMax meet"
        fill="none"
        aria-hidden="true"
      >
        {/* Left minaret */}
        <rect x="120" y="40" width="16" height="180" fill="rgba(255,255,255,0.04)" />
        <circle cx="128" cy="35" r="11" fill="rgba(255,255,255,0.05)" />
        <path d="M128,14 L133,30 L123,30 Z" fill="rgba(255,255,255,0.06)" />

        {/* Right minaret */}
        <rect x="1064" y="40" width="16" height="180" fill="rgba(255,255,255,0.04)" />
        <circle cx="1072" cy="35" r="11" fill="rgba(255,255,255,0.05)" />
        <path d="M1072,14 L1077,30 L1067,30 Z" fill="rgba(255,255,255,0.06)" />

        {/* Left side dome + building */}
        <path d="M250,130 C250,90 275,60 310,60 C345,60 370,90 370,130 L370,140 L250,140 Z" fill="rgba(255,255,255,0.04)" />
        <path d="M310,42 L315,58 L305,58 Z" fill="rgba(255,255,255,0.05)" />
        <circle cx="310" cy="50" r="3" fill="rgba(255,255,255,0.05)" />
        <rect x="270" y="110" width="80" height="110" fill="rgba(255,255,255,0.03)" />
        {/* Arches */}
        <path d="M280,220 L280,175 C280,163 290,155 300,155 C310,155 320,163 320,175 L320,220 Z" fill="rgba(255,255,255,0.02)" />
        <path d="M330,220 L330,175 C330,163 340,155 350,155 C360,155 370,163 370,175 L370,220 Z" fill="rgba(255,255,255,0.02)" />

        {/* Right side dome + building */}
        <path d="M830,130 C830,90 855,60 890,60 C925,60 950,90 950,130 L950,140 L830,140 Z" fill="rgba(255,255,255,0.04)" />
        <path d="M890,42 L895,58 L885,58 Z" fill="rgba(255,255,255,0.05)" />
        <circle cx="890" cy="50" r="3" fill="rgba(255,255,255,0.05)" />
        <rect x="850" y="110" width="80" height="110" fill="rgba(255,255,255,0.03)" />
        {/* Arches */}
        <path d="M860,220 L860,175 C860,163 870,155 880,155 C890,155 900,163 900,175 L900,220 Z" fill="rgba(255,255,255,0.02)" />
        <path d="M910,220 L910,175 C910,163 920,155 930,155 C940,155 950,163 950,175 L950,220 Z" fill="rgba(255,255,255,0.02)" />

        {/* Central main dome */}
        <path d="M440,135 C440,55 500,15 600,15 C700,15 760,55 760,135 L760,145 L440,145 Z" fill="rgba(255,255,255,0.05)" />
        {/* Dome finial */}
        <path d="M600,-2 L606,14 L594,14 Z" fill="rgba(255,255,255,0.06)" />
        <circle cx="600" cy="8" r="4" fill="rgba(255,255,255,0.06)" />
        <rect x="598" y="10" width="4" height="8" fill="rgba(255,255,255,0.06)" />

        {/* Main building body */}
        <rect x="400" y="110" width="400" height="110" fill="rgba(255,255,255,0.035)" />

        {/* Grand entrance arch (iwan) */}
        <path d="M540,220 L540,155 C540,135 565,120 600,120 C635,120 660,135 660,155 L660,220 Z" fill="rgba(255,255,255,0.025)" />
        {/* Inner arch detail */}
        <path d="M555,220 L555,160 C555,145 575,132 600,132 C625,132 645,145 645,160 L645,220 Z" fill="rgba(255,255,255,0.015)" />

        {/* Side arches on main building */}
        <path d="M420,220 L420,180 C420,168 430,160 440,160 C450,160 460,168 460,180 L460,220 Z" fill="rgba(255,255,255,0.02)" />
        <path d="M470,220 L470,180 C470,168 480,160 490,160 C500,160 510,168 510,180 L510,220 Z" fill="rgba(255,255,255,0.02)" />
        <path d="M690,220 L690,180 C690,168 700,160 710,160 C720,160 730,168 730,180 L730,220 Z" fill="rgba(255,255,255,0.02)" />
        <path d="M740,220 L740,180 C740,168 750,160 760,160 C770,160 780,168 780,180 L780,220 Z" fill="rgba(255,255,255,0.02)" />

        {/* Connecting walls */}
        <rect x="160" y="160" width="110" height="60" fill="rgba(255,255,255,0.025)" />
        <rect x="930" y="160" width="110" height="60" fill="rgba(255,255,255,0.025)" />

        {/* Ground/base line */}
        <rect x="0" y="215" width="1200" height="5" fill="rgba(255,255,255,0.03)" />
      </svg>

      {/* Layer 7: Decorative top border (Islamic geometric band) */}
      <svg
        className="absolute top-0 left-0 w-full opacity-[0.08]"
        height="12"
        viewBox="0 0 1200 12"
        preserveAspectRatio="none"
        fill="white"
      >
        <path d="M0,6 L20,0 L40,12 L60,0 L80,12 L100,0 L120,12 L140,0 L160,12 L180,0 L200,12 L220,0 L240,12 L260,0 L280,12 L300,0 L320,12 L340,0 L360,12 L380,0 L400,12 L420,0 L440,12 L460,0 L480,12 L500,0 L520,12 L540,0 L560,12 L580,0 L600,12 L620,0 L640,12 L660,0 L680,12 L700,0 L720,12 L740,0 L760,12 L780,0 L800,12 L820,0 L840,12 L860,0 L880,12 L900,0 L920,12 L940,0 L960,12 L980,0 L1000,12 L1020,0 L1040,12 L1060,0 L1080,12 L1100,0 L1120,12 L1140,0 L1160,12 L1180,0 L1200,6 Z" />
      </svg>

      {/* Layer 8: Bottom fade for smooth transition */}
      <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-sand-50 to-transparent" />
    </div>
  );
}
