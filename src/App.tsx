import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ArrowLeft, Moon, Sun } from 'lucide-react'
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

const THEME_KEY = 'ee-crs-theme'

export default function App() {
  const { t } = useTranslation()
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#131c30' : '#fafbfc')
  }, [dark])
  const { data, addProfile, updateProfile, removeProfile } = useAppData()
  const [openId, setOpenId] = useState<string | null>(null)
  const [pendingSelection, setPendingSelection] = useState<ProjectionSelection | null>(null)
  const [shared, setShared] = useState<StoredProfile | null>(null)

  const openProfile = (id: string, selection?: ProjectionSelection) => {
    setPendingSelection(selection ?? null)
    setOpenId(id)
  }

  const goHome = () => {
    setOpenId(null)
    setPendingSelection(null)
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
      <header className="bg-background sticky top-0 z-[60] border-b pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-base font-bold">
              <button type="button" className="flex cursor-pointer items-center" onClick={goHome}>
                <span
                  className={`overflow-hidden transition-all duration-300 sm:hidden ${
                    current ? 'mr-1.5 w-5 opacity-100' : 'mr-0 w-0 opacity-0'
                  }`}
                >
                  <ArrowLeft className="size-4" />
                </span>
                🍁 {t('common.appTitle')}
              </button>
            </h1>
            {current && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground animate-in fade-in-0 hidden sm:flex"
                onClick={goHome}
              >
                <ArrowLeft className="size-4" />
                {t('page.back')}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('common.toggleTheme')}
              className="text-muted-foreground"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span className="hidden sm:inline">
                {dark ? t('common.themeLight') : t('common.themeDark')}
              </span>
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {current ? (
          <ProfilePage
            key={current.id}
            stored={current}
            initialSelection={pendingSelection}
            onChange={(fn) => updateProfile(current.id, fn)}
            onRemove={() => {
              removeProfile(current.id)
              goHome()
            }}
          />
        ) : (
          <div className="space-y-6">
            <ProfileList
              profiles={data.profiles}
              onOpen={(id) => openProfile(id)}
              onAdd={addProfile}
            />
            <HomeOverview profiles={data.profiles} onOpen={openProfile} />
          </div>
        )}
      </main>

      <footer
        className={`text-muted-foreground mx-auto max-w-6xl px-4 pb-8 pt-8 text-xs ${
          current ? 'hidden lg:block' : ''
        }`}
      >
        {t('common.footer')}{' '}
        <Trans
          i18nKey="common.sourceLink"
          components={[
            <a
              key="gh"
              href="https://github.com/muhac/ee-crs-planner"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            />,
          ]}
        />
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
