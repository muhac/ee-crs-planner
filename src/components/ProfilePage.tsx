import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
}

export function ProfilePage({ stored, onChange, onBack }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const today = useMemo(todayIso, [])
  const score = useMemo(() => calculateCrs(stored.profile, today), [stored.profile, today])
  const gain = useMemo(() => swapGain(stored.profile, today), [stored.profile, today])
  const swap = () =>
    onChange((p) => ({ ...p, profile: swapLanguages(p.profile) ?? p.profile }))

  const [selected, setSelected] = useState<ProjectionSelection | null>(null)
  const projection = useMemo(() => {
    if (!selected) return null
    const scenario = stored.scenarios.find((s) => s.id === selected.scenarioId)
    if (!scenario || selected.monthOffset > scenario.horizonMonths) return null
    const date = addMonths(today, selected.monthOffset)
    const projected = projectProfile(stored.profile, scenario, today, selected.monthOffset)
    return {
      label: `${scenario.name} · ${date.slice(0, 7)}`,
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
    <div className="pb-24 lg:pb-0">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          {t('page.back')}
        </Button>
        <Input
          value={stored.name}
          className="max-w-48 font-medium"
          onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))}
          aria-label={t('page.profileName')}
        />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void share()}>
            {copied ? t('page.shareCopied') : t('page.share')}
          </Button>
          <Button variant="outline" size="sm" onClick={exportJson}>
            {t('page.exportJson')}
          </Button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <Tabs defaultValue="profile">
          <TabsList className="mb-2">
            <TabsTrigger value="profile">{t('page.tabProfile')}</TabsTrigger>
            <TabsTrigger value="projection">{t('page.tabProjection')}</TabsTrigger>
          </TabsList>
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
        </Tabs>

        <div className="hidden lg:block">
          <div className="sticky top-4">
            <ScorePanel
              score={displayedScore}
              swapGain={gain}
              onSwap={swap}
              contextLabel={contextLabel}
              onClearContext={clearSelection}
              eligibility={displayedEligibility}
            />
          </div>
        </div>
      </div>

      <MobileScoreBar
        score={displayedScore}
        swapGain={gain}
        onSwap={swap}
        contextLabel={contextLabel}
        onClearContext={clearSelection}
        eligibility={displayedEligibility}
      />
    </div>
  )
}
