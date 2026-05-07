import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CTARow from "@/components/CTARow";
import ShopSection from "@/components/ShopSection";
import Footer from "@/components/Footer";

// Sets default fetch revalidate for this segment. The page itself is
// dynamic because the root layout reads cookies() in getCartAction.
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
