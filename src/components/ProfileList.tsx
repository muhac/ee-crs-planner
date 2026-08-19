import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { StoredProfile } from '@/storage/schema'
import { isShareEnvelope } from '@/storage/schema'
import { calculateCrs } from '@/engine/crs'
import { todayIso } from '@/engine/dates'
import { newId, newStoredProfile } from '@/lib/profile'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  profiles: StoredProfile[]
  onOpen: (id: string) => void
  onAdd: (profile: StoredProfile) => void
  onRemove: (id: string) => void
}

export function ProfileList({ profiles, onOpen, onAdd, onRemove }: Props) {
  const { t } = useTranslation()
  const fileInput = useRef<HTMLInputElement>(null)
  const today = todayIso()

  const importJson = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isShareEnvelope(parsed)) throw new Error('bad format')
      onAdd({ ...parsed.profile, id: newId() })
    } catch {
      alert(t('list.importFailed'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('list.myProfiles')}</h2>
        <div className="flex gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importJson(f)
              e.target.value = ''
            }}
          />
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            {t('list.importJson')}
          </Button>
          <Button
            onClick={() => {
              const p = newStoredProfile(
                t('list.defaultName', { n: profiles.length + 1 }),
                t('projection.defaultScenarioName', { n: 1 }),
              )
              onAdd(p)
              onOpen(p.id)
            }}
          >
            {t('list.newProfile')}
          </Button>
        </div>
      </div>

      {profiles.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {t('list.emptyHint')}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {profiles.map((p) => {
          const score = calculateCrs(p.profile, today)
          return (
            <Card
              key={p.id}
              className="hover:border-ring cursor-pointer transition-colors"
              onClick={() => onOpen(p.id)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {t('list.updatedAt', { date: p.updatedAt })} ·{' '}
                    {t(score.withSpouse ? 'list.withSpouse' : 'list.withoutSpouse')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold tabular-nums">{score.total}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(t('list.deleteConfirm', { name: p.name }))) onRemove(p.id)
                    }}
                  >
                    {t('list.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
