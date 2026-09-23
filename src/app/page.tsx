import { Benefits } from "@/components/sections/Benefits";
import { Faq } from "@/components/sections/Faq";
import { Contacts, CtaForm, Footer, MobileCtaBar } from "@/components/sections/Final";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Pain } from "@/components/sections/Pain";
import { Countdown } from "@/components/sections/Countdown";
import { Pricing } from "@/components/sections/Pricing";
import { LeadProvider } from "@/components/ui/LeadProvider";
import { ScrollTop } from "@/components/ui/ScrollTop";

export default function Home() {
  return (
    <LeadProvider>
      <Header />
      <main>
        <Hero />
        <Pain />
        <Benefits />
        <Pricing />
        <Countdown />
        <Faq />
        <CtaForm />
        <Contacts />
      </main>
      <Footer />
      <MobileCtaBar />
      <ScrollTop />
    </LeadProvider>
  );
}
