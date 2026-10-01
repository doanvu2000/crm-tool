export interface MonthlySaleInput {
  /** Tháng chuẩn hoá dạng YYYY-MM. */
  month: string;
  store: string;
  sku: string;
  revenue: number;
  units: number;
}
