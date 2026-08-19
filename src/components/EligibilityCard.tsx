import { useTranslation } from 'react-i18next'
import type { EligibilityReason, EligibilityResult, ProgramStatus } from '@/engine/eligibility'

function Badge({ eligible }: { eligible: boolean }) {
  return (
    <span className={eligible ? 'text-emerald-600 dark:text-emerald-500' : 'text-muted-foreground'}>
      {eligible ? '✓' : '✗'}
    </span>
  )
}

function ReasonList({ reasons }: { reasons: EligibilityReason[] }) {
  const { t } = useTranslation()
  return (
    <ul className="text-muted-foreground space-y-1 pl-3 text-sm">
      {reasons.map((r) => (
        <li key={r.key}>{t(`eligibility.reasons.${r.key}`, r.params)}</li>
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
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span>{name}</span>
        <span className="flex items-baseline gap-1.5">
          {detail && <span className="text-muted-foreground text-xs tabular-nums">{detail}</span>}
          <Badge eligible={status.eligible} />
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

/** Rendered as a section of the score panel, matching its visual structure. */
export function EligibilityCard({ result, pnp }: Props) {
  const { t } = useTranslation()
  const eligiblePrograms = (
    [
      ['CEC', result.cec.eligible],
      ['FSW', result.fsw.eligible],
      ['FST', result.fst.eligible],
    ] as const
  )
    .filter(([, ok]) => ok)
    .map(([name]) => name)
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold">{t('eligibility.title')}</h4>
        {eligiblePrograms.length > 0 ? (
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">
            {eligiblePrograms.join(' / ')}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm font-semibold">—</span>
        )}
      </div>
      <div className="space-y-1 pl-3">
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
    </div>
  )
}
