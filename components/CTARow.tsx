const links = [
  { label: "TICKETS", href: "#TICKETS_URL" }, // TODO: replace with live URL
  { label: "MERCH", href: "#MERCH_URL" }, // TODO: replace with live URL
  { label: "NEWSLETTER", href: "#NEWSLETTER_URL" }, // TODO: replace with live URL
];

export default function CTARow() {
  return (
    <section className="px-4 py-10 md:px-8">
      <div className="flex flex-col gap-2 md:flex-row md:gap-4">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="flex-1 border-2 border-border bg-transparent text-accent text-center font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 px-8 min-h-[44px] flex items-center justify-center hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all"
          >
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
