import type { ScoreBreakdown } from '@/engine/types'
import { ScorePanel } from './ScorePanel'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

/** Fixed bottom bar on small screens showing the live total, expandable to the full breakdown. */
export function MobileScoreBar({ score }: { score: ScoreBreakdown }) {
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div>
          <p className="text-muted-foreground text-xs">CRS 总分</p>
          <p className="text-2xl font-bold tabular-nums leading-tight">{score.total}</p>
        </div>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">查看明细</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="sr-only">
              <DrawerTitle>分数明细</DrawerTitle>
            </DrawerHeader>
            <div className="max-h-[75vh] overflow-y-auto px-4 pb-6">
              <ScorePanel score={score} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
