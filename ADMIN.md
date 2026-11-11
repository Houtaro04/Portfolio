# Trang quản trị nội dung (`/admin`)

Khách hàng tự sửa nội dung web (chữ, ảnh, bộ ảnh, project, video, link mạng xã hội) bằng giao diện form, không cần đụng code. Công cụ dùng là **Decap CMS**, lưu nội dung vào các file JSON trong thư mục `content/`.

## 1. Thử ngay trên máy của bạn

Không cần GitHub hay Netlify. Mở 2 cửa sổ terminal trong `d:\KylePortfolio`:

```bash
npm run dev     # web chạy tại http://localhost:5173
npm run cms     # máy chủ CMS cục bộ, cổng 8081
```

Mở **http://localhost:5173/admin/**, bấm **Login** (không hỏi mật khẩu khi chạy trên máy). Bạn sẽ thấy các mục: Chuyên nghiệp, Công nghiệp, Project, Video hậu trường, Về mình, Mạng xã hội, Cài đặt chung.

Ở chế độ này, mỗi lần bấm **Publish** CMS ghi thẳng vào file trong `content/` và ảnh tải lên vào `public/images/uploads/`. Trang web ở cổng 5173 cập nhật gần như ngay.

> Khi thử xong mà không muốn giữ thay đổi, khôi phục các file trong `content/` (và xoá ảnh vừa tải trong `public/images/uploads/`).

## 2. Khách sửa như thế nào

1. Mở `tenmien.com/admin` và đăng nhập.
2. Chọn mục cần sửa ở cột bên trái, ví dụ **Portfolio: Chuyên nghiệp**.
3. Trong form:
   - gõ vào ô chữ để sửa tên, mô tả;
   - **Bộ ảnh → Thêm bộ ảnh** để tạo bộ mới; bấm vào một bộ để mở ra sửa;
   - trong bộ ảnh, **Ảnh trong bộ → Thêm ảnh**, rồi bấm **Choose an image** để tải ảnh từ máy lên;
   - tích **"Hiện ở trang chủ (nổi bật)"** để bộ ảnh hoặc project xuất hiện ở trang chủ (tối đa 4 mục mỗi tab);
   - kéo thả để đổi thứ tự các bộ ảnh hoặc ảnh;
4. Bấm **Publish** rồi **Publish now**. Sau khoảng 1–2 phút web tự cập nhật.

**Mẹo cho khách**
- Ảnh nên nén khoảng 1600px cạnh dài, dưới 400KB mỗi ảnh, nếu không web sẽ tải chậm.
- Video nên dùng YouTube: dán mã video (phần sau `v=` trong link) thay vì tải file mp4 lên.
- Bộ ảnh nào chưa có ảnh thật sẽ hiện khung màu giữ chỗ.
- Khách **không** sửa được màu sắc, bố cục, hiệu ứng, những thứ này cần nhờ người làm web.

## 3. Đưa lên mạng để khách dùng thật

Mình chưa kiểm thử phần này vì cần tài khoản GitHub và Netlify thật. Các bước dưới đây theo cách dùng phổ biến của Decap CMS. Tên các mục trong giao diện Netlify/GitHub có thể khác một chút, nếu gặp lỗi thì báo lại để chỉnh.

1. **Đẩy dự án lên GitHub** (repo tốt nhất đứng tên khách hoặc tổ chức của khách):
   ```bash
   git init
   git add .
   git commit -m "Khởi tạo"
   git branch -M main
   git remote add origin https://github.com/TEN-GITHUB/TEN-REPO.git
   git push -u origin main
   ```
2. **Đặt web trên Netlify** (hoặc Cloudflare Pages): chọn *Import from Git*, chọn repo vừa tạo, lệnh build là `npm run build`, thư mục xuất bản là `dist`. Từ giờ mỗi lần repo có thay đổi, web tự build lại.
3. **Sửa `public/admin/config.yml`**: đổi dòng `repo: TEN-GITHUB/TEN-REPO` thành repo thật, kiểm tra `branch: main`, rồi commit và push.
4. **Cho phép đăng nhập bằng GitHub:**
   - Trên GitHub tạo một *OAuth App* (Settings → Developer settings → OAuth Apps), điền *Authorization callback URL* là `https://api.netlify.com/auth/done`, lấy *Client ID* và *Client Secret*.
   - Trên Netlify vào cài đặt site, mục *Access & security → OAuth*, thêm nhà cung cấp **GitHub** và dán Client ID/Secret.
   - Nếu web dùng tên miền riêng, thêm dòng `site_domain: tenmien.com` ngay dưới `branch:` trong `config.yml`.
5. **Cấp quyền cho khách:** khách tạo tài khoản GitHub miễn phí, bạn mời họ làm *Collaborator* của repo (quyền ghi). Khách vào `tenmien.com/admin`, bấm **Login with GitHub**.

> Dòng `local_backend: true` trong `config.yml` chỉ có tác dụng khi mở từ `localhost`, nên để nguyên cũng không ảnh hưởng bản chạy thật.

## 4. Lưu ý khi vận hành

- Mỗi lần khách Publish là một lần lưu (commit) vào repo, lịch sử nằm ở GitHub nên **xóa nhầm có thể khôi phục** từ đó.
- Nếu bạn cũng sửa code trên máy, nhớ `git pull` trước khi sửa để lấy các thay đổi khách vừa Publish.
- Muốn thêm loại nội dung mới hoặc đổi cấu trúc form, sửa `public/admin/config.yml` (và `src/data.ts` nếu cần). Mọi trường trong file JSON phải có ô nhập tương ứng trong `config.yml`.
- Đường dẫn của bộ ảnh và project được tạo từ tên, nên **đổi tên thì link cũ (ví dụ `portfolio.html?cat=pro&set=...`) sẽ không còn đúng**.
