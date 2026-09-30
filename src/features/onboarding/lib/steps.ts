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
      title: 'Nhập file SKU',
      body: 'Kéo thả file CSV hoặc Excel vào khung này, mỗi dòng là 1 SKU. Chưa rõ định dạng thì bấm "Tải file mẫu CSV". File chỉ đọc trên máy bạn, không gửi đi đâu.'
    },
    {
      target: 'settings',
      title: 'Chọn cách phân tích',
      body: 'ABC theo doanh thu, GP hay số lượng bán; kỳ báo cáo và ngưỡng A/B. Đổi ở đây, mọi kết quả tính lại ngay.'
    },
    {
      target: 'sample',
      title: 'Chưa có file? Thử dữ liệu mẫu',
      body: '80 SKU của 4 ngành hàng. Có dữ liệu rồi, hướng dẫn chỉ tiếp các phần của báo cáo.',
      cta: 'Dùng dữ liệu mẫu'
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
      body: 'Chọn 1 ngành, mọi số liệu và chart bên dưới chỉ tính ngành đó. Bấm 1 cột trên chart (vd Strong Growth) hoặc 1 ô ma trận cũng lọc toàn trang; bộ lọc hiện ở thanh Đang lọc phía trên.'
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
