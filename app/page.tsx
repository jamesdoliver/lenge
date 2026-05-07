import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CTARow from "@/components/CTARow";
import ShopSection from "@/components/ShopSection";
import Footer from "@/components/Footer";

export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-[52px] md:pt-0">
        <Hero />
        <CTARow />
        <ShopSection />
      </main>
      <Footer />
    </>
  );
}
