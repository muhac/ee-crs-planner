import { useMemo, useState } from 'react'
import type { StoredProfile } from '@/storage/schema'
import { calculateCrs } from '@/engine/crs'
import { todayIso } from '@/engine/dates'
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
  const [copied, setCopied] = useState(false)
  const today = useMemo(todayIso, [])
  const score = useMemo(() => calculateCrs(stored.profile, today), [stored.profile, today])

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
          ← 返回
        </Button>
        <Input
          value={stored.name}
          className="max-w-48 font-medium"
          onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))}
          aria-label="档案名称"
        />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void share()}>
            {copied ? '已复制链接 ✓' : '分享链接'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportJson}>
            导出 JSON
          </Button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <Tabs defaultValue="profile">
          <TabsList className="mb-2">
            <TabsTrigger value="profile">档案资料</TabsTrigger>
            <TabsTrigger value="projection">未来推演</TabsTrigger>
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
            />
          </TabsContent>
        </Tabs>

        <div className="hidden lg:block">
          <div className="sticky top-4">
            <ScorePanel score={score} />
          </div>
        </div>
      </div>

      <MobileScoreBar score={score} />
    </div>
  )
}
