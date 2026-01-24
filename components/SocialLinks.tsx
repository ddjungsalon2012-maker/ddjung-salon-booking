'use client';

type Socials = {
  facebook?: string;
  line?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
};

const items: Array<{ key: keyof Socials; label: string }> = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'line',     label: 'LINE' },
  { key: 'tiktok',   label: 'TikTok' },
  { key: 'youtube',  label: 'YouTube' },
  { key: 'website',  label: 'Website' },
];

export default function SocialLinks({ socials }: { socials?: Socials }) {
  const data = socials || {};
  const hasAny = items.some(i => data[i.key]);

  if (!hasAny) return null;

  return (
    <section className="mt-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold mb-3">ช่องทางติดต่อ</h3>
        <div className="flex flex-wrap gap-3">
          {items.map(({ key, label }) => {
            const href = data[key];
            if (!href) return null;
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-4 py-2 bg-black/70 border border-white/10 hover:bg-black transition text-sm"
              >
                {label}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
