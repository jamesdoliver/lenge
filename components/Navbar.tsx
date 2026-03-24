import Image from "next/image";
import NewsletterModal from "@/components/NewsletterModal";
import TicketsModal from "@/components/TicketsModal";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(13,11,14,0.85)] backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-16 lg:px-24 max-w-7xl mx-auto">
        <TicketsModal className="font-[family-name:var(--font-bebas)] text-sm uppercase tracking-[0.2em] text-text-primary hover:text-accent transition-colors min-h-[44px] flex items-center">
          TICKETS
        </TicketsModal>

        <Image
          src="/images/logo.png"
          alt="LENGE"
          width={160}
          height={60}
          className="w-[120px] md:w-[160px] h-auto"
          priority
        />

        <NewsletterModal className="font-[family-name:var(--font-bebas)] text-sm uppercase tracking-[0.2em] text-text-primary hover:text-accent transition-colors min-h-[44px] flex items-center">
          NEWSLETTER
        </NewsletterModal>
      </div>
    </nav>
  );
}
