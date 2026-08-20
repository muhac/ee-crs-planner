import { useTranslation } from 'react-i18next'
import type { EligibilityReason, EligibilityResult, ProgramStatus } from '@/engine/eligibility'
import { eligibleProgramNames } from '@/engine/eligibility'

function Badge({ eligible }: { eligible: boolean }) {
  return <span>{eligible ? '✓' : '✗'}</span>
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
          {detail && <span className="text-muted-foreground font-mono text-xs">{detail}</span>}
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
  const eligiblePrograms = eligibleProgramNames(result)
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold">{t('eligibility.title')}</h4>
        {eligiblePrograms.length > 0 ? (
          <span className="text-sm font-semibold">{eligiblePrograms.join(' / ')}</span>
        ) : (
          <span className="text-muted-foreground text-sm">{t('eligibility.none')}</span>
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
