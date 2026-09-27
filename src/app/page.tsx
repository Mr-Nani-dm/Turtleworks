import { CinematicBackground } from "@/components/motion/CinematicBackground";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { CapabilityIndex } from "@/components/sections/CapabilityIndex";
import { MoreToRight } from "@/components/sections/MoreToRight";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Principles } from "@/components/sections/Principles";
import { ContactCTA } from "@/components/sections/ContactCTA";

export default function Home() {
  return (
    <>
      <CinematicBackground />
      <Navbar />
      <main>
        <Hero />
        <CapabilityIndex />
        <MoreToRight />
        <ProcessTimeline />
        <SelectedWork />
        <Principles />
        <ContactCTA />
      </main>
      <Footer />
    </>
  );
}
