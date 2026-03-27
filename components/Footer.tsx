import { Instagram, Youtube } from "lucide-react";

function TikTok({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function WhatsApp({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

const socials = [
  { icon: Instagram, href: "https://www.instagram.com/lenge.wav/", label: "Instagram" },
  { icon: WhatsApp, href: "https://www.whatsapp.com/channel/0029Vb5vWUDLNSaAcW0nur1I", label: "WhatsApp" },
  { icon: TikTok, href: "https://www.tiktok.com/@lenge.wav", label: "TikTok" },
  { icon: Youtube, href: "https://www.youtube.com/@lenge_wav", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="py-20 flex flex-col items-center gap-4">
      <div className="flex gap-6">
        {socials.map(({ icon: Icon, href, label }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            className="text-text-muted hover:text-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Icon size={24} />
          </a>
        ))}
      </div>
      <p className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase">
        &copy; 2024 LENGE. ALLE RECHTE VORBEHALTEN.
      </p>
    </footer>
  );
}
