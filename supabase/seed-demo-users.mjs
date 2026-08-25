// Creates real Supabase Auth accounts + realistic seed business data for
// every demo role. Requires the SERVICE ROLE key (never the anon key) —
// this script is meant to be run locally/once, never shipped to the browser.
//
// Usage:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node supabase/seed-demo-users.mjs
//
// Idempotent: re-running finds existing users/records by natural key
// (email, or a `seed:` marker in a notes/description field) and updates
// rather than duplicates them.
//
// Requires migrations 0001-0004 and seed.sql to already be applied.

import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment first.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const DEMO_USERS = [
  { email: 'superadmin@digitalsofts.com', password: 'SuperAdmin@123', fullName: 'Ayesha Raza', role: 'super_admin' },
  { email: 'admin@digitalsofts.com', password: 'Admin@123', fullName: 'Bilal Ahmed', role: 'admin', adminRoleKey: 'partner_manager' },
  { email: 'partner@digitalsofts.com', password: 'Partner@123', fullName: 'Sana Khan', role: 'partner', tierKey: 'reseller', company: 'Sana Tech Solutions', country: 'Pakistan', city: 'Lahore' },
  { email: 'certified.partner@digitalsofts.com', password: 'Partner@123', fullName: 'Omar Farooq', role: 'partner', tierKey: 'certified', company: 'Farooq IT Services', country: 'Pakistan', city: 'Karachi' },
  { email: 'affiliate@digitalsofts.com', password: 'Affiliate@123', fullName: 'Hina Malik', role: 'partner', tierKey: 'affiliate', company: null, country: 'Pakistan', city: 'Islamabad' },
  { email: 'customer@digitalsofts.com', password: 'Customer@123', fullName: 'Kamran Sheikh', role: 'customer' },
]

async function findAuthUserByEmail(email) {
  // Admin API list is paginated; fine for a handful of demo accounts.
  let page = 1
  while (page < 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (data.users.length < 200) return null
    page += 1
  }
  return null
}

async function ensureAuthUser({ email, password, fullName }) {
  const existing = await findAuthUserByEmail(email)
  if (existing) {
    console.log(`  ✓ auth user exists: ${email}`)
    return existing
  }
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: fullName },
  })
  if (error) throw new Error(`creating ${email}: ${error.message}`)
  console.log(`  + created auth user: ${email}`)
  return data.user
}

async function main() {
  console.log('Seeding demo accounts against', url)

  const { data: tiers, error: tierErr } = await admin.from('partner_tiers').select('id, key')
  if (tierErr) throw tierErr
  const tierIdByKey = Object.fromEntries(tiers.map((t) => [t.key, t.id]))

  const { data: roles, error: roleErr } = await admin.from('roles').select('id, key')
  if (roleErr) throw roleErr
  const roleIdByKey = Object.fromEntries(roles.map((r) => [r.key, r.id]))

  const created = {}

  for (const u of DEMO_USERS) {
    console.log(`\n${u.email} (${u.role}${u.tierKey ? `/${u.tierKey}` : ''})`)
    const authUser = await ensureAuthUser(u)
    created[u.email] = authUser

    const profilePayload = { full_name: u.fullName, role: u.role }
    if (u.role === 'admin') profilePayload.admin_role_id = roleIdByKey[u.adminRoleKey] ?? null
    const { error: profileErr } = await admin.from('profiles').update(profilePayload).eq('id', authUser.id)
    if (profileErr) throw new Error(`updating profile for ${u.email}: ${profileErr.message}`)
    console.log('  ✓ profile role set')

    if (u.role === 'partner') {
      const referralCode = `DS-${u.tierKey.slice(0, 3).toUpperCase()}${authUser.id.slice(0, 4).toUpperCase()}`
      const { error: ppErr } = await admin.from('partner_profiles').upsert(
        {
          id: authUser.id,
          tier_id: tierIdByKey[u.tierKey],
          referral_code: referralCode,
          company: u.company,
          country: u.country,
          city: u.city,
          status: 'active',
        },
        { onConflict: 'id' }
      )
      if (ppErr) throw new Error(`upserting partner_profiles for ${u.email}: ${ppErr.message}`)
      console.log('  ✓ partner profile active, tier', u.tierKey)

      const { error: rlErr } = await admin
        .from('referral_links')
        .upsert({ partner_id: authUser.id, code: referralCode, target_url: '/' }, { onConflict: 'partner_id' })
      if (rlErr) throw new Error(`upserting referral_links for ${u.email}: ${rlErr.message}`)
    }
  }

  console.log('\nSeeding business data…')
  await seedResellerData(created['partner@digitalsofts.com'].id)
  await seedCertifiedPartnerData(created['certified.partner@digitalsofts.com'].id)
  await seedAffiliateData(created['affiliate@digitalsofts.com'].id)
  await seedCustomerData(created['customer@digitalsofts.com'].id)

  console.log('\nDone. See README → Demo Credentials for the login list.')
}

async function firstProductId() {
  const { data } = await admin.from('products').select('id').eq('is_active', true).limit(1).maybeSingle()
  return data?.id ?? null
}

async function seedResellerData(partnerId) {
  const productId = await firstProductId()
  const marker = 'seed:reseller-demo'

  const { data: existingLead } = await admin.from('leads').select('id').eq('partner_id', partnerId).eq('notes', marker).maybeSingle()
  if (!existingLead) {
    await admin.from('leads').insert([
      { partner_id: partnerId, company_name: 'Al-Karam Retail Group', contact_name: 'Fahad Iqbal', contact_email: 'fahad@alkaram.example', product_id: productId, industry: 'Retail', country: 'Pakistan', estimated_value: 250000, status: 'won', notes: marker },
      { partner_id: partnerId, company_name: 'Metro Textiles', contact_name: 'Zara Hussain', contact_email: 'zara@metrotextiles.example', product_id: productId, industry: 'Textile', country: 'Pakistan', estimated_value: 400000, status: 'proposal', notes: marker },
      { partner_id: partnerId, company_name: 'City Hardware Store', contact_name: 'Nasir Ali', product_id: productId, industry: 'Retail', country: 'Pakistan', estimated_value: 120000, status: 'new', notes: marker },
    ])
    console.log('  + reseller leads seeded')
  }

  const { data: existingDeal } = await admin.from('deal_registrations').select('id').eq('partner_id', partnerId).eq('notes', marker).maybeSingle()
  let dealId = existingDeal?.id
  if (!dealId) {
    const { data: deal } = await admin
      .from('deal_registrations')
      .insert({ partner_id: partnerId, customer_company: 'Al-Karam Retail Group', contact_name: 'Fahad Iqbal', contact_email: 'fahad@alkaram.example', product_id: productId, industry: 'Retail', country: 'Pakistan', estimated_value: 250000, notes: marker })
      .select()
      .single()
    dealId = deal?.id
    console.log('  + reseller deal registration seeded')
  }

  const { data: tier } = await admin.from('partner_profiles').select('tier_id').eq('id', partnerId).single()
  const { data: pricing } = await admin.from('product_pricing').select('commission_percent').eq('product_id', productId).eq('tier_id', tier.tier_id).maybeSingle()
  const commissionPercent = pricing?.commission_percent ?? 25

  const { data: existingCustomer } = await admin.from('customers').select('id').eq('partner_id', partnerId).eq('company_name', 'Al-Karam Retail Group').maybeSingle()
  let customerId = existingCustomer?.id
  if (!customerId) {
    const { data: cust } = await admin
      .from('customers')
      .insert({ partner_id: partnerId, deal_id: dealId, company_name: 'Al-Karam Retail Group', contact_name: 'Fahad Iqbal', contact_email: 'fahad@alkaram.example', industry: 'Retail', country: 'Pakistan', account_status: 'active' })
      .select()
      .single()
    customerId = cust?.id
    console.log('  + reseller customer seeded')

    await admin.from('customer_products').insert({ customer_id: customerId, product_id: productId, subscription_type: 'annual', revenue: 250000, renewal_date: new Date(Date.now() + 300 * 86400000).toISOString().slice(0, 10), status: 'active' })

    await admin.from('deal_registrations').update({ status: 'closed' }).eq('id', dealId)

    const { data: c1 } = await admin.from('commissions').insert({ partner_id: partnerId, customer_id: customerId, product_id: productId, deal_id: dealId, amount: Math.round(250000 * commissionPercent / 100), commission_percent: commissionPercent, commission_type: 'one_time', status: 'paid', earned_date: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10), paid_date: new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10) }).select().single()
    await admin.from('commissions').insert({ partner_id: partnerId, customer_id: customerId, product_id: productId, amount: 15000, commission_percent: commissionPercent, commission_type: 'recurring', status: 'payable', earned_date: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10), payable_date: new Date().toISOString().slice(0, 10) })
    await admin.from('commissions').insert({ partner_id: partnerId, customer_id: customerId, product_id: productId, amount: 12000, commission_percent: commissionPercent, commission_type: 'recurring', status: 'pending', earned_date: new Date().toISOString().slice(0, 10) })

    if (c1) {
      const { data: payout } = await admin.from('payouts').insert({ partner_id: partnerId, amount: c1.amount, method: 'bank_transfer', status: 'paid', processed_at: new Date(Date.now() - 15 * 86400000).toISOString() }).select().single()
      if (payout) await admin.from('payout_commissions').insert({ payout_id: payout.id, commission_id: c1.id })
    }
    console.log('  + reseller commissions + payout seeded')

    const { data: rp } = await admin.from('partner_profiles').select('annual_sales_ytd').eq('id', partnerId).single()
    await admin.from('partner_profiles').update({ annual_sales_ytd: Number(rp?.annual_sales_ytd ?? 0) + 250000 }).eq('id', partnerId)
    console.log('  + reseller annual_sales_ytd updated to reflect closed deal')
  }

  const { data: existingOpp } = await admin.from('opportunities').select('id').eq('partner_id', partnerId).eq('notes', marker).maybeSingle()
  if (!existingOpp) {
    await admin.from('opportunities').insert([
      { partner_id: partnerId, customer_id: customerId, name: 'Al-Karam — Phase 2 rollout', product_id: productId, value: 180000, probability: 60, stage: 'negotiation', notes: marker },
      { partner_id: partnerId, name: 'Metro Textiles — Production ERP', product_id: productId, value: 400000, probability: 40, stage: 'proposal', notes: marker },
    ])
    console.log('  + reseller opportunities seeded')
  }

  const { data: lessons } = await admin.from('lessons').select('id, course:courses(certification_type)').limit(5)
  if (lessons?.length) {
    for (const lesson of lessons) {
      await admin.from('course_progress').upsert({ partner_id: partnerId, lesson_id: lesson.id, completed: true, completed_at: new Date().toISOString() }, { onConflict: 'partner_id,lesson_id' })
    }
    console.log('  + reseller training progress seeded')
  }
}

async function seedCertifiedPartnerData(partnerId) {
  const productId = await firstProductId()
  const marker = 'seed:certified-demo'

  const { data: existingCustomer } = await admin.from('customers').select('id').eq('partner_id', partnerId).eq('company_name', 'Faisal Manufacturing Co').maybeSingle()
  let customerId = existingCustomer?.id
  if (!customerId) {
    const { data: cust } = await admin
      .from('customers')
      .insert({ partner_id: partnerId, company_name: 'Faisal Manufacturing Co', contact_name: 'Adeel Faisal', contact_email: 'adeel@faisalmfg.example', industry: 'Manufacturing', country: 'Pakistan', account_status: 'active' })
      .select()
      .single()
    customerId = cust?.id

    await admin.from('customer_products').insert({ customer_id: customerId, product_id: productId, subscription_type: 'annual', revenue: 300000, renewal_date: new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10), status: 'active' })

    const { data: tier } = await admin.from('partner_profiles').select('tier_id').eq('id', partnerId).single()
    const { data: pricing } = await admin.from('product_pricing').select('commission_percent').eq('product_id', productId).eq('tier_id', tier.tier_id).maybeSingle()
    const pct = pricing?.commission_percent ?? 32

    await admin.from('commissions').insert([
      { partner_id: partnerId, customer_id: customerId, product_id: productId, amount: Math.round(300000 * pct / 100), commission_percent: pct, commission_type: 'one_time', status: 'paid', earned_date: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), paid_date: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10) },
      { partner_id: partnerId, customer_id: customerId, product_id: productId, amount: 18000, commission_percent: pct, commission_type: 'recurring', status: 'approved', earned_date: new Date().toISOString().slice(0, 10) },
    ])
    console.log('  + certified partner customer + commissions seeded')

    const { data: cp } = await admin.from('partner_profiles').select('annual_sales_ytd').eq('id', partnerId).single()
    await admin.from('partner_profiles').update({ annual_sales_ytd: Number(cp?.annual_sales_ytd ?? 0) + 300000 }).eq('id', partnerId)
    console.log('  + certified partner annual_sales_ytd updated to reflect closed deal')
  }

  const { data: existingLead } = await admin.from('leads').select('id').eq('partner_id', partnerId).eq('notes', marker).maybeSingle()
  if (!existingLead) {
    await admin.from('leads').insert([
      { partner_id: partnerId, company_name: 'Coastal Hotels Group', product_id: productId, industry: 'Hospitality', country: 'Pakistan', estimated_value: 150000, status: 'demo', notes: marker },
      { partner_id: partnerId, company_name: 'Prime Logistics', product_id: productId, industry: 'Logistics', country: 'Pakistan', estimated_value: 300000, status: 'qualified', notes: marker },
    ])
    console.log('  + certified partner leads seeded')
  }

  const { data: lessons } = await admin.from('lessons').select('id, course:courses(certification_type)')
  const salesLessons = (lessons ?? []).filter((l) => l.course?.certification_type === 'sales')
  const implLessons = (lessons ?? []).filter((l) => l.course?.certification_type === 'implementation')
  for (const lesson of [...salesLessons, ...implLessons]) {
    await admin.from('course_progress').upsert({ partner_id: partnerId, lesson_id: lesson.id, completed: true, completed_at: new Date().toISOString() }, { onConflict: 'partner_id,lesson_id' })
  }
  console.log('  + certified partner completed Sales + Implementation tracks (certifications auto-award via trigger)')
}

async function seedAffiliateData(partnerId) {
  const { data: link } = await admin.from('referral_links').select('code').eq('partner_id', partnerId).maybeSingle()
  if (!link) return
  const { data: existingEvent } = await admin.from('referral_events').select('id').eq('referral_code', link.code).limit(1).maybeSingle()
  if (!existingEvent) {
    const events = []
    for (let i = 0; i < 40; i++) events.push({ referral_code: link.code, event_type: 'click' })
    for (let i = 0; i < 8; i++) events.push({ referral_code: link.code, event_type: 'lead' })
    events.push({ referral_code: link.code, event_type: 'conversion', value: 60000 })
    events.push({ referral_code: link.code, event_type: 'conversion', value: 45000 })
    await admin.from('referral_events').insert(events)
    console.log('  + affiliate referral events seeded (40 clicks, 8 leads, 2 conversions)')
  }

  const productId = await firstProductId()
  const { data: existingCommission } = await admin.from('commissions').select('id').eq('partner_id', partnerId).limit(1).maybeSingle()
  if (!existingCommission) {
    const { data: cust } = await admin.from('customers').insert({ partner_id: partnerId, company_name: 'Green Valley Farms', industry: 'Agriculture', country: 'Pakistan', account_status: 'active' }).select().single()
    await admin.from('commissions').insert({ partner_id: partnerId, customer_id: cust?.id, product_id: productId, amount: 9000, commission_percent: 15, commission_type: 'one_time', status: 'paid', earned_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), paid_date: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10) })
    console.log('  + affiliate commission seeded')

    const { data: ap } = await admin.from('partner_profiles').select('annual_sales_ytd').eq('id', partnerId).single()
    await admin.from('partner_profiles').update({ annual_sales_ytd: Number(ap?.annual_sales_ytd ?? 0) + 60000 }).eq('id', partnerId)
    console.log('  + affiliate annual_sales_ytd updated to reflect referred deal')
  }
}

async function seedCustomerData(userId) {
  const { data: existing } = await admin.from('customers').select('id').eq('user_id', userId).maybeSingle()
  if (existing) {
    console.log('  ✓ customer record already linked')
    return
  }
  const { data: reseller } = await admin.from('profiles').select('id').eq('email', 'partner@digitalsofts.com').maybeSingle()
  const productId = await firstProductId()
  const { data: cust } = await admin
    .from('customers')
    .insert({ partner_id: reseller?.id, user_id: userId, company_name: 'Sheikh Enterprises', contact_name: 'Kamran Sheikh', contact_email: 'customer@digitalsofts.com', industry: 'Retail', country: 'Pakistan', account_status: 'active' })
    .select()
    .single()
  if (cust && productId) {
    await admin.from('customer_products').insert({ customer_id: cust.id, product_id: productId, subscription_type: 'annual', revenue: 180000, renewal_date: new Date(Date.now() + 250 * 86400000).toISOString().slice(0, 10), status: 'active' })
  }
  console.log('  + customer record + subscription seeded and linked to login')
}

main().catch((err) => {
  console.error('\nSeeding failed:', err.message)
  process.exit(1)
})
