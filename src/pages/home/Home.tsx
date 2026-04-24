import Hero from "../../components/home/Hero";
import About from "../../components/home/About";
import Blog from "../../components/home/Blog";
import Gallery from "../../components/home/Gallery";
import Services from "../../components/home/Services";
import Footer from "../../components/footer/Footer";
import CTANewsLetter from "../../components/home/CTANewsLetter";
import HomeAdsSection from "../../components/home/HomeAdsSection";
import PopupAdvertisement from "../../components/home/PopupAdvertisement";

export default function Home() {
  return (
    <>
      <PopupAdvertisement />
      <Hero />
      <HomeAdsSection />
      <About />
      <Services />
      <Gallery />
      <Blog />
      <CTANewsLetter />
      <Footer />
    </>
  );
}
