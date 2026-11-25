# QA bản dịch Hàn → Việt · 한→베 번역 QA 트래커

Bảng theo dõi lỗi QA bản dịch dùng hằng ngày.

## Cách dùng
1. Mở `index.html` bằng Chrome (không cần cài gì).
2. **+ Thêm lỗi**: điền màn hình, mã chuỗi, câu Hàn gốc, bản Việt đang lỗi, bản Việt sửa thành, loại lỗi, ghi chú.
   - **Lưu và thêm tiếp** (hoặc Ctrl+Enter): lưu rồi mở form trống, giữ nguyên tên màn hình và loại lỗi để ghi nhiều lỗi liên tục.
3. Theo trạng thái: **Mới → Đã sửa trên admin → Đã kiểm tra trên app**.
   - Sau khi đánh dấu đã sửa trên admin, web nhắc giờ kiểm tra lại (sau 15 phút). Đến giờ, lỗi hiện ở tab **Cần kiểm tra lại**.
4. Lọc theo trạng thái / loại lỗi, tìm theo chữ.
5. **Chép tóm tắt hôm nay (tiếng Hàn)** để dán vào báo cáo ngày.

## Sao lưu
Dữ liệu nằm trong trình duyệt (localStorage). Thỉnh thoảng vào **Sao lưu → Xuất file JSON** và cất vào Google Drive.
**Xuất CSV** để mở bằng Excel hoặc Google Sheets.

## Các file
| File | Nội dung |
|---|---|
| `index.html` | Khung trang |
| `styles.css` | Giao diện (màu Trời xanh, sáng/tối, điện thoại) |
| `i18n.js` | Chữ giao diện [tiếng Việt, tiếng Hàn], danh sách loại lỗi |
| `app.js` | Logic |
