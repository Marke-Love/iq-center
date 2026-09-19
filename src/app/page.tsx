import { Benefits } from "@/components/sections/Benefits";
import { Faq } from "@/components/sections/Faq";
import { Contacts, CtaForm, Footer, MobileCtaBar } from "@/components/sections/Final";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Pain } from "@/components/sections/Pain";
import { Experts, Reviews } from "@/components/sections/People";
import { Pricing } from "@/components/sections/Pricing";
import { Subjects } from "@/components/sections/Subjects";
import { LeadProvider } from "@/components/ui/LeadProvider";
import { ScrollTop } from "@/components/ui/ScrollTop";

export default function Home() {
  return (
    <LeadProvider>
      <Header />
      <main>
        <Hero />
        <Pain />
        <HowItWorks />
        <Benefits />
        <Subjects />
        <Pricing />
        <Experts />
        <Reviews />
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
