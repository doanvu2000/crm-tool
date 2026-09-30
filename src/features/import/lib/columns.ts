import type { SkuInput } from '@/features/analysis';

export interface ColumnSpec {
  key: keyof SkuInput;
  label: string;
  required?: boolean;
  /** So khớp sau normalizeKey (không dấu, không khoảng trắng). Phần tử đầu là tên chuẩn trong file mẫu. */
  aliases: string[];
}

export const COLUMNS: ColumnSpec[] = [
  { key: 'sku', label: 'SKU', required: true, aliases: ['sku', 'masku', 'ma', 'mahang', 'masp', 'itemcode', 'code'] },
  { key: 'name', label: 'Tên sản phẩm', aliases: ['name', 'ten', 'tensanpham', 'tensp', 'tenhang', 'productname', 'product'] },
  { key: 'category', label: 'Ngành hàng', aliases: ['category', 'nganh', 'nganhhang', 'danhmuc', 'cat'] },
  { key: 'subcat1', label: 'Subcat 1 (ngành hàng con)', aliases: ['subcat1', 'subcategory1', 'sub1', 'nganhhangcon1', 'nganhhangconcap1', 'danhmuccon1', 'danhmucconcap1'] },
  { key: 'subcat2', label: 'Subcat 2 (ngành hàng con cấp 2)', aliases: ['subcat2', 'subcategory2', 'sub2', 'nganhhangcon2', 'nganhhangconcap2', 'danhmuccon2', 'danhmucconcap2'] },
  { key: 'revenue', label: 'Doanh thu kỳ hiện tại', required: true, aliases: ['revenue', 'doanhthu', 'sales', 'doanhso'] },
  { key: 'revenuePrev', label: 'Doanh thu kỳ trước (thiếu thì ước tính theo giá kỳ này)', aliases: ['revenueprev', 'prevrevenue', 'revenueprevious', 'doanhthukytruoc', 'dtkytruoc', 'doanhthucungky', 'salesprev', 'prevsales'] },
  { key: 'gp', label: 'Lợi nhuận gộp', aliases: ['gp', 'grossprofit', 'loinhuangop', 'lngop', 'laigop'] },
  { key: 'units', label: 'Số lượng bán kỳ hiện tại', required: true, aliases: ['units', 'unitssold', 'soluong', 'soluongban', 'sl', 'qty', 'current30d', 'units30d'] },
  { key: 'unitsPrev', label: 'Số lượng bán kỳ trước', required: true, aliases: ['unitsprev', 'previous30d', 'prev30d', 'soluongkytruoc', 'kytruoc', 'slkytruoc', 'cungky', 'soluongcungky'] },
  { key: 'oosDays', label: 'Số ngày hết hàng', aliases: ['oosdays', 'oos', 'ngayoos', 'songayhethang', 'ngayhethang'] },
  { key: 'stock', label: 'Tồn kho hiện tại', required: true, aliases: ['stock', 'currentstock', 'tonkho', 'ton', 'tonhientai'] },
  { key: 'lifecycle', label: 'Lifecycle: New / Active / EOL', aliases: ['lifecycle', 'vongdoi', 'trangthai', 'status'] },
  { key: 'seasonal', label: 'Hàng mùa vụ: Y / N', aliases: ['seasonal', 'muavu', 'theomua', 'season'] },
  { key: 'days', label: 'Số ngày của kỳ (nếu khác kỳ chung)', aliases: ['days', 'totaldays', 'songay', 'kyngay'] }
];

export const TEMPLATE_HEADER = ['sku', 'name', 'category', 'subcat1', 'subcat2', 'revenue', 'revenue_prev', 'gp', 'units', 'units_prev', 'oos_days', 'stock', 'lifecycle', 'seasonal'];
