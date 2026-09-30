export type TourPhase = 'intro' | 'data';

export interface TourStep {
  target: string;
  title: string;
  body: string;
  cta?: string;
}

export const TOUR_STEPS: Record<TourPhase, TourStep[]> = {
  intro: [
    {
      target: 'import',
      title: 'Nhập dữ liệu bán hàng',
      body: 'Tải một file CSV hoặc Excel, mỗi dòng là một mã SKU tại một cửa hàng trong một tháng. Dùng file mẫu để chuẩn bị đủ doanh thu, số lượng, lợi nhuận, tồn kho và ngày OOS.'
    },
    {
      target: 'settings',
      title: 'Chọn cách phân tích',
      body: 'ABC luôn xếp theo doanh thu của tháng đã chọn. Chọn ADS tuyệt đối hoặc ADS Index để phân loại tốc độ bán.'
    }
  ],
  data: [
    {
      target: 'decision',
      title: 'Kết luận của kỳ này',
      body: 'Bao nhiêu SKU cần tăng PO, giảm PO hay xả hàng. Bấm 1 nhóm để lọc bảng Chi tiết SKU theo nhóm đó.'
    },
    {
      target: 'category',
      title: 'Lọc theo ngành hàng',
      body: 'Chọn lần lượt Ngành hàng, Subcat 1 và Subcat 2 để thu hẹp dữ liệu. Chart và bảng cập nhật theo phạm vi đã chọn. Bấm một cột trên chart hoặc một ô ma trận để lọc thêm; bộ lọc hiện ở thanh Đang lọc phía trên.'
    },
    {
      target: 'compare',
      title: 'So với kỳ trước',
      body: 'Số lượng bán và doanh thu thay đổi bao nhiêu, phần nào do số lượng, phần nào do giá bán. Có cả ngành và SKU giảm doanh thu nhiều nhất.'
    },
    {
      target: 'input',
      title: 'Xem và sửa dữ liệu đầu vào',
      body: 'Sửa số ngay trong bảng, Action của SKU tính lại tức thì. Ô đã sửa được đánh dấu, khôi phục được và tải lại thành CSV.'
    },
    {
      target: 'nav',
      title: 'Mục lục',
      body: 'Nhảy nhanh tới từng phần của báo cáo. Mục đang đọc được đánh dấu.'
    },
    {
      target: 'help',
      title: 'Xem lại hướng dẫn',
      body: 'Bấm nút này bất cứ lúc nào để xem lại các bước.'
    }
  ]
};
