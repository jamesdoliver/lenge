import NewsletterModal from "@/components/NewsletterModal";
import TicketsModal from "@/components/TicketsModal";

const ctaClass =
  "flex-1 border-2 border-border bg-transparent text-accent text-center font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 px-8 min-h-[44px] flex items-center justify-center hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all";

export default function CTARow() {
  return (
    <section className="px-4 py-10 md:px-8">
      <div className="flex flex-col gap-2 md:flex-row md:gap-4">
        <TicketsModal className={ctaClass}>
          TICKETS
        </TicketsModal>
        <a href="#vote" className={ctaClass}>
          MERCH
        </a>
        <NewsletterModal className={ctaClass}>
          NEWSLETTER
        </NewsletterModal>
      </div>
    </section>
  );
}
