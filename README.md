# QA Tracker · LIVE Score VN · QA 트래커

Công cụ quản lý issue QA (bản dịch Hàn → Việt, bug, giao diện) theo cách các công cụ quản lý lỗi chuyên nghiệp đang làm:
mã issue, loại issue, quy trình trạng thái, mức ưu tiên / mức độ nghiêm trọng, board, danh sách, dashboard, bình luận và lịch sử.

## Cách dùng
Mở `index.html` bằng Chrome (hoặc link GitHub Pages). Không cần cài gì.

- **+ Tạo issue** (phím tắt **C**): tóm tắt, loại issue, ưu tiên, mức độ, thị trường (VN / Global / KR), loại lỗi, người xử lý,
  nhãn, màn hình, ticket; phần **Bản dịch** (câu Hàn gốc, bản Việt lỗi → bản Việt sửa, mã chuỗi);
  phần **Mô tả lỗi** (mô tả, các bước tái hiện, kết quả thực tế / mong đợi); **Môi trường** (OS, build, thiết bị).
  **Ctrl+Enter** để lưu.
- **Board**: cột theo trạng thái. Kéo thả thẻ sang cột khác để đổi trạng thái.
- **Danh sách**: bảng tất cả issue, bấm tiêu đề cột để sắp xếp.
- **Dashboard**: số liệu tổng, issue đang mở theo ưu tiên / thị trường / loại lỗi, tạo mới và đã đóng 14 ngày,
  tóm tắt tiếng Hàn để dán vào báo cáo ngày. Bấm vào một thanh để xem danh sách issue đó.
- **Trang chi tiết issue**: sửa từng trường (tự lưu), nút chuyển trạng thái nhanh, **Bình luận** và **Lịch sử** thay đổi.
  Link `#VNQA-12` mở thẳng issue đó.
- **Lọc nhanh**: Việc của tôi · Cần kiểm tra lại · Ưu tiên cao · Báo dev ≥ 3 ngày; và lọc theo loại, thị trường, ưu tiên, loại lỗi, người xử lý.

## Quy trình trạng thái
`Cần làm` → `Đã báo dev` → `Đang xử lý` → `Đã sửa · chờ kiểm tra` → `Đã đóng`

- Tự sửa trên admin: `Cần làm` → **Tự sửa trên admin** → web nhắc kiểm tra lại trên app sau 15 phút → **Đã kiểm tra trên app** → `Đã đóng`.
- Nhờ dev: `Cần làm` → **Báo dev** → **Dev đang xử lý** → **Dev đã sửa** → kiểm tra ở bản build mới → `Đã đóng`.

## Sao lưu
Dữ liệu nằm trong trình duyệt (localStorage). **Sao lưu & cài đặt → Xuất file JSON** định kỳ.
**Xuất CSV** để mở bằng Excel / Google Sheets. Trong cài đặt có thể đổi **mã dự án** (mặc định `VNQA`) và **tên của tôi**.

Dữ liệu của bản trước tự được nâng cấp khi mở bản này.

## Các file
| File | Nội dung |
|---|---|
| `index.html` | Khung trang |
| `styles.css` | Giao diện (màu Trời xanh, sáng/tối, điện thoại) |
| `i18n.js` | Chữ giao diện [tiếng Việt, tiếng Hàn], danh sách loại / trạng thái / ưu tiên |
| `app.js` | Logic |
