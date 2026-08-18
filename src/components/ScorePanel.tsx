import type { ScoreBreakdown } from '@/engine/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function Row({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  )
}

function Section({
  title,
  subtotal,
  children,
}: {
  title: string
  subtotal: number
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="tabular-nums text-sm font-semibold">{subtotal}</span>
      </div>
      <div className="space-y-1 pl-3">{children}</div>
    </div>
  )
}

export function ScorePanel({ score }: { score: ScoreBreakdown }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-baseline justify-between">
          <span>CRS 总分</span>
          <span className="text-3xl tabular-nums">{score.total}</span>
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          按{score.withSpouse ? '有' : '无'}随行配偶打分 · 当前年龄 {score.age} 岁
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Section title="核心人力资本" subtotal={score.core.subtotal}>
          <Row label="年龄" value={score.core.age} muted />
          <Row label="教育" value={score.core.education} muted />
          <Row label="第一语言" value={score.core.firstLanguage} muted />
          {score.core.secondLanguage > 0 && (
            <Row label="第二语言" value={score.core.secondLanguage} muted />
          )}
          <Row label="加拿大工作经验" value={score.core.canadianWork} muted />
        </Section>

        {score.withSpouse && (
          <>
            <Separator />
            <Section title="配偶因素" subtotal={score.spouse.subtotal}>
              <Row label="教育" value={score.spouse.education} muted />
              <Row label="语言" value={score.spouse.language} muted />
              <Row label="加拿大工作经验" value={score.spouse.canadianWork} muted />
            </Section>
          </>
        )}

        <Separator />
        <Section title="技能迁移性(上限 100)" subtotal={score.transferability.subtotal}>
          <Row label="教育 × 语言" value={score.transferability.educationLanguage} muted />
          <Row label="教育 × 加国经验" value={score.transferability.educationCanadianWork} muted />
          <Row label="海外经验 × 语言" value={score.transferability.foreignWorkLanguage} muted />
          <Row label="海外经验 × 加国经验" value={score.transferability.foreignWorkCanadianWork} muted />
          {score.transferability.certificate > 0 && (
            <Row label="技工证书 × 语言" value={score.transferability.certificate} muted />
          )}
        </Section>

        <Separator />
        <Section title="附加分(上限 600)" subtotal={score.additional.subtotal}>
          {score.additional.provincialNomination > 0 && (
            <Row label="省提名" value={score.additional.provincialNomination} muted />
          )}
          {score.additional.french > 0 && <Row label="法语加分" value={score.additional.french} muted />}
          {score.additional.canadianEducation > 0 && (
            <Row label="加拿大学历" value={score.additional.canadianEducation} muted />
          )}
          {score.additional.sibling > 0 && <Row label="兄弟姐妹在加" value={score.additional.sibling} muted />}
          {score.additional.subtotal === 0 && (
            <p className="text-muted-foreground text-xs">暂无附加分</p>
          )}
        </Section>
      </CardContent>
    </Card>
  )
}
