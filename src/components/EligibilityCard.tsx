import { useTranslation } from 'react-i18next'
import type { EligibilityReason, EligibilityResult, ProgramStatus } from '@/engine/eligibility'

function ReasonList({ reasons }: { reasons: EligibilityReason[] }) {
  const { t } = useTranslation()
  return (
    <ul className="text-muted-foreground mt-0.5 space-y-0.5 text-xs">
      {reasons.map((r) => (
        <li key={r.key}>· {t(`eligibility.reasons.${r.key}`, r.params)}</li>
      ))}
    </ul>
  )
}

function ProgramRow({
  name,
  status,
  detail,
}: {
  name: string
  status: ProgramStatus
  detail?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span>{name}</span>
        <span className={status.eligible ? 'text-emerald-600 dark:text-emerald-500' : 'text-muted-foreground'}>
          {status.eligible ? '✓' : '✗'}
          {detail && <span className="text-muted-foreground ml-1.5 text-xs">{detail}</span>}
        </span>
      </div>
      {!status.eligible && <ReasonList reasons={status.reasons} />}
    </div>
  )
}

interface Props {
  result: EligibilityResult
  /** Provincial nomination claimed on the profile. */
  pnp: boolean
}

export function EligibilityCard({ result, pnp }: Props) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2 rounded-md border px-3 py-2.5">
      <h4 className="text-sm font-semibold">{t('eligibility.title')}</h4>
      <ProgramRow name={t('eligibility.cec')} status={result.cec} />
      <ProgramRow
        name={t('eligibility.fsw')}
        status={result.fsw}
        detail={t('eligibility.fswPoints', { points: result.fsw.points67 })}
      />
      <ProgramRow name={t('eligibility.fst')} status={result.fst} />
      {pnp && !result.anyEligible && (
        <p className="rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-700 dark:text-amber-500">
          {t('eligibility.pnpWarning')}
        </p>
      )}
    </div>
  )
}
