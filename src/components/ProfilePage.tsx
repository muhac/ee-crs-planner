import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Download, Share2, Trash2 } from 'lucide-react'
import type { StoredProfile } from '@/storage/schema'
import { calculateCrs, swapGain, swapLanguages } from '@/engine/crs'
import { checkEligibility } from '@/engine/eligibility'
import { projectProfile } from '@/engine/simulate'
import type { ProjectionSelection } from './Projection'
import { addMonths, todayIso } from '@/engine/dates'
import { buildShareUrl } from '@/storage/share'
import { makeEnvelope } from '@/storage/share'
import { ProfileForm } from './ProfileForm'
import { ScorePanel } from './ScorePanel'
import { MobileScoreBar } from './MobileScoreBar'
import { Projection } from './Projection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
  stored: StoredProfile
  onChange: (fn: (prev: StoredProfile) => StoredProfile) => void
  onBack: () => void
  onRemove: () => void
  /** Preselected projection point (e.g. clicked on the home overview). */
  initialSelection?: ProjectionSelection | null
}

export function ProfilePage({ stored, onChange, onBack, onRemove, initialSelection }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const today = useMemo(todayIso, [])
  const score = useMemo(() => calculateCrs(stored.profile, today), [stored.profile, today])
  const gain = useMemo(() => swapGain(stored.profile, today), [stored.profile, today])
  const swap = () =>
    onChange((p) => ({ ...p, profile: swapLanguages(p.profile) ?? p.profile }))

  const [selected, setSelected] = useState<ProjectionSelection | null>(initialSelection ?? null)
  const projection = useMemo(() => {
    if (!selected) return null
    const scenario = stored.scenarios.find((s) => s.id === selected.scenarioId)
    if (!scenario || selected.monthOffset > scenario.horizonMonths) return null
    const date = addMonths(today, selected.monthOffset)
    const projected = projectProfile(stored.profile, scenario, today, selected.monthOffset)
    return {
      label: `${scenario.name} · ${date.slice(0, 7)}`,
      date: date.slice(0, 7),
      score: calculateCrs(projected, date),
      eligibility: checkEligibility(projected, date),
    }
  }, [selected, stored.profile, stored.scenarios, today])

  const currentEligibility = useMemo(
    () => checkEligibility(stored.profile, today),
    [stored.profile, today],
  )
  const displayedScore = projection?.score ?? score
  const displayedEligibility = projection?.eligibility ?? currentEligibility
  const contextLabel = projection?.label
  const clearSelection = () => setSelected(null)

  const share = async () => {
    await navigator.clipboard.writeText(buildShareUrl(stored))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(makeEnvelope(stored), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${stored.name}.ee-crs.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Tabs defaultValue={initialSelection ? 'projection' : 'profile'}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">{t('page.back')}</span>
          </Button>
          <Input
            value={stored.name}
            className="min-w-0 flex-1 font-medium sm:max-w-48 sm:flex-none"
            onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))}
            aria-label={t('page.profileName')}
          />
          <TabsList className="order-last w-full sm:order-none sm:w-auto">
            <TabsTrigger value="profile">{t('page.tabProfile')}</TabsTrigger>
            <TabsTrigger value="projection">{t('page.tabProjection')}</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('page.share')}
              className="text-muted-foreground"
              onClick={() => void share()}
            >
              {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
              <span className="hidden sm:inline">
                {copied ? t('page.shareCopied') : t('page.share')}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('page.exportJson')}
              className="text-muted-foreground"
              onClick={exportJson}
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">{t('page.exportJson')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('list.delete')}
              className="text-muted-foreground"
              onClick={() => {
                if (confirm(t('list.deleteConfirm', { name: stored.name }))) onRemove()
              }}
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">{t('list.delete')}</span>
            </Button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
          <div>
          <TabsContent value="profile">
            <ProfileForm
              profile={stored.profile}
              onChange={(profile) => onChange((p) => ({ ...p, profile }))}
            />
          </TabsContent>
          <TabsContent value="projection">
            <Projection
              profile={stored.profile}
              scenarios={stored.scenarios}
              onChange={(scenarios) => onChange((p) => ({ ...p, scenarios }))}
              selected={selected}
              onSelect={setSelected}
            />
          </TabsContent>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-[4.5rem]">
              <ScorePanel
                score={displayedScore}
                swapGain={gain}
                onSwap={swap}
                contextLabel={contextLabel}
                onClearContext={clearSelection}
                eligibility={displayedEligibility}
                nowTotal={score.total}
              />
            </div>
          </div>
        </div>
      </Tabs>

      <MobileScoreBar
        score={displayedScore}
        swapGain={gain}
        onSwap={swap}
        contextLabel={contextLabel}
        contextDate={projection?.date}
        onClearContext={clearSelection}
        eligibility={displayedEligibility}
        nowTotal={score.total}
      />
    </div>
  )
}
