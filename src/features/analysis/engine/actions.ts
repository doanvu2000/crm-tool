import { fmt0, fmt1, pct } from '@/shared/lib/format';
import { ACTION_RULE_BY_ID, type ActionRuleId } from '../model/actionRules';
import { THRESHOLDS as T } from '../model/thresholds';
import type { ActionDecision, SkuContext } from '../model/types';

/**
 * Rule engine cho Action. Thứ tự rule là ưu tiên: rule đầu tiên khớp quyết định.
 * EOL → New → Seasonal → Severe OOS → DOS kết hợp ABC, tốc độ bán, xu hướng.
 * Mỗi nhánh phải trả về reasons để Action truy xuất được về số liệu.
 */
export function decideAction(r: SkuContext): ActionDecision {
  const dosText = r.dos === Infinity ? `DOS vô hạn (tồn ${fmt0(r.stock)}, không bán)` : `DOS ${fmt1(r.dos)} ngày`;
  const trendText = r.growth == null ? 'không có kỳ trước' : `Growth ${pct(r.growth)}`;
  const make = (rule: ActionRuleId, reasons: string[]): ActionDecision => {
    const def = ACTION_RULE_BY_ID.get(rule)!;
    return { rule, group: def.group, action: def.action, reasons: r.isCore ? ['Core SKU', ...reasons] : reasons };
  };

  if (r.lifecycle === 'EOL') {
    return r.stock > 0
      ? make('eol-stock', ['Lifecycle = EOL', `Tồn ${fmt0(r.stock)}`])
      : make('eol-empty', ['Lifecycle = EOL', 'Tồn = 0']);
  }

  if (r.isNew) {
    const why = r.lifecycle === 'New' ? 'Lifecycle = New' : 'Không có số bán kỳ trước';
    return r.dos != null && r.dos <= T.newSkuReplenishMaxDos
      ? make('new-replenish', [why, `${dosText} (≤${T.newSkuReplenishMaxDos})`])
      : make('new-watch', [why, dosText]);
  }

  if (r.seasonal) return make('seasonal', ['Hàng mùa vụ', trendText, dosText]);

  if (r.oosStatus === 'Severe OOS') {
    return make('severe-oos', [
      `OOS ${pct(r.oosRate)} (>${pct(T.oos.critical, 0)})`,
      `Nhu cầu dự kiến ${fmt0(r.expectedDemand)} sp/kỳ`
    ]);
  }

  switch (r.dosStatus) {
    case 'N/A':
      return make('no-sales', ['Số bán = 0', 'Tồn = 0']);

    case 'Critical Low':
      if (r.velocity === 'Very Slow' && r.abc === 'C') {
        return make('critical-slow-c', [`${dosText} (≤${T.dos.criticalLow})`, 'Very Slow', 'ABC = C']);
      }
      return make('critical', [`${dosText} (≤${T.dos.criticalLow})`, `ABC = ${r.abc}`]);

    case 'Low':
      if (r.trend === 'Sharp Decline') {
        return make('low-sharp', [`${dosText} (Low)`, trendText]);
      }
      return make('low', [`${dosText} (Low)`, `ABC = ${r.abc}`]);

    case 'Overstock':
      return make('overstock', [`${dosText} (>${T.dos.excess})`, r.velocity]);

    case 'Excess':
      return make('excess', [`${dosText} (Excess)`, r.velocity]);

    case 'High':
      if (r.trend === 'Decline' || r.trend === 'Sharp Decline' || r.velocity === 'Slow' || r.velocity === 'Very Slow') {
        return make('high-weak', [`${dosText} (High)`, r.velocity, trendText]);
      }
      return make('high', [`${dosText} (High)`, trendText]);

    case 'Healthy':
      if (r.velocity === 'Very Slow' && r.abc === 'C') return make('healthy-slow-c', ['Very Slow', 'ABC = C', dosText]);
      if (r.trend === 'Strong Growth') return make('healthy-strong', [trendText, `${dosText} (Healthy)`]);
      if (r.trend === 'Sharp Decline') return make('healthy-sharp', [trendText]);
      if (r.trend === 'Decline') return make('healthy-decline', [trendText]);
      if (r.isCore) return make('healthy-core', [`${dosText} (Healthy)`, `OOS ${pct(r.oosRate)}`]);
      return make('healthy', [`${dosText} (Healthy)`, trendText]);
  }
}
