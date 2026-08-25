import { Package, LifeBuoy } from 'lucide-react'
import { PageHeader, Card, CardHeader, Badge, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatCurrency, formatDate } from '../../lib/utils.js'

export default function CustomerDashboard() {
  const { profile, customerRecord } = useAuth()

  const subscriptionsQ = useSupaQuery(
    ['customer_subscriptions', customerRecord?.id],
    (sb) => sb.from('customer_products').select('*, product:products(name, description)').eq('customer_id', customerRecord.id).order('created_at', { ascending: false }),
    { enabled: Boolean(customerRecord?.id) }
  )

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name?.split(' ')[0] || 'there'}`} subtitle="Your Digitalsofts products and account overview." />

      {!customerRecord && (
        <EmptyState
          icon={Package}
          title="No linked customer account yet"
          description="Your login isn't linked to a customer record. Contact your Digitalsofts partner or support if this looks wrong."
        />
      )}

      {customerRecord && (
        <>
          <Card className="mb-6 p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Info label="Company" value={customerRecord.company_name} />
              <Info label="Industry" value={customerRecord.industry} />
              <Info label="Country" value={customerRecord.country} />
              <Info label="Account status" value={<Badge tone={customerRecord.account_status === 'active' ? 'green' : 'gray'}>{customerRecord.account_status}</Badge>} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Your products & subscriptions" />
            {subscriptionsQ.isLoading && <SkeletonRows rows={3} className="p-5" />}
            {subscriptionsQ.isError && <ErrorState onRetry={subscriptionsQ.refetch} />}
            {subscriptionsQ.isSuccess && (subscriptionsQ.data ?? []).length === 0 && (
              <div className="p-5"><EmptyState icon={Package} title="No products on your account yet" /></div>
            )}
            {subscriptionsQ.isSuccess && (subscriptionsQ.data ?? []).length > 0 && (
              <div className="divide-y divide-line">
                {subscriptionsQ.data.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                    <div>
                      <p className="font-semibold text-ink">{s.product?.name}</p>
                      <p className="text-xs text-ink-soft">{s.subscription_type || 'One-time'} · Renews {formatDate(s.renewal_date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-ink">{formatCurrency(s.revenue)}</span>
                      <Badge tone={s.status === 'active' ? 'green' : 'gray'}>{s.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="mt-6 flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
            <LifeBuoy className="h-4 w-4" /> Need help with a product? Open a ticket from the Support tab.
          </div>
        </>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-0.5 text-ink">{value || '—'}</p>
    </div>
  )
}
