import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(13,11,14,0.85)] backdrop-blur-sm">
      <div className="flex items-center justify-center px-4 py-3">
        <Link href="/" aria-label="LENGE — zur Startseite" className="inline-flex">
          <Image
            src="/images/logo.png"
            alt="LENGE"
            width={160}
            height={60}
            className="w-[120px] md:w-[160px] h-auto"
            priority
          />
        </Link>
      </div>
    </nav>
  );
}
