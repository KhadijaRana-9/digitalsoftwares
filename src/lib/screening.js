// Deterministic, explainable partner-tier recommendation — no external calls,
// no black-box scoring. Evaluates exactly the fields the program brief names
// (company, website, industry, territory, customer base, experience) and
// recommends a starting tier. The recommendation is advisory only — final
// approval always happens through an authorized admin action.
const EXPERIENCE_SCORES = {
  'New to Digitalsofts': 0,
  '1–2 years selling similar products': 1,
  '3–5 years': 2,
  '5+ years': 3,
}

const CUSTOMER_BASE_SCORES = {
  '0–10 businesses': 0,
  '10–50 businesses': 1,
  '50–200 businesses': 2,
  '200+ businesses': 3,
}

export function scoreApplication(app) {
  const reasons = []
  let score = 0

  const experiencePoints = EXPERIENCE_SCORES[app.experience] ?? 0
  score += experiencePoints
  reasons.push(`${experiencePoints} pt — experience: ${app.experience || 'unspecified'}`)

  const customerBasePoints = CUSTOMER_BASE_SCORES[app.customer_base] ?? 0
  score += customerBasePoints
  reasons.push(`${customerBasePoints} pt — customer base: ${app.customer_base || 'unspecified'}`)

  if (app.website) { score += 1; reasons.push('+1 pt — has a website') }
  if (app.company) { score += 1; reasons.push('+1 pt — registered company name') }
  if (app.territory) { score += 1; reasons.push('+1 pt — specified a target territory') }

  let recommended = 'affiliate'
  if (score >= 7) recommended = 'strategic'
  else if (score >= 5) recommended = 'certified'
  else if (score >= 3) recommended = 'reseller'
  else if (score >= 1) recommended = 'referral'

  return { score, maxScore: 9, recommended, reasons }
}
