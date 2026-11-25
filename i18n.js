/* Từ điển giao diện: mỗi mục [tiếng Việt, tiếng Hàn]. Sửa chữ trên giao diện ở đây.
   Thuật ngữ theo chuẩn công cụ quản lý lỗi (issue, board, priority, severity…) để quen với môi trường QA. */
window.S = {
  title: ['QA Tracker · LIVE Score VN', 'QA 트래커 · LIVE스코어 VN'],
  // Chế độ xem
  v_board: ['Board', '보드'], v_list: ['Danh sách', '목록'], v_dash: ['Dashboard', '대시보드'],
  create: ['+ Tạo issue', '이슈 생성'],
  search: ['Tìm issue (mã, tóm tắt, câu Hàn/Việt, ghi chú…)', '이슈 검색 (키, 요약, 원문, 번역, 메모…)'],
  // Bộ lọc
  f_all_type: ['Mọi loại', '모든 유형'], f_all_mk: ['Mọi thị trường', '모든 마켓'], f_all_pri: ['Mọi mức ưu tiên', '모든 우선순위'],
  f_all_as: ['Mọi người xử lý', '모든 담당자'], f_all_cat: ['Mọi loại lỗi', '모든 오류 유형'], f_clear: ['Xóa lọc', '필터 초기화'],
  q_mine: ['Việc của tôi', '내 이슈'], q_due: ['Cần kiểm tra lại', '재확인 필요'], q_high: ['Ưu tiên cao', '높은 우선순위'], q_old: ['Báo dev ≥ 3 ngày', '요청 3일 이상'],
  // Loại issue
  t_bug: ['Bug', '버그'], t_translation: ['Bản dịch', '번역'], t_ui: ['Giao diện', 'UI'], t_task: ['Task', '작업'],
  // Trạng thái (quy trình)
  st_new: ['Cần làm', '할 일'], st_reported: ['Đã báo dev', '개발 요청'], st_waiting: ['Đang xử lý', '진행 중'],
  st_fixed: ['Đã sửa · chờ kiểm tra', '수정 완료 · 확인 대기'], st_checked: ['Đã đóng', '완료'],
  // Ưu tiên, mức độ
  p_highest: ['Highest', '최상'], p_high: ['High', '높음'], p_medium: ['Medium', '보통'], p_low: ['Low', '낮음'], p_lowest: ['Lowest', '최하'],
  sev_S1: ['S1 · Nghiêm trọng', 'S1 · 치명적'], sev_S2: ['S2 · Lớn', 'S2 · 중대'], sev_S3: ['S3 · Nhỏ', 'S3 · 경미'], sev_: ['—', '—'],
  // Thị trường
  mk_VN: ['Việt Nam', '베트남'], mk_Global: ['Global (chung)', '글로벌 공통'], mk_KR: ['Hàn Quốc', '한국'],
  // Loại lỗi (nhãn chính)
  c_overflow: ['Tràn chữ', '글자 넘침'], c_context: ['Sai ngữ cảnh', '맥락 오역'], c_order: ['Trật tự từ', '어순'],
  c_term: ['Thuật ngữ', '용어'], c_spell: ['Chính tả, dấu', '맞춤법·성조'], c_missing: ['Chưa dịch', '미번역'],
  c_unused: ['Không dùng nữa', '미사용'], c_other: ['Khác', '기타'],
  // Trường
  f_summary: ['Tóm tắt', '요약'], f_type: ['Loại issue', '이슈 유형'], f_status: ['Trạng thái', '상태'],
  f_priority: ['Mức ưu tiên', '우선순위'], f_severity: ['Mức độ nghiêm trọng', '심각도'], f_market: ['Thị trường', '마켓'],
  f_cat: ['Loại lỗi', '오류 유형'], f_assignee: ['Người xử lý', '담당자'], f_reporter: ['Người báo', '보고자'],
  f_labels: ['Nhãn (cách nhau bằng dấu phẩy)', '레이블 (쉼표로 구분)'], f_screen: ['Màn hình / thành phần', '화면 / 컴포넌트'],
  f_key: ['Mã chuỗi (strings.xml)', '문자열 키'], f_ticket: ['Ticket liên kết / link', '연결 티켓 / 링크'],
  f_os: ['Hệ điều hành', 'OS'], f_build: ['Bản build', '빌드'], f_device: ['Thiết bị', '기기'],
  f_desc: ['Mô tả', '설명'], f_steps: ['Các bước tái hiện', '재현 절차'], f_actual: ['Kết quả thực tế', '실제 결과'], f_expected: ['Kết quả mong đợi', '기대 결과'],
  f_ko: ['Câu Hàn gốc', '한국어 원문'], f_before: ['Bản Việt hiện tại (lỗi)', '현재 베트남어 (오류)'], f_after: ['Bản Việt sửa thành', '수정 베트남어'],
  f_note: ['Ghi chú', '메모'], f_created: ['Ngày tạo', '생성일'], f_updated: ['Cập nhật', '업데이트'],
  sec_details: ['Chi tiết', '세부 정보'], sec_trans: ['Bản dịch', '번역'], sec_bug: ['Mô tả lỗi', '버그 설명'], sec_env: ['Môi trường', '환경'],
  sec_activity: ['Hoạt động', '활동'], comments: ['Bình luận', '댓글'], history: ['Lịch sử', '기록'],
  addcomment: ['Viết bình luận… (Ctrl+Enter để gửi)', '댓글 작성… (Ctrl+Enter 전송)'], send: ['Gửi', '전송'],
  save: ['Lưu', '저장'], cancel: ['Hủy', '취소'], close: ['Đóng', '닫기'], del: ['Xóa issue', '이슈 삭제'], del2: ['Bấm lần nữa để xóa', '한 번 더 누르면 삭제'],
  undo: ['Hoàn tác', '되돌리기'], copylink: ['Chép mã', '키 복사'], copied: ['Đã chép', '복사됨'],
  need: ['Cần có tóm tắt (hoặc câu Hàn / bản Việt).', '요약(또는 원문·번역)을 입력하세요.'],
  // Nút chuyển trạng thái nhanh
  b_selffix: ['Tự sửa trên admin', '관리자에서 직접 수정'], b_report: ['Báo dev', '개발 요청'], b_waiting: ['Dev đang xử lý', '개발 처리 중'],
  b_devfixed: ['Dev đã sửa', '개발 수정 완료'], b_checked: ['Đã kiểm tra trên app ✓', '앱 확인 완료 ✓'], b_reopen: ['Mở lại', '다시 열기'],
  recheck: ['Kiểm tra lại trên app lúc', '앱 재확인'], recheck_now: ['Đến giờ kiểm tra lại trên app', '지금 앱에서 재확인'],
  by_dev: ['dev sửa · kiểm tra ở bản build mới', '개발 수정 · 새 빌드에서 확인'],
  // Dashboard
  d_open: ['Đang mở', '미해결'], d_total: ['Tổng issue', '전체 이슈'], d_due: ['Cần kiểm tra lại', '재확인 필요'], d_old: ['Báo dev ≥ 3 ngày', '요청 3일 이상'],
  d_bystatus: ['Theo trạng thái', '상태별'], d_bypri: ['Issue đang mở theo ưu tiên', '미해결 우선순위별'], d_bymk: ['Issue đang mở theo thị trường', '미해결 마켓별'],
  d_bycat: ['Issue đang mở theo loại lỗi', '미해결 오류 유형별'], d_trend: ['Tạo mới / đã đóng (14 ngày)', '생성 / 완료 (14일)'], d_created: ['Tạo mới', '생성'], d_closed: ['Đã đóng', '완료'],
  copysum: ['Chép tóm tắt hôm nay (tiếng Hàn)', '오늘 요약 복사'],
  // Sao lưu
  backup: ['Sao lưu & cài đặt', '백업 · 설정'], export: ['Xuất file JSON', 'JSON 내보내기'], import: ['Nhập file JSON', 'JSON 가져오기'],
  csv: ['Xuất CSV (Excel / Google Sheets)', 'CSV 내보내기'], backuph: ['Dữ liệu chỉ nằm trong trình duyệt này. Thỉnh thoảng xuất file JSON cất vào Google Drive.', '데이터는 이 브라우저에만 있습니다. 가끔 JSON으로 내보내 보관하세요.'],
  projkey: ['Mã dự án (đứng trước số issue)', '프로젝트 키'], me: ['Tên của tôi (người xử lý mặc định)', '내 이름 (기본 담당자)'],
  empty: ['Chưa có issue nào. Bấm “+ Tạo issue” để bắt đầu.', '이슈가 없습니다. “이슈 생성”으로 시작하세요.'],
  nomatch: ['Không có issue nào khớp bộ lọc.', '조건에 맞는 이슈가 없습니다.'],
  unassigned: ['Chưa giao', '미배정'], none: ['Không có', '없음'],
  drop: ['Thả vào đây', '여기에 놓기'], count: ['issue', '건']
};
window.TYPES = ['bug', 'translation', 'ui', 'task'];
window.STATUSES = ['new', 'reported', 'waiting', 'fixed', 'checked'];
window.PRIORITIES = ['highest', 'high', 'medium', 'low', 'lowest'];
window.SEVERITIES = ['', 'S1', 'S2', 'S3'];
window.MARKETS = ['VN', 'Global', 'KR'];
window.CATS = ['overflow', 'context', 'order', 'term', 'spell', 'missing', 'unused', 'other'];
