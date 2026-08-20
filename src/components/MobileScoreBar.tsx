import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScoreBreakdown } from '@/engine/types'
import type { EligibilityResult } from '@/engine/eligibility'
import { eligibleProgramNames } from '@/engine/eligibility'
import { ScorePanel } from './ScorePanel'
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
  /** Short month label (YYYY-MM) shown in the bar while viewing a projection. */
  contextDate?: string
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
  contextDate,
  onClearContext,
  eligibility,
  nowTotal,
}: Props) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const programs = eligibility ? eligibleProgramNames(eligibility) : null
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur lg:hidden">
      <Drawer>
        <DrawerTrigger asChild>
          <button
            type="button"
            aria-label={t('score.viewDetails')}
            className="mx-auto block w-full max-w-2xl px-4 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.375rem))] pt-1.5 text-left"
          >
            <div className="bg-border mx-auto mb-1.5 h-1 w-10 rounded-full" />
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p
                  className={`text-muted-foreground truncate text-xs ${contextDate ? 'font-mono' : ''}`}
                >
                  {contextDate ?? t('score.total')}
                </p>
                <p className="font-heading text-2xl font-bold tabular-nums leading-tight">
                  {score.total}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                {programs &&
                  (programs.length > 0 ? (
                    <p className="text-sm font-medium">{programs.join(' / ')}</p>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t('eligibility.none')}</p>
                  ))}
                <p className="text-muted-foreground text-xs">{t('score.tapHint')}</p>
              </div>
            </div>
          </button>
        </DrawerTrigger>
          <DrawerContent
            onOpenAutoFocus={() => scrollRef.current?.scrollTo({ top: 0 })}
          >
            <DrawerHeader className="sr-only">
              <DrawerTitle>{t('score.detailsTitle')}</DrawerTitle>
            </DrawerHeader>
            <div
              ref={scrollRef}
              className="max-h-[75vh] overflow-y-auto px-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] pt-1 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:ring-0"
            >
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
  )
}
