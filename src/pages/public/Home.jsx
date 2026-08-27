import PublicNavbar from '../../components/layout/PublicNavbar.jsx'
import PublicFooter from '../../components/layout/PublicFooter.jsx'
import Hero from '../../components/marketing/Hero.jsx'
import FeaturedProductsSection from '../../components/marketing/FeaturedProductsSection.jsx'
import TiersSection from '../../components/marketing/TiersSection.jsx'
import CommissionSection from '../../components/marketing/CommissionSection.jsx'
import TerritorySection from '../../components/marketing/TerritorySection.jsx'
import CalculatorSection from '../../components/marketing/CalculatorSection.jsx'
import VerticalsSection from '../../components/marketing/VerticalsSection.jsx'
import ProgramDetailsSection from '../../components/marketing/ProgramDetailsSection.jsx'
import CTASection from '../../components/marketing/CTASection.jsx'

export default function Home() {
  return (
    <div className="min-h-screen bg-cream text-ink antialiased">
      <PublicNavbar />
      <main>
        <Hero />
        <FeaturedProductsSection />
        <TiersSection />
        <CommissionSection />
        <TerritorySection />
        <CalculatorSection />
        <VerticalsSection />
        <ProgramDetailsSection />
        <CTASection />
      </main>
      <PublicFooter />
    </div>
  )
}
