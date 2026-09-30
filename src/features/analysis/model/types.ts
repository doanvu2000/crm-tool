import type { ActionRuleId } from './actionRules';

export const ABC_CLASSES = ['A', 'B', 'C'] as const;
export const VELOCITY_LEVELS = ['Fast', 'Normal', 'Slow', 'Very Slow'] as const;
export const DOS_LEVELS = ['Critical Low', 'Low', 'Healthy', 'High', 'Excess', 'Overstock'] as const;
export const OOS_LEVELS = ['Healthy', 'Warning', 'Critical', 'Severe OOS'] as const;
export const TREND_LEVELS = ['Strong Growth', 'Growth', 'Stable', 'Decline', 'Sharp Decline'] as const;
export const ACTION_GROUPS = ['Tăng PO', 'Duy trì', 'Giảm PO', 'Stop PO / Xả hàng', 'Review'] as const;
export const LIFECYCLES = ['New', 'Active', 'EOL'] as const;

export type AbcClass = (typeof ABC_CLASSES)[number];
export type Velocity = (typeof VELOCITY_LEVELS)[number];
export type DosStatus = (typeof DOS_LEVELS)[number] | 'N/A';
export type OosStatus = (typeof OOS_LEVELS)[number];
export type Trend = (typeof TREND_LEVELS)[number] | 'N/A';
export type ActionGroup = (typeof ACTION_GROUPS)[number];
export type Lifecycle = (typeof LIFECYCLES)[number];

export type VelocityBasis = 'ads' | 'index';

/** 1 dòng dữ liệu đầu vào = 1 SKU trong 1 kỳ. */
export interface SkuInput {
  sku: string;
  name: string;
  category: string;
  subcat1?: string;
  subcat2?: string;
  revenue: number;
  revenuePrev: number;
  gp: number;
  units: number;
  unitsPrev: number;
  oosDays: number;
  stock: number;
  lifecycle: Lifecycle;
  seasonal: boolean;
  /** 0 = dùng kỳ chung trong settings. */
  days: number;
}

export interface AnalysisSettings {
  basis: VelocityBasis;
  periodDays: number;
  /** Ngưỡng tích luỹ, dạng 0..1. */
  cutA: number;
  cutB: number;
}

export interface BaseMetrics {
  days: number;
  sellingDays: number;
  ads: number;
  oosRate: number;
  expectedDemand: number;
  growth: number | null;
  prevRevenue: number;
  prevRevenueEstimated: boolean;
  unitsDelta: number;
  unitsChange: number | null;
  revenueDelta: number;
  revenueGrowth: number | null;
  volumeEffect: number;
  priceEffect: number;
  /** Infinity = còn tồn nhưng không bán; null = không bán, không tồn. */
  dos: number | null;
}

export interface AbcAssignment {
  share: number;
  cumShare: number;
  rank: number;
  abc: AbcClass;
}

export interface Classification {
  adsIndex: number;
  velocity: Velocity;
  dosStatus: DosStatus;
  oosStatus: OosStatus;
  trend: Trend;
  isNew: boolean;
  isCore: boolean;
}

export interface ActionDecision {
  rule: ActionRuleId;
  group: ActionGroup;
  action: string;
  /** Điều kiện số liệu đã kích hoạt Rule, để truy xuất ngược. */
  reasons: string[];
}

export type SkuContext = SkuInput & BaseMetrics & AbcAssignment & Classification;
export type SkuResult = SkuContext & ActionDecision;
