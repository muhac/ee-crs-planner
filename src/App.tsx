import { useEffect, useState } from 'react'
import type { StoredProfile } from '@/storage/schema'
import { parseShareHash } from '@/storage/share'
import { useAppData } from '@/hooks/useAppData'
import { calculateCrs } from '@/engine/crs'
import { todayIso } from '@/engine/dates'
import { newId } from '@/lib/profile'
import { ProfileList } from '@/components/ProfileList'
import { ProfilePage } from '@/components/ProfilePage'
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
  const { data, addProfile, updateProfile, removeProfile } = useAppData()
  const [openId, setOpenId] = useState<string | null>(null)
  const [shared, setShared] = useState<StoredProfile | null>(null)

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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-base font-bold">🍁 EE CRS 计算器</h1>
          <span className="text-muted-foreground text-xs">数据仅保存在本机浏览器</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {current ? (
          <ProfilePage
            stored={current}
            onChange={(fn) => updateProfile(current.id, fn)}
            onBack={() => setOpenId(null)}
          />
        ) : (
          <ProfileList
            profiles={data.profiles}
            onOpen={setOpenId}
            onAdd={addProfile}
            onRemove={removeProfile}
          />
        )}
      </main>

      <footer className="text-muted-foreground mx-auto max-w-6xl px-4 pb-24 pt-8 text-xs lg:pb-8">
        非官方工具,分数按 IRCC 官方 CRS 标准(2026-06 版,不含 job offer 加分)计算,仅供参考。
      </footer>

      <Dialog open={shared !== null} onOpenChange={(open) => !open && setShared(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>导入分享的档案</DialogTitle>
            <DialogDescription>
              {shared &&
                `「${shared.name}」当前 CRS 分数 ${calculateCrs(shared.profile, todayIso()).total},保存到本地后可继续编辑和推演。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShared(null)}>
              忽略
            </Button>
            <Button
              onClick={() => {
                if (!shared) return
                const copy = { ...shared, id: newId(), name: `${shared.name}(导入)` }
                addProfile(copy)
                setShared(null)
                setOpenId(copy.id)
              }}
            >
              保存到本地
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
