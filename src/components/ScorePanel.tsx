import { useTranslation } from 'react-i18next'
import type { ScoreBreakdown } from '@/engine/types'
import type { EligibilityResult } from '@/engine/eligibility'
import { EligibilityCard } from './EligibilityCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function Row({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
      <span className={`tabular-nums ${muted ? 'text-muted-foreground' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  )
}

/** Shows "raw → capped" when a cap clipped the sum, so items still add up visibly. */
function CappedValue({ raw, capped, className = '' }: { raw: number; capped: number; className?: string }) {
  if (raw <= capped) return <span className={`tabular-nums ${className}`}>{capped}</span>
  return (
    <span className={`tabular-nums ${className}`}>
      <span className="text-muted-foreground mr-1.5 font-normal line-through">{raw}</span>
      {capped}
    </span>
  )
}

/** Sub-group header inside a section (e.g. a capped transferability combination). */
function GroupRow({ label, raw, capped }: { label: string; raw: number; capped: number }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span>{label}</span>
      <CappedValue raw={raw} capped={capped} className="font-medium" />
    </div>
  )
}

function Section({
  title,
  subtotal,
  raw,
  children,
}: {
  title: string
  subtotal: number
  raw?: number
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <CappedValue raw={raw ?? subtotal} capped={subtotal} className="text-sm font-semibold" />
      </div>
      <div className="space-y-1 pl-3">{children}</div>
    </div>
  )
}

interface Props {
  score: ScoreBreakdown
  /** Extra points available by swapping the first/second language designations. */
  swapGain?: number
  onSwap?: () => void
  /** When set, the panel shows a projected month instead of the current score. */
  contextLabel?: string
  onClearContext?: () => void
  eligibility?: EligibilityResult
  /** Today's total, for the ruler when `score` is a projected month. */
  nowTotal?: number
}

/**
 * The whole CRS universe is 1200 points; place this score on that ruler.
 * The fill always matches the big number above; while viewing a projected
 * month, today's score appears as a labelled tick.
 */
function ScoreRuler({ total, nowTotal }: { total: number; nowTotal?: number }) {
  const now = nowTotal ?? total
  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / 1200) * 100))}%`
  return (
    <div>
      <div className="bg-border/70 relative h-1.5 rounded-full">
        <div
          className="bg-foreground absolute inset-y-0 left-0 rounded-full"
          style={{ width: pct(total) }}
        />
        {total !== now && (
          <div
            className="bg-muted-foreground absolute -inset-y-1 w-px -translate-x-1/2"
            style={{ left: pct(now) }}
          />
        )}
      </div>
      <div className="text-muted-foreground relative mt-1 h-3.5 font-mono text-[10px]">
        <span className="absolute left-0">0</span>
        {total !== now && (
          <span className="absolute -translate-x-1/2" style={{ left: pct(now) }}>
            {now}
          </span>
        )}
        <span className="absolute right-0">1200</span>
      </div>
    </div>
  )
}

export function ScorePanel({
  score,
  swapGain = 0,
  onSwap,
  contextLabel,
  onClearContext,
  eligibility,
  nowTotal,
}: Props) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader className="pb-2">
        {contextLabel && (
          <div className="bg-muted/70 mb-1 flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5">
            <p className="text-xs font-medium">📍 {contextLabel}</p>
            {onClearContext && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 shrink-0 text-xs"
                onClick={onClearContext}
              >
                {t('score.backToNow')}
              </Button>
            )}
          </div>
        )}
        <CardTitle className="flex items-baseline justify-between">
          <span>{t('score.total')}</span>
          <span className="font-heading text-3xl font-bold tabular-nums">{score.total}</span>
        </CardTitle>
        <ScoreRuler total={score.total} nowTotal={nowTotal} />
        {swapGain > 0 && !contextLabel && (
          <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-amber-500/10 px-2.5 py-1.5">
            <p className="text-xs text-amber-700 dark:text-amber-500">
              {t('score.swapHint', { n: swapGain })}
            </p>
            {onSwap && (
              <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" onClick={onSwap}>
                {t('score.swapAction')}
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Section title={t('score.core')} subtotal={score.core.subtotal}>
          <Row label={t('score.age')} value={score.core.age} muted />
          <Row label={t('score.education')} value={score.core.education} muted />
          <Row label={t('score.firstLanguage')} value={score.core.firstLanguage} muted />
          {score.core.secondLanguage > 0 && (
            <Row label={t('score.secondLanguage')} value={score.core.secondLanguage} muted />
          )}
          <Row label={t('score.canadianWork')} value={score.core.canadianWork} muted />
        </Section>

        {score.withSpouse && (
          <>
            <Separator />
            <Section title={t('score.spouseFactors')} subtotal={score.spouse.subtotal}>
              <Row label={t('score.education')} value={score.spouse.education} muted />
              <Row label={t('score.language')} value={score.spouse.language} muted />
              <Row label={t('score.canadianWork')} value={score.spouse.canadianWork} muted />
            </Section>
          </>
        )}

        <Separator />
        <Section
          title={t('score.transferability')}
          subtotal={score.transferability.subtotal}
          raw={
            score.transferability.educationSubtotal +
            score.transferability.foreignWorkSubtotal +
            score.transferability.certificate
          }
        >
          <GroupRow
            label={t('score.eduGroup')}
            raw={score.transferability.educationLanguage + score.transferability.educationCanadianWork}
            capped={score.transferability.educationSubtotal}
          />
          <div className="space-y-1 pl-3">
            <Row label={t('score.eduLang')} value={score.transferability.educationLanguage} muted />
            <Row label={t('score.eduCdnWork')} value={score.transferability.educationCanadianWork} muted />
          </div>
          <GroupRow
            label={t('score.foreignGroup')}
            raw={
              score.transferability.foreignWorkLanguage + score.transferability.foreignWorkCanadianWork
            }
            capped={score.transferability.foreignWorkSubtotal}
          />
          <div className="space-y-1 pl-3">
            <Row label={t('score.foreignLang')} value={score.transferability.foreignWorkLanguage} muted />
            <Row label={t('score.foreignCdnWork')} value={score.transferability.foreignWorkCanadianWork} muted />
          </div>
          {score.transferability.certificate > 0 && (
            <Row label={t('score.certLang')} value={score.transferability.certificate} />
          )}
        </Section>

        <Separator />
        <Section
          title={t('score.additional')}
          subtotal={score.additional.subtotal}
          raw={
            score.additional.provincialNomination +
            score.additional.sibling +
            score.additional.french +
            score.additional.canadianEducation
          }
        >
          {score.additional.provincialNomination > 0 && (
            <Row label={t('score.pnp')} value={score.additional.provincialNomination} muted />
          )}
          {score.additional.french > 0 && (
            <Row label={t('score.frenchBonus')} value={score.additional.french} muted />
          )}
          {score.additional.canadianEducation > 0 && (
            <Row label={t('score.canadianEducation')} value={score.additional.canadianEducation} muted />
          )}
          {score.additional.sibling > 0 && (
            <Row label={t('score.sibling')} value={score.additional.sibling} muted />
          )}
        </Section>

        {eligibility && (
          <>
            <Separator />
            <EligibilityCard
              result={eligibility}
              pnp={score.additional.provincialNomination > 0}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
