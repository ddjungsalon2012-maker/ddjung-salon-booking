'use client';

type Socials = {
  facebook?: string;
  line?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
};

type BannerProps = {
  logoUrl?: string | null;
  shopName: string;       // บรรทัดใหญ่สีเหลือง
  subtitle?: string;      // บรรทัดรองสีขาวหนา
  openHours?: string;     // เวลาบริการ
  phone?: string;         // เบอร์โทร
  socials?: Socials;      // ลิงก์โซเชียล
};

// อีกแบบ: รองรับการส่ง settings ทั้งก้อน
type BannerSettingsProp = {
  settings: {
    logoUrl?: string | null;
    shopName: string;
    bannerSubtitle?: string; // จะ map เป็น subtitle
    openHours?: string;
    bannerPhone?: string;    // จะ fallback เป็น phone
    phone?: string;
    socials?: Socials;
  };
};

type Props = BannerProps | BannerSettingsProp;

/* ---------- ไอคอน (SVG) ในตัว ---------- */
const Icon = {
  fb: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.35 2 1.87 6.48 1.87 12.07c0 4.99 3.64 9.13 8.4 9.93v-7.02H7.9v-2.91h2.37V9.41c0-2.35 1.4-3.64 3.54-3.64 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.17 0-1.53.73-1.53 1.48v1.78h2.61l-.42 2.91h-2.19V22c4.76-.8 8.4-4.94 8.4-9.93Z"/>
    </svg>
  ),
  line: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.4 4.6A10.5 10.5 0 0 0 12 2C6.5 2 2 5.9 2 10.7c0 2.7 1.5 5.1 3.8 6.7l-.3 2.6c-.1.6.6 1.1 1.1.8l2.9-1.7c.8.2 1.7.3 2.6.3 5.5 0 10-3.9 10-8.7 0-2.3-1.2-4.4-2.7-6.1ZM7 12.6V8.9h1.4v3.7H7Zm3.1 0V8.9h1.4v3.7h-1.4Zm3.1 0V8.9h1.4v3.7h-1.4Zm4.5 0h-2.3V8.9h1.4v2.4h.9v1.3Z"/>
    </svg>
  ),
  tt: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M21 8.3c-2 0-3.8-.7-5.1-2V20a4.8 4.8 0 1 1-3.8-4.7V8.8c0-.1.1-.1.1-.1 1 1.4 2.6 2.4 4.3 2.6.2 0 .3 0 .5 0v3a8.1 8.1 0 0 1-4.9-1.7v4.3a3 3 0 1 0 2.2 2.8V3h3a5.7 5.7 0 0 0 3.7 3.3v2Z"/>
    </svg>
  ),
  yt: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.5 7.3a3 3 0 0 0-2.1-2.1C19.6 4.7 12 4.7 12 4.7s-7.6 0-9.4.5A3 3 0 0 0 .5 7.3 31.4 31.4 0 0 0 0 12c0 1.6.1 3.1.5 4.7a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.1.5-4.7 0-1.6-.1-3.1-.5-4.7ZM9.7 15.3V8.7l6 3.3-6 3.3Z"/>
    </svg>
  ),
  web: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/>
    </svg>
  ),
};

export default function Banner(props: Props) {
  // รองรับทั้ง props รายตัว และ props แบบ settings
  const p: BannerProps =
    'settings' in props
      ? {
          logoUrl: props.settings.logoUrl ?? undefined,
          shopName: props.settings.shopName,
          subtitle: props.settings.bannerSubtitle ?? undefined,
          openHours: props.settings.openHours ?? undefined,
          phone: props.settings.bannerPhone ?? props.settings.phone ?? undefined,
          socials: props.settings.socials ?? undefined,
        }
      : props;

  const links = [
    { href: p.socials?.facebook, icon: <Icon.fb />,  label: 'Facebook' },
    { href: p.socials?.line,     icon: <Icon.line />, label: 'LINE'     },
    { href: p.socials?.tiktok,   icon: <Icon.tt />,   label: 'TikTok'   },
    { href: p.socials?.youtube,  icon: <Icon.yt />,   label: 'YouTube'  },
    { href: p.socials?.website,  icon: <Icon.web />,  label: 'Website'  },
  ].filter(x => typeof x.href === 'string' && x.href.trim() !== '');

  return (
    <section className="mb-8">
      <div className="bg-blue-950 rounded-2xl border border-white/10 p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* โลโก้ซ้าย */}
          <div className="w-44 h-44 sm:w-56 sm:h-56 shrink-0 bg-white rounded-xl overflow-hidden p-3 ring-1 ring-white/10">
            <img
              src={p.logoUrl || '/logo.png'}
              alt="โลโก้ร้าน"
              className="h-full w-full object-contain"
            />
          </div>

          {/* ตัวหนังสือขวา */}
          <div className="text-center sm:text-left">
            {/* บรรทัดใหญ่สีเหลือง */}
            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-yellow-400">
              {p.shopName}
            </div>

            {/* บรรทัดรอง */}
            {p.subtitle ? (
              <div className="mt-3 text-xl font-bold text-white">{p.subtitle}</div>
            ) : null}

            {/* เวลาบริการ */}
            {p.openHours ? (
              <div className="mt-3 text-lg text-gray-100">
                เวลาบริการ <span className="opacity-90">{p.openHours}</span>
              </div>
            ) : null}

            {/* เบอร์โทร */}
            {p.phone ? (
              <div className="mt-2 text-lg text-gray-100">เบอร์โทร {p.phone}</div>
            ) : null}
          </div>
        </div>

        {/* ปุ่มไอคอนโซเชียลด้านล่าง */}
        {links.length > 0 && (
          <div className="flex gap-4 mt-7 justify-center sm:justify-start sm:ml-[216px]">
            {links.map(l => (
              <a
                key={l.label}
                href={l.href!}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full grid place-items-center bg-black/85 hover:bg-black transition text-white"
                aria-label={l.label}
                title={l.label}
              >
                {l.icon}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
