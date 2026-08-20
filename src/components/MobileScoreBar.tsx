import { useTranslation } from 'react-i18next'
import type { ScoreBreakdown } from '@/engine/types'
import type { EligibilityResult } from '@/engine/eligibility'
import { ScorePanel } from './ScorePanel'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

interface Props {
  score: ScoreBreakdown
  swapGain?: number
  onSwap?: () => void
  contextLabel?: string
  onClearContext?: () => void
  eligibility?: EligibilityResult
  nowTotal?: number
}

/** Fixed bottom bar on small screens showing the live total, expandable to the full breakdown. */
export function MobileScoreBar({
  score,
  swapGain,
  onSwap,
  contextLabel,
  onClearContext,
  eligibility,
  nowTotal,
}: Props) {
  const { t } = useTranslation()
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div>
          <p className="text-muted-foreground text-xs">{t('score.total')}</p>
          <p className="font-heading text-2xl font-bold tabular-nums leading-tight">{score.total}</p>
        </div>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">{t('score.viewDetails')}</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="sr-only">
              <DrawerTitle>{t('score.detailsTitle')}</DrawerTitle>
            </DrawerHeader>
            <div className="max-h-[75vh] overflow-y-auto px-4 pb-6 pt-2 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:ring-0">
              <ScorePanel
                score={score}
                swapGain={swapGain}
                onSwap={onSwap}
                contextLabel={contextLabel}
                onClearContext={onClearContext}
                eligibility={eligibility}
                nowTotal={nowTotal}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
