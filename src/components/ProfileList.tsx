import { useRef } from 'react'
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
  const fileInput = useRef<HTMLInputElement>(null)
  const today = todayIso()

  const importJson = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isShareEnvelope(parsed)) throw new Error('bad format')
      onAdd({ ...parsed.profile, id: newId() })
    } catch {
      alert('导入失败:不是有效的档案 JSON 文件')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">我的档案</h2>
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
            导入 JSON
          </Button>
          <Button
            onClick={() => {
              const p = newStoredProfile(`档案 ${profiles.length + 1}`)
              onAdd(p)
              onOpen(p.id)
            }}
          >
            + 新建档案
          </Button>
        </div>
      </div>

      {profiles.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            还没有档案。点击「新建档案」输入你的信息,即可计算 CRS 分数并推演未来变化。
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
                    更新于 {p.updatedAt} · {score.withSpouse ? '有' : '无'}随行配偶
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
                      if (confirm(`删除档案「${p.name}」?此操作不可撤销。`)) onRemove(p.id)
                    }}
                  >
                    删除
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
