import { THRESHOLDS as T, type AnalysisSettings } from '@/features/analysis';
import { fmt0, pct } from '@/shared/lib/format';

export type MethodTopic =
  | 'decision' | 'kpi' | 'compare' | 'compareEffects' | 'pareto' | 'abcMix' | 'matrix' | 'exceptions'
  | 'velocity' | 'dos' | 'oos' | 'trend' | 'scatter' | 'actionBar' | 'skuTable' | 'editor';

export interface MethodContext {
  settings: AnalysisSettings;
  total: number;
  visible: number;
  categories: readonly string[];
}

export interface MethodNote {
  title: string;
  items: { label: string; text: string }[];
}

const scope = (c: MethodContext) => {
  if (!c.categories.length) return `${fmt0(c.visible)} SKU, tổng tất cả ngành hàng`;
  if (c.categories.length === 1) return `${fmt0(c.visible)} SKU ngành ${c.categories[0]} (lọc ngành đang bật)`;
  return `${fmt0(c.visible)} SKU thuộc ${fmt0(c.categories.length)} ngành hàng đã chọn`;
};

export function velocityRule(s: AnalysisSettings) {
  if (s.basis === 'index') {
    const I = T.velocityIndex;
    return `Theo ADS Index: ≥ ${pct(I.fast, 0)} Fast, ≥ ${pct(I.normal, 0)} Normal, ≥ ${pct(I.slow, 0)} Slow, thấp hơn là Very Slow.`;
  }
  const A = T.velocityAds;
  return `Theo ADS (sp/ngày): ≥ ${A.fast} Fast, ≥ ${A.normal} Normal, > ${A.slowAbove} Slow, còn lại Very Slow.`;
}

export const dosRule = () => {
  const D = T.dos;
  return `≤ ${D.criticalLow} Critical Low, ≤ ${D.low} Low, ≤ ${D.healthy} Healthy, ≤ ${D.high} High, ≤ ${D.excess} Excess, > ${D.excess} Overstock. ADS = 0 mà còn tồn: Overstock. Không bán, không tồn: N/A.`;
};

export const oosRule = () =>
  `≤ ${pct(T.oos.healthy, 0)} Healthy, ≤ ${pct(T.oos.warning, 0)} Warning, ≤ ${pct(T.oos.critical, 0)} Critical, > ${pct(T.oos.critical, 0)} Severe OOS.`;

export const trendRule = () => {
  const G = T.growth;
  return `> ${pct(G.strong, 0)} Strong Growth, ≥ ${pct(G.growth, 0)} Growth, > ${pct(G.stableLow, 0)} Stable, ≥ ${pct(G.decline, 0)} Decline, thấp hơn là Sharp Decline. Không có số bán kỳ trước: N/A.`;
};

export const coreRule = () =>
  `Class A, ADS ≥ ${T.core.minAds}, ADS Index ≥ ${pct(T.core.minAdsIndex, 0)}, OOS ≤ ${pct(T.core.maxOosRate, 0)}, không phải EOL.`;

export const abcRule = (s: AnalysisSettings, total: number) =>
  `Xếp ${fmt0(total)} SKU giảm dần theo Sales (doanh thu bán thực tế) trong từng ngành hàng. SKU vào A khi tích luỹ trước nó < ${pct(s.cutA, 0)}, vào B khi < ${pct(s.cutB, 0)}, còn lại C.`;

export const compareRule = () =>
  'Doanh thu kỳ trước lấy từ cột revenue_prev. Thiếu cột này thì ước tính = số lượng kỳ trước x giá bình quân kỳ này. Phần do số lượng = (SL kỳ này - SL kỳ trước) x giá bình quân kỳ trước. Phần do giá = chênh lệch doanh thu - phần do số lượng. Doanh thu ước tính thì phần do giá = 0.';

export function methodNote(topic: MethodTopic, c: MethodContext): MethodNote {
  const s = c.settings;
  const period = `${s.periodDays} ngày (SKU có cột days thì dùng số ngày riêng)`;
  switch (topic) {
    case 'decision':
      return {
        title: 'Thẻ quyết định',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: 'Nhóm Action', text: 'Đếm số SKU theo nhóm Action. Mỗi SKU đi qua bảng Rule theo thứ tự, Rule đầu tiên khớp quyết định Action.' },
          { label: 'Câu kết luận', text: 'Số SKU Tăng PO so với số SKU Giảm PO + Stop PO / Xả hàng.' },
          { label: 'Core SKU', text: `${coreRule()} Tỷ trọng doanh thu tính trên SKU đang xem.` }
        ]
      };
    case 'kpi':
      return {
        title: 'Chỉ số tổng quan',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: 'Doanh thu', text: 'Tổng cột revenue. % so kỳ trước = (doanh thu - doanh thu kỳ trước) / doanh thu kỳ trước.' },
          { label: 'SKU class A', text: abcRule(s, c.total) },
          { label: 'Core SKU', text: coreRule() },
          { label: 'Dư tồn', text: `SKU có DOS > ${T.dos.high} (Excess + Overstock). Số sp = tổng tồn của các SKU đó.` },
          { label: 'OOS trung bình', text: 'Trung bình OOS Rate của các SKU, OOS Rate = số ngày hết hàng / số ngày của kỳ.' }
        ]
      };
    case 'compare':
      return {
        title: 'So với kỳ trước',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: 'Số lượng', text: 'Tổng units (kỳ này) so với tổng units_prev (kỳ trước).' },
          { label: 'Doanh thu', text: compareRule() },
          { label: 'Theo ngành', text: 'Cùng công thức, cộng theo từng ngành. Xếp ngành giảm doanh thu nhiều nhất lên đầu.' }
        ]
      };
    case 'compareEffects':
      return {
        title: 'Do số lượng và do giá',
        items: [
          { label: 'Do số lượng', text: 'Doanh thu đổi vì bán nhiều hay ít hơn, giả sử giá giữ như kỳ trước: (SL kỳ này - SL kỳ trước) x giá bình quân kỳ trước.' },
          { label: 'Do giá', text: 'Phần còn lại = chênh lệch doanh thu - phần do số lượng. Cộng nhiều SKU thì phần này gồm cả cơ cấu SKU.' },
          { label: 'Ví dụ', text: 'Kỳ trước 100 sp x 10.000đ = 1.000.000đ, kỳ này 80 sp x 11.000đ = 880.000đ. Chênh -120.000đ = do số lượng -200.000đ + do giá +80.000đ.' },
          { label: 'Ước tính', text: 'SKU thiếu revenue_prev: doanh thu kỳ trước = SL kỳ trước x giá kỳ này, nên phần do giá = 0.' }
        ]
      };
    case 'pareto':
      return {
        title: 'Pareto đóng góp',
        items: [
          { label: 'Class ABC', text: abcRule(s, c.total) },
          { label: 'Đường tích luỹ', text: `Vẽ ${scope(c)}, tích luỹ tính lại trong tập đang xem nên cột cuối luôn 100%. Màu cột giữ class ABC đã tính theo Sales của ngành hàng.` }
        ]
      };
    case 'abcMix':
      return {
        title: 'Cơ cấu ABC',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: '% số SKU', text: 'Số SKU mỗi class / tổng SKU đang xem.' },
          { label: '% đóng góp', text: 'Tổng Sales mỗi class / tổng Sales của ngành hàng đang xem.' },
          { label: 'Class ABC', text: abcRule(s, c.total) }
        ]
      };
    case 'matrix':
      return {
        title: 'Ma trận ABC x Tốc độ bán',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: 'Hàng', text: abcRule(s, c.total) },
          { label: 'Cột', text: velocityRule(s) },
          { label: 'Ô viền', text: `A-Fast là vùng ứng viên Core. Core SKU: ${coreRule()}` }
        ]
      };
    case 'exceptions':
      return {
        title: 'Ngoại lệ ABC',
        items: [
          { label: 'New Product', text: 'Lifecycle = New, hoặc kỳ trước không bán mà kỳ này có bán. Cần thời gian test trước khi xếp ABC.' },
          { label: 'Seasonal', text: 'Cột seasonal = Y, cần đánh giá theo mùa vụ.' },
          { label: 'Strategic / Traffic / Promotion', text: 'Cần gắn cờ riêng trong dữ liệu. Không giảm hoặc delist chỉ dựa trên class ABC khi thuộc các nhóm này.' },
          { label: 'Nguyên tắc', text: 'C liên tục nhiều kỳ là tín hiệu review delist sau khi loại trừ ngoại lệ, không phải lệnh delist tự động.' }
        ]
      };
    case 'velocity':
      return {
        title: 'Tốc độ bán',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: 'ADS', text: `Units / Selling Days. Selling Days = kỳ ${period} - số ngày OOS.` },
          { label: 'ADS Index', text: 'ADS của SKU / ADS trung bình ngành hàng của SKU.' },
          { label: 'Phân loại', text: velocityRule(s) }
        ]
      };
    case 'dos':
      return {
        title: 'Tình trạng tồn kho (DOS)',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: 'DOS', text: 'Tồn hiện tại / ADS = số ngày bán hết tồn nếu bán như hiện tại.' },
          { label: 'Phân loại', text: dosRule() }
        ]
      };
    case 'oos':
      return {
        title: 'OOS Rate',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: 'OOS Rate', text: `Số ngày hết hàng / kỳ ${period}.` },
          { label: 'Phân loại', text: oosRule() }
        ]
      };
    case 'trend':
      return {
        title: 'Xu hướng bán hàng',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: 'Growth', text: `(Units kỳ này - units kỳ trước) / units kỳ trước. SKU Severe OOS (> ${pct(T.oos.critical, 0)}) dùng nhu cầu dự kiến = ADS x số ngày của kỳ thay cho units kỳ này.` },
          { label: 'Phân loại', text: trendRule() }
        ]
      };
    case 'scatter':
      return {
        title: 'Tồn kho so với tăng trưởng',
        items: [
          { label: 'Dữ liệu', text: `${scope(c)}. SKU không có DOS hoặc Growth không vẽ.` },
          { label: 'Trục', text: 'Ngang: DOS, kẹp tối đa 120 ngày. Dọc: Growth, kẹp -100% đến 200%. Giá trị vượt kẹp nằm ở mép.' },
          { label: 'Vạch đứt', text: `Ngưỡng DOS ${T.dos.low} / ${T.dos.healthy} / ${T.dos.high} / ${T.dos.excess} ngày.` },
          { label: 'Màu', text: 'Class ABC.' }
        ]
      };
    case 'actionBar':
      return {
        title: 'Phân bổ Action',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: 'Cách xếp nhóm', text: 'Thứ tự xét: EOL → New SKU → Seasonal → Severe OOS → DOS kết hợp ABC, tốc độ bán, xu hướng. Rule đầu tiên khớp quyết định. Bảng đủ các nhánh ở mục Quy tắc.' }
        ]
      };
    case 'skuTable':
      return {
        title: 'Chi tiết SKU',
        items: [
          { label: 'Dữ liệu', text: scope(c) },
          { label: 'Lý do', text: 'Dòng chữ dưới Action là số liệu đã làm Rule khớp.' },
          { label: 'Từng bước', text: 'Bấm mã SKU để xem ADS, DOS, OOS, Growth, ABC, Core và Rule nào quyết định Action.' }
        ]
      };
    case 'editor':
      return {
        title: 'Sửa dữ liệu đầu vào',
        items: [
          { label: 'Tính lại', text: 'Sửa 1 ô thì toàn bộ phân tích chạy lại: ABC xếp lại trên toàn bộ SKU, ADS trung bình ngành đổi theo, nên SKU khác cũng có thể đổi Action.' },
          { label: 'So sánh', text: 'Dải phía trên so số SKU mỗi nhóm Action với kết quả từ file gốc, cùng thiết lập hiện tại.' }
        ]
      };
  }
}
