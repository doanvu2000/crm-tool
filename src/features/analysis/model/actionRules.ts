import { THRESHOLDS as T } from './thresholds';
import type { ActionGroup } from './types';

export interface ActionRule {
  id: string;
  stage: string;
  when: string;
  group: ActionGroup;
  action: string;
}

const D = T.dos;
const pctText = (v: number) => `${Math.round(v * 100)}%`;

export const ACTION_RULES = [
  { id: 'eol-stock', stage: 'Lifecycle', when: 'Lifecycle = EOL, còn tồn', group: 'Stop PO / Xả hàng', action: 'Stop PO, clearance tồn còn lại' },
  { id: 'eol-empty', stage: 'Lifecycle', when: 'Lifecycle = EOL, tồn = 0', group: 'Stop PO / Xả hàng', action: 'Ngừng PO, đóng mã' },
  { id: 'new-replenish', stage: 'New SKU', when: `New SKU (Lifecycle = New hoặc kỳ trước không bán) và DOS ≤ ${T.newSkuReplenishMaxDos}`, group: 'Tăng PO', action: 'Bổ sung theo test, chưa áp ABC' },
  { id: 'new-watch', stage: 'New SKU', when: `New SKU và DOS > ${T.newSkuReplenishMaxDos}`, group: 'Review', action: 'Theo dõi New SKU, chưa kết luận' },
  { id: 'seasonal', stage: 'Seasonal', when: 'Hàng mùa vụ', group: 'Review', action: 'Review theo mùa vụ trước khi đặt PO' },
  { id: 'severe-oos', stage: 'Severe OOS', when: `OOS > ${pctText(T.oos.critical)}`, group: 'Tăng PO', action: 'Tính lại nhu cầu, bổ sung khẩn' },
  { id: 'no-sales', stage: 'DOS N/A', when: 'Không bán, không tồn', group: 'Review', action: 'Không bán, không tồn: review mã' },
  { id: 'critical-slow-c', stage: 'DOS Critical Low', when: `DOS ≤ ${D.criticalLow}, Very Slow, ABC = C`, group: 'Review', action: 'Thiếu hàng nhưng bán rất chậm: review trước khi PO' },
  { id: 'critical', stage: 'DOS Critical Low', when: `DOS ≤ ${D.criticalLow}`, group: 'Tăng PO', action: 'Urgent replenishment' },
  { id: 'low-sharp', stage: 'DOS Low', when: `DOS ${D.criticalLow} đến ${D.low}, Sharp Decline`, group: 'Duy trì', action: 'Bổ sung vừa đủ, theo dõi suy giảm' },
  { id: 'low', stage: 'DOS Low', when: `DOS ${D.criticalLow} đến ${D.low}`, group: 'Tăng PO', action: 'Ưu tiên PO' },
  { id: 'overstock', stage: 'DOS Overstock', when: `DOS > ${D.excess} hoặc còn tồn mà không bán`, group: 'Stop PO / Xả hàng', action: 'Stop PO, clearance hoặc exit' },
  { id: 'excess', stage: 'DOS Excess', when: `DOS ${D.high} đến ${D.excess}`, group: 'Giảm PO', action: 'Giảm PO + kích cầu' },
  { id: 'high-weak', stage: 'DOS High', when: `DOS ${D.healthy} đến ${D.high}, Decline / Sharp Decline hoặc Slow / Very Slow`, group: 'Giảm PO', action: 'Giảm PO, kiểm soát tồn' },
  { id: 'high', stage: 'DOS High', when: `DOS ${D.healthy} đến ${D.high}`, group: 'Duy trì', action: 'Kiểm soát PO' },
  { id: 'healthy-slow-c', stage: 'DOS Healthy', when: `DOS ${D.low} đến ${D.healthy}, Very Slow, ABC = C`, group: 'Review', action: 'Review / promotion / exit' },
  { id: 'healthy-strong', stage: 'DOS Healthy', when: `DOS ${D.low} đến ${D.healthy}, Strong Growth`, group: 'Tăng PO', action: 'Tăng forecast / supply capacity' },
  { id: 'healthy-sharp', stage: 'DOS Healthy', when: `DOS ${D.low} đến ${D.healthy}, Sharp Decline`, group: 'Giảm PO', action: 'Giảm PO mạnh, review lifecycle' },
  { id: 'healthy-decline', stage: 'DOS Healthy', when: `DOS ${D.low} đến ${D.healthy}, Decline`, group: 'Giảm PO', action: 'Giảm forecast / PO' },
  { id: 'healthy-core', stage: 'DOS Healthy', when: `DOS ${D.low} đến ${D.healthy}, Core SKU`, group: 'Duy trì', action: 'Bảo vệ availability, ưu tiên safety stock' },
  { id: 'healthy', stage: 'DOS Healthy', when: `DOS ${D.low} đến ${D.healthy}, còn lại`, group: 'Duy trì', action: 'Duy trì' }
] as const satisfies readonly ActionRule[];

export type ActionRuleId = (typeof ACTION_RULES)[number]['id'];

export const ACTION_RULE_BY_ID = new Map<ActionRuleId, (typeof ACTION_RULES)[number]>(ACTION_RULES.map((r) => [r.id, r]));
