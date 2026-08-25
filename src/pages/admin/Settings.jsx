import { useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { PageHeader, Card, CardHeader, Input, FormField, Button, SkeletonRows, EmptyState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { titleCase } from '../../lib/utils.js'

export default function Settings() {
  const toast = useToast()
  const [settingDrafts, setSettingDrafts] = useState({})

  const settingsQ = useSupaQuery(['settings_all'], (sb) => sb.from('system_settings').select('*').order('key'))
  const slaQ = useSupaQuery(['sla_terms'], (sb) => sb.from('sla_terms').select('*').order('party').order('sort_order'))

  const settingMutation = useSupaMutation(
    (sb, { key, value }) => sb.from('system_settings').update({ value }).eq('key', key).select().single(),
    { invalidate: [['settings_all']], onSuccess: () => toast.success('Setting updated.'), onError: (e) => toast.error(e.message) }
  )

  const saveSetting = (setting, field) => {
    const draft = settingDrafts[setting.key] ?? {}
    settingMutation.mutate({ key: setting.key, value: { ...setting.value, [field]: Number(draft[field] ?? setting.value[field]) } })
  }

  const digitalsoftsTerms = (slaQ.data ?? []).filter((t) => t.party === 'digitalsofts')
  const partnerTerms = (slaQ.data ?? []).filter((t) => t.party === 'partner')

  return (
    <div>
      <PageHeader title="System Settings" subtitle="Platform-wide thresholds and rules — no redeploy needed to change them." />

      <Card>
        <CardHeader title="Platform settings" subtitle="Deal protection window, payout thresholds, MDF rate, exclusivity thresholds" />
        {settingsQ.isLoading && <SkeletonRows rows={4} className="p-5" />}
        <div className="divide-y divide-line">
          {(settingsQ.data ?? []).map((s) => (
            <div key={s.key} className="flex flex-wrap items-end justify-between gap-3 p-5">
              <div className="min-w-[240px]">
                <p className="font-semibold text-ink">{titleCase(s.key)}</p>
                <p className="text-xs text-ink-soft">{s.description}</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                {Object.keys(s.value).map((field) => (
                  <FormField key={field} label={field}>
                    <Input
                      type="number"
                      defaultValue={s.value[field]}
                      className="w-28"
                      onChange={(e) => setSettingDrafts((d) => ({ ...d, [s.key]: { ...d[s.key], [field]: e.target.value } }))}
                    />
                  </FormField>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  icon={SettingsIcon}
                  loading={settingMutation.isPending}
                  onClick={() => Object.keys(s.value).forEach((field) => saveSetting(s, field))}
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Digitalsofts obligations" subtitle="What the program promises every partner" />
          <div className="p-5">
            {digitalsoftsTerms.length === 0 && <EmptyState title="No SLA terms yet" />}
            <ul className="space-y-2">
              {digitalsoftsTerms.map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" /> {t.term}
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <Card>
          <CardHeader title="Partner obligations" subtitle="What every partner commits to" />
          <div className="p-5">
            {partnerTerms.length === 0 && <EmptyState title="No SLA terms yet" />}
            <ul className="space-y-2">
              {partnerTerms.map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" /> {t.term}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
