import Reveal from '../Reveal.jsx'
import SectionHeader from '../SectionHeader.jsx'
import Accordion from '../ui/Accordion.jsx'

const faqs = [
  {
    question: 'What is the Digitalsofts Partner Network?',
    answer:
      'A distribution channel — not an affiliate-link program. Partners progress through five tiers (Affiliate, Referral, Reseller, Certified, Strategic), each with more ownership, pricing authority and revenue upside across 120+ Digitalsofts products.',
  },
  {
    question: 'How does commission work?',
    answer:
      'Commission rates depend on your tier and the product type: one-time licenses, recurring SaaS, or professional services. Rates are configured per tier in the partner portal and only pay out on collected revenue, never on unpaid invoices.',
  },
  {
    question: "What's the difference between Affiliate and Reseller?",
    answer:
      'An Affiliate simply introduces a lead and Digitalsofts runs the whole sales and delivery process. A Reseller buys at partner pricing, owns the commercial relationship with the customer, and keeps the margin between partner price and retail price.',
  },
  {
    question: 'How does deal registration work?',
    answer:
      'Submit the customer, product and estimated value in the portal. Once approved, the deal is protected — Digitalsofts cannot bypass you and sell direct without paying your commission.',
  },
  {
    question: 'How long is deal protection?',
    answer: 'Standard protection is 60–90 days from approval, configurable by Digitalsofts admins per program rules.',
  },
  {
    question: 'How do payouts work?',
    answer:
      'Commissions move from Pending → Approved → Payable → Paid. Once payable commissions cross the minimum threshold (PKR 5,000 locally, USD 50 internationally), they are included in your next payout run.',
  },
  {
    question: 'How do I get certified?',
    answer:
      'Complete the relevant Academy track — Sales, Implementation or Technical. Certifications are awarded automatically once every lesson in a track is marked complete.',
  },
  {
    question: 'How do I move to a higher tier?',
    answer:
      'Tier progression is based on annual sales volume and certification status. Registered → Silver → Gold → Platinum → Strategic, reviewed by Digitalsofts admins against the published thresholds.',
  },
  {
    question: 'Can I get territory exclusivity?',
    answer:
      'Yes, but it is earned, not automatic. Exclusive territory rights require minimum annual sales, marketing investment, certified staff and quarterly targets — and lapse if targets are missed.',
  },
  {
    question: 'How does recurring SaaS commission work?',
    answer:
      'For SaaS products, your commission percentage applies every billing cycle for as long as the customer stays active and pays — turning your partner business into a recurring revenue stream, not a one-time payout.',
  },
]

export default function FAQSection() {
  return (
    <section id="faq" className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="FAQ"
          title="Common questions from new partners"
          subtitle="Everything you need to know before applying — commissions, protection, payouts and certification."
          center
        />
        <Reveal delay={0.1} className="mt-10">
          <Accordion items={faqs} />
        </Reveal>
      </div>
    </section>
  )
}
