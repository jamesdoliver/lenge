import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CTARow from "@/components/CTARow";
import VoteSection from "@/components/VoteSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-[52px] md:pt-0">
        <Hero />
        <CTARow />
        <VoteSection />
      </main>
      <Footer />
    </>
  );
}
