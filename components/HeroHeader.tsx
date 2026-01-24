'use client';

type HeroHeaderProps = {
  logoUrl?: string;
  shopName: string;
  openHours?: string;
  phone?: string;
};

export default function HeroHeader({ logoUrl, shopName, openHours, phone }: HeroHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-900/30 p-5 sm:p-7 mb-8 shadow">
      <div className="flex items-center gap-5">
        <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/15 grid place-items-center">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-gray-400">No Logo</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {shopName}
          </h1>
          {(openHours || phone) && (
            <p className="mt-2 text-gray-200/90 text-base sm:text-lg leading-relaxed">
              {openHours ? <>เวลาเปิดบริการ {openHours}</> : null}
              {openHours && phone ? <>&nbsp;&nbsp;•&nbsp;&nbsp;</> : null}
              {phone ? <>โทร {phone}</> : null}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
