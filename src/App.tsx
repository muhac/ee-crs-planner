import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StoredProfile } from '@/storage/schema'
import { parseShareHash } from '@/storage/share'
import { useAppData } from '@/hooks/useAppData'
import { calculateCrs } from '@/engine/crs'
import { todayIso } from '@/engine/dates'
import { newId } from '@/lib/profile'
import { ProfileList } from '@/components/ProfileList'
import { ProfilePage } from '@/components/ProfilePage'
import { HomeOverview } from '@/components/HomeOverview'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { ProjectionSelection } from '@/components/Projection'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function App() {
  const { t } = useTranslation()
  const { data, addProfile, updateProfile, removeProfile } = useAppData()
  const [openId, setOpenId] = useState<string | null>(null)
  const [pendingSelection, setPendingSelection] = useState<ProjectionSelection | null>(null)
  const [shared, setShared] = useState<StoredProfile | null>(null)

  const openProfile = (id: string, selection?: ProjectionSelection) => {
    setPendingSelection(selection ?? null)
    setOpenId(id)
  }

  useEffect(() => {
    const fromHash = parseShareHash(location.hash)
    if (fromHash) {
      setShared(fromHash)
      history.replaceState(null, '', location.pathname + location.search)
    }
  }, [])

  const current = openId ? data.profiles.find((p) => p.id === openId) : undefined

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-base font-bold">🍁 {t('common.appTitle')}</h1>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {current ? (
          <ProfilePage
            key={current.id}
            stored={current}
            initialSelection={pendingSelection}
            onChange={(fn) => updateProfile(current.id, fn)}
            onBack={() => {
              setOpenId(null)
              setPendingSelection(null)
            }}
          />
        ) : (
          <div className="space-y-6">
            <ProfileList
              profiles={data.profiles}
              onOpen={(id) => openProfile(id)}
              onAdd={addProfile}
              onRemove={removeProfile}
            />
            <HomeOverview profiles={data.profiles} onOpen={openProfile} />
          </div>
        )}
      </main>

      <footer className="text-muted-foreground mx-auto max-w-6xl px-4 pb-24 pt-8 text-xs lg:pb-8">
        {t('common.footer')}
      </footer>

      <Dialog open={shared !== null} onOpenChange={(open) => !open && setShared(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('shareDialog.title')}</DialogTitle>
            <DialogDescription>
              {shared &&
                t('shareDialog.description', {
                  name: shared.name,
                  score: calculateCrs(shared.profile, todayIso()).total,
                })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShared(null)}>
              {t('shareDialog.ignore')}
            </Button>
            <Button
              onClick={() => {
                if (!shared) return
                const copy = {
                  ...shared,
                  id: newId(),
                  name: `${shared.name}${t('shareDialog.importedSuffix')}`,
                }
                addProfile(copy)
                setShared(null)
                openProfile(copy.id)
              }}
            >
              {t('shareDialog.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
