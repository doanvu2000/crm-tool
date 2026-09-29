import { fmt0, fmt1, pct } from '@/shared/lib/format';
import { THRESHOLDS as T } from '../model/thresholds';
import type { ActionDecision, ActionGroup, SkuContext } from '../model/types';

/**
 * Rule engine cho Action. Thứ tự rule là ưu tiên: rule đầu tiên khớp quyết định.
 * EOL → New → Seasonal → Severe OOS → DOS kết hợp ABC, tốc độ bán, xu hướng.
 * Mỗi nhánh phải trả về reasons để Action truy xuất được về số liệu.
 */
export function decideAction(r: SkuContext): ActionDecision {
  const dosText = r.dos === Infinity ? `DOS vô hạn (tồn ${fmt0(r.stock)}, không bán)` : `DOS ${fmt1(r.dos)} ngày`;
  const trendText = r.growth == null ? 'không có kỳ trước' : `Growth ${pct(r.growth)}`;
  const make = (group: ActionGroup, action: string, reasons: string[]): ActionDecision => ({
    group,
    action,
    reasons: r.isCore ? ['Core SKU', ...reasons] : reasons
  });

  if (r.lifecycle === 'EOL') {
    return r.stock > 0
      ? make('Stop PO / Xả hàng', 'Stop PO, clearance tồn còn lại', ['Lifecycle = EOL', `Tồn ${fmt0(r.stock)}`])
      : make('Stop PO / Xả hàng', 'Ngừng PO, đóng mã', ['Lifecycle = EOL', 'Tồn = 0']);
  }

  if (r.isNew) {
    const why = r.lifecycle === 'New' ? 'Lifecycle = New' : 'Không có số bán kỳ trước';
    return r.dos != null && r.dos <= T.newSkuReplenishMaxDos
      ? make('Tăng PO', 'Bổ sung theo test, chưa áp ABC', [why, `${dosText} (≤${T.newSkuReplenishMaxDos})`])
      : make('Review', 'Theo dõi New SKU, chưa kết luận', [why, dosText]);
  }

  if (r.seasonal) return make('Review', 'Review theo mùa vụ trước khi đặt PO', ['Hàng mùa vụ', trendText, dosText]);

  if (r.oosStatus === 'Severe OOS') {
    return make('Tăng PO', 'Tính lại nhu cầu, bổ sung khẩn', [
      `OOS ${pct(r.oosRate)} (>${pct(T.oos.critical, 0)})`,
      `Nhu cầu dự kiến ${fmt0(r.expectedDemand)} sp/kỳ`
    ]);
  }

  switch (r.dosStatus) {
    case 'N/A':
      return make('Review', 'Không bán, không tồn: review mã', ['Số bán = 0', 'Tồn = 0']);

    case 'Critical Low':
      if (r.velocity === 'Very Slow' && r.abc === 'C') {
        return make('Review', 'Thiếu hàng nhưng bán rất chậm: review trước khi PO', [`${dosText} (≤${T.dos.criticalLow})`, 'Very Slow', 'ABC = C']);
      }
      return make('Tăng PO', 'Urgent replenishment', [`${dosText} (≤${T.dos.criticalLow})`, `ABC = ${r.abc}`]);

    case 'Low':
      if (r.trend === 'Sharp Decline') {
        return make('Duy trì', 'Bổ sung vừa đủ, theo dõi suy giảm', [`${dosText} (Low)`, trendText]);
      }
      return make('Tăng PO', 'Ưu tiên PO', [`${dosText} (Low)`, `ABC = ${r.abc}`]);

    case 'Overstock':
      return make('Stop PO / Xả hàng', 'Stop PO, clearance hoặc exit', [`${dosText} (>${T.dos.excess})`, r.velocity]);

    case 'Excess':
      return make('Giảm PO', 'Giảm PO + kích cầu', [`${dosText} (Excess)`, r.velocity]);

    case 'High':
      if (r.trend === 'Decline' || r.trend === 'Sharp Decline' || r.velocity === 'Slow' || r.velocity === 'Very Slow') {
        return make('Giảm PO', 'Giảm PO, kiểm soát tồn', [`${dosText} (High)`, r.velocity, trendText]);
      }
      return make('Duy trì', 'Kiểm soát PO', [`${dosText} (High)`, trendText]);

    case 'Healthy':
      if (r.velocity === 'Very Slow' && r.abc === 'C') return make('Review', 'Review / promotion / exit', ['Very Slow', 'ABC = C', dosText]);
      if (r.trend === 'Strong Growth') return make('Tăng PO', 'Tăng forecast / supply capacity', [trendText, `${dosText} (Healthy)`]);
      if (r.trend === 'Sharp Decline') return make('Giảm PO', 'Giảm PO mạnh, review lifecycle', [trendText]);
      if (r.trend === 'Decline') return make('Giảm PO', 'Giảm forecast / PO', [trendText]);
      if (r.isCore) return make('Duy trì', 'Bảo vệ availability, ưu tiên safety stock', [`${dosText} (Healthy)`, `OOS ${pct(r.oosRate)}`]);
      return make('Duy trì', 'Duy trì', [`${dosText} (Healthy)`, trendText]);
  }
}
