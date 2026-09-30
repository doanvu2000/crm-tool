import type { Lifecycle } from '@/features/analysis';

export interface MonthlySaleInput {
  /** Tháng chuẩn hoá dạng YYYY-MM. */
  month: string;
  store: string;
  sku: string;
  name: string;
  category: string;
  subcat1?: string;
  subcat2?: string;
  revenue: number;
  units: number;
  gp: number;
  /** Tồn cuối tháng tại từng cửa hàng. */
  stock: number;
  oosDays: number;
  lifecycle: Lifecycle;
  seasonal: boolean;
}
