import { Instagram, Twitter, Youtube } from "lucide-react";

const socials = [
  { icon: Instagram, href: "https://www.instagram.com/lenge.wav/", label: "Instagram" },
  { icon: Twitter, href: "#TWITTER_URL", label: "Twitter" }, // TODO: replace with live URL
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
