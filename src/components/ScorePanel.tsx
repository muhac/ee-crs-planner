import { useTranslation } from 'react-i18next'
import type { ScoreBreakdown } from '@/engine/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function Row({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  )
}

function Section({
  title,
  subtotal,
  children,
}: {
  title: string
  subtotal: number
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="tabular-nums text-sm font-semibold">{subtotal}</span>
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
}

export function ScorePanel({ score, swapGain = 0, onSwap }: Props) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-baseline justify-between">
          <span>{t('score.total')}</span>
          <span className="text-3xl tabular-nums">{score.total}</span>
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          {t(score.withSpouse ? 'score.summaryWithSpouse' : 'score.summaryWithoutSpouse', {
            age: score.age,
          })}
        </p>
        {swapGain > 0 && (
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
        <Section title={t('score.transferability')} subtotal={score.transferability.subtotal}>
          <Row label={t('score.eduLang')} value={score.transferability.educationLanguage} muted />
          <Row label={t('score.eduCdnWork')} value={score.transferability.educationCanadianWork} muted />
          <Row label={t('score.foreignLang')} value={score.transferability.foreignWorkLanguage} muted />
          <Row label={t('score.foreignCdnWork')} value={score.transferability.foreignWorkCanadianWork} muted />
          {score.transferability.certificate > 0 && (
            <Row label={t('score.certLang')} value={score.transferability.certificate} muted />
          )}
        </Section>

        <Separator />
        <Section title={t('score.additional')} subtotal={score.additional.subtotal}>
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
          {score.additional.subtotal === 0 && (
            <p className="text-muted-foreground text-xs">{t('score.noAdditional')}</p>
          )}
        </Section>
      </CardContent>
    </Card>
  )
}
