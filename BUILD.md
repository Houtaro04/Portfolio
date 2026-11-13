# Hướng dẫn build – Kyle Portfolio

Web portfolio tĩnh viết bằng **React + TypeScript + Vite**. Build xong ra thư mục `dist/` chỉ gồm HTML/CSS/JS, upload lên hosting nào cũng chạy được.

## 1. Yêu cầu

- **Node.js 18 trở lên** (kiểm tra: `node -v`)
- **npm** (đi kèm Node)

## 2. Cài đặt (làm một lần)

```bash
cd d:\KylePortfolio
npm install
```

## 3. Các lệnh thường dùng

| Lệnh | Việc làm |
| --- | --- |
| `npm run dev` | Chạy bản phát triển tại http://localhost:5173, tự tải lại khi sửa code |
| `npm run typecheck` | Chỉ kiểm tra lỗi TypeScript |
| `npm run build` | Kiểm tra kiểu rồi build ra thư mục `dist/` |
| `npm run preview` | Chạy thử bản build tại http://localhost:4173 |
| `npm run cms` | Bật máy chủ CMS cục bộ (cổng 8081) để thử trang quản trị `/admin` trên máy, chạy cùng lúc với `npm run dev` |

## 4. Build ra bản chạy thật

```bash
npm run build
```

Kết quả trong `dist/`:

```
dist/
├─ index.html        ← trang chủ
├─ portfolio.html    ← trang portfolio đầy đủ (nút "Xem thêm", bấm vào thẻ ở trang chủ)
├─ assets/           ← JS, CSS đã gộp và nén
└─ images/           ← ảnh trong public/images/
```

Web có **2 trang** (build nhiều trang, cấu hình ở `vite.config.ts`). Đường dẫn dùng `base: './'` nên thư mục `dist/` đặt ở gốc domain hay trong thư mục con đều chạy đúng.

> **Lưu ý:** không mở trực tiếp `dist/index.html` bằng cách bấm đúp (địa chỉ `file://`). Trình duyệt chặn script dạng module nên trang sẽ trắng. Hãy chạy qua server, ví dụ `npm run preview`.

## 5. Chỉnh nội dung

Nội dung nằm trong các **file JSON ở thư mục `content/`**, không còn nằm trong code. Có 2 cách sửa:

1. **Qua trang quản trị `/admin`** (dành cho khách hàng): giao diện form, không cần đụng code. Xem hướng dẫn riêng trong [ADMIN.md](ADMIN.md). Chạy thử trên máy: `npm run dev` và `npm run cms` (2 cửa sổ terminal), rồi mở http://localhost:5173/admin/
2. **Sửa tay file JSON** bằng trình soạn thảo (dành cho bạn).

| File | Nội dung |
| --- | --- |
| `content/profile.json` | tên, tên đầy đủ (hiện ở logo và chân trang), phần "Về mình": giới thiệu, số liệu, thẻ chuyên môn, ảnh |
| `content/pro.json` | tab **Chuyên nghiệp**: danh sách bộ ảnh |
| `content/industrial.json` | tab **Công nghiệp**: danh sách bộ ảnh |
| `content/projects.json` | tab **Project**: mỗi project gồm nhiều bộ ảnh |
| `content/bts.json` | tab **Video hậu trường** |
| `content/contact.json` | mạng xã hội, Messenger, điện thoại, email |
| `content/settings.json` | số mục nổi bật ở trang chủ (`featuredCount`, mặc định 4), tab mở sẵn (`defaultCategory`, hiện là `pro`) và kiểu cuộn trang (`scrollMode`, xem mục "Hiệu ứng và kiểu cuộn") |

- Mỗi **bộ ảnh** có `title`, `desc`, `featured` (true = hiện ở trang chủ), `cover` (ảnh bìa, tùy chọn) và `photos` (danh sách `{ "src": ..., "title": ... }`). Bỏ trống `cover` thì dùng ảnh đầu tiên.
- Mỗi **project** có `title`, `desc`, `featured`, `cover` (tùy chọn) và `sets` (danh sách bộ ảnh như trên).
- Mỗi **video** có `title`, `desc`, `duration`, `thumb` (ảnh bìa) và **một trong hai**: `youtubeId` (phần sau `v=` trong link YouTube) hoặc `src` (file mp4).
- Không cần tự đặt id: web tự tạo đường dẫn từ tên (ví dụ "Chân dung doanh nhân" → `chan-dung-doanh-nhan`). Đổi tên thì đường dẫn đổi theo.
- Bộ ảnh chưa có ảnh thật sẽ hiện khung màu giữ chỗ.
- **Thứ tự tab** hiện tại: Project, Công nghiệp, Chuyên nghiệp, Video hậu trường. Muốn đổi thì sửa thứ tự các dòng trong khối `PORTFOLIO` của `src/data.ts`.

**Luồng xem trên web:**

- Trang chủ (mục Sản phẩm) hiện vài mục nổi bật của tab đang chọn. Bấm vào thẻ thì chuyển sang trang `portfolio.html`.
- Công nghiệp / Chuyên nghiệp: thẻ là **bộ ảnh** → bấm xem toàn bộ ảnh → bấm ảnh để phóng to.
- Project: thẻ là **project** → xem các bộ ảnh của project → xem toàn bộ ảnh → phóng to.
- Vị trí nằm trong URL, ví dụ `portfolio.html?cat=pro&set=chan-dung-doanh-nhan` hoặc `portfolio.html?cat=projects&project=su-kien&set=hoi-nghi`.

Thẻ ảnh có tỉ lệ khung 4×6 (dọc). Đổi tỉ lệ bằng biến `--card-ratio` ở `.albums` và `.gallery` trong `src/styles.css`.

### Hiệu ứng và kiểu cuộn

Kiểu cuộn trang chọn ở `content/settings.json` → `scrollMode` (hoặc trong `/admin` → Cài đặt chung → "Kiểu cuộn trang"):

- `"smooth"` (đang dùng): cuộn mượt liên tục có quán tính bằng thư viện **Lenis**, giống các web tham khảo.
- `"snap"`: cuộn dừng từng mục (scroll-snap của trình duyệt), không dùng Lenis.

Hai kiểu này **không dùng chung được** (Lenis và scroll-snap giằng co nhau), nên chỉ chọn một. Muốn quay lại cuộn dừng từng mục thì đổi giá trị thành `"snap"` và build lại, không cần sửa code.

Các hiệu ứng khác dùng được ở cả hai kiểu cuộn (đều là CSS thuần cộng một ít React, không thêm thư viện nào ngoài Lenis):

| Hiệu ứng | File chính |
| --- | --- |
| Màn hình mở đầu (số đếm, chỉ hiện lần đầu trong phiên) | `components/Preloader.tsx`, `preloader.ts` |
| Con trỏ chuột riêng, hiện chữ "Xem" / "Play" trên thẻ (thuộc tính `data-cursor`) | `components/Cursor.tsx` |
| Hạt phim phủ toàn trang | `body::after` trong `styles.css` |
| Tiêu đề hiện từng dòng | `components/Lines.tsx` |
| Thẻ ảnh hé lộ bằng `clip-path` | `.item` trong `styles.css` |
| Chuyển trang mượt giữa trang chủ và portfolio (Chrome/Edge) | `@view-transition` trong `styles.css` |
| Mục **Sản phẩm** cuộn ngang theo cuộn dọc: cuộn chuột bình thường, mục này "ghim" trên màn hình và dải thẻ chạy sang ngang, xem hết thì trang cuộn xuống tiếp; có thanh tiến độ | `components/Portfolio.tsx`, hook `useHorizontalPin`, khối "MỤC SẢN PHẨM" trong `styles.css` |
| **Chân trang "kéo rèm"** gộp Social + bản quyền: khối liên hệ cố định phía sau, cuộn tới cuối thì nội dung cuộn đi để lộ ra | `components/Contact.tsx`, hook `useCurtainReveal`, khối "CHÂN TRANG KÉO RÈM" trong `styles.css` |
| **Chuyển cảnh lưới ảnh** khi bấm vào sản phẩm (lưới 5 cột phóng vào ô được chọn, rồi màn che kéo lên) | `transition.ts`, `components/CoverCard.tsx`, khối "CHUYỂN CẢNH" trong `styles.css` |

Ảnh lớn bên phải phần liên hệ cuối trang lấy từ `content/contact.json` → `image` (hoặc `/admin` → Mạng xã hội và liên hệ). Danh sách dòng liên hệ gồm các mạng xã hội, Messenger, điện thoại và email trong cùng file đó. Trang `portfolio.html` vẫn dùng thanh footer cố định mỏng.

Người dùng bật "giảm chuyển động" trong hệ điều hành thì màn hình mở đầu, con trỏ riêng, Lenis và các animation đều tự tắt.

### Chế độ nhẹ cho điện thoại (`html.lite`)

Trên điện thoại / máy cảm ứng / màn dưới 820px, web tự vào **chế độ nhẹ** (class `lite` trên `<html>`, bật bằng một đoạn script nhỏ ở đầu `index.html` và `portfolio.html` để chạy trước cả CSS và ảnh nền). Chế độ này bỏ các hiệu ứng nặng để cuộn mượt và đỡ tốn pin/dữ liệu:

- Dùng cuộn gốc của trình duyệt thay cho Lenis; ẩn menu chấm bên trái (đè lên chữ trên màn hẹp).
- Nền và ảnh hero dùng bản nhỏ (`public/images/bg-m.jpg`, `hero-bg-m.jpg`), nền đứng yên thay vì chuyển động/phóng to.
- Bỏ kính mờ ở header, hạt phim tĩnh, chữ óng ánh và tia lấp lánh không chuyển động.
- Chân trang liên hệ nằm tuần tự cuối trang (không "kéo rèm"); ảnh liên hệ làm nền mờ.
- Chuyển cảnh khi bấm sản phẩm chỉ quét một màn che (không dựng lưới 15 ô).
- Mục Sản phẩm: tab một hàng cuộn ngang; trang `portfolio.html` hiện 2 thẻ mỗi hàng.

Nếu thay ảnh nền hoặc ảnh hero, nhớ tạo luôn bản nhỏ cho điện thoại (nền ~720px chiều rộng, hero ~1800px) và ghi đè đường dẫn trong khối "TỐI ƯU & RESPONSIVE CHO ĐIỆN THOẠI" của `src/styles.css`.

### Logo

Logo là file `public/images/logo.png` (nền trong suốt, chữ trắng). Muốn đổi logo, thay file này bằng ảnh mới cùng tên, nên cắt sát chữ và rộng khoảng 800px.

### Thêm ảnh thật (khi sửa tay)

1. Bỏ file ảnh vào `public/images/`, ví dụ `public/images/pro/doanh-nhan/01.jpg`.
2. Khai báo trong bộ ảnh, ví dụ trong `content/pro.json`:

```json
{
  "title": "Chân dung doanh nhân",
  "featured": true,
  "photos": [
    { "src": "images/pro/doanh-nhan/01.jpg", "title": "Ảnh 1" },
    { "src": "images/pro/doanh-nhan/02.jpg", "title": "Ảnh 2" }
  ]
}
```

`src` viết dạng `images/...` (có hay không có dấu `/` ở đầu đều được). Ảnh khách tải lên qua `/admin` được lưu tự động vào `public/images/uploads/`. Nên nén ảnh khoảng 1600px cạnh dài, dưới 400KB mỗi ảnh để web tải nhanh.

## 6. Đưa lên mạng (deploy)

Upload **nội dung thư mục `dist/`** (không phải cả dự án):

- **Netlify / Cloudflare Pages / Vercel:** kéo thả thư mục `dist/` hoặc nối với repo, lệnh build là `npm run build`, thư mục xuất bản là `dist`.
- **GitHub Pages:** đẩy nội dung `dist/` lên nhánh `gh-pages` (hoặc dùng GitHub Actions chạy `npm run build`).
- **Hosting thường (cPanel, FTP):** upload nội dung `dist/` vào `public_html`.

## 7. Demo nhanh qua ngrok

Mở 2 cửa sổ terminal trong `d:\KylePortfolio`:

```bash
# Terminal 1: build và serve thư mục dist
npm run build
npx serve dist -l 4173

# Terminal 2: mở tunnel
ngrok http 4173
```

Link công khai hiện ở dòng `Forwarding` (hoặc xem tại http://127.0.0.1:4040). Mỗi lần chạy ngrok bản miễn phí link sẽ đổi, và ai có link đều xem được. Dừng bằng `Ctrl+C`.

> Nên demo bằng bản build như trên. Chạy `npm run dev` rồi `ngrok http 5173` có thể bị Vite chặn tên miền ngrok ("Blocked request").

## 8. Cấu trúc dự án

```
├─ index.html            ← trang chủ (điểm vào)
├─ portfolio.html        ← trang portfolio (điểm vào)
├─ vite.config.ts        ← cấu hình build 2 trang
├─ tsconfig.json
├─ content/              ← NỘI DUNG (file JSON): khách sửa qua /admin, bạn sửa tay được
├─ public/images/        ← ảnh của bạn (có logo.png), khách tải lên thì vào uploads/
├─ public/admin/         ← trang quản trị /admin (index.html + config.yml các form)
└─ src/
   ├─ data.ts            ← đọc các file trong content/ và chuẩn hoá (tạo id, ảnh giữ chỗ...)
   ├─ types.ts           ← kiểu dữ liệu
   ├─ routes.ts          ← đọc/ghi vị trí xem trong URL của trang portfolio
   ├─ hooks.ts           ← scrollspy, animation khi cuộn
   ├─ styles.css         ← toàn bộ giao diện
   ├─ main.tsx / App.tsx ← trang chủ
   ├─ portfolio.tsx / PortfolioPage.tsx ← trang portfolio
   └─ components/        ← Hero, About, Portfolio, Social, SideNav, CoverCard, VideoCard, Lightbox, Footer...
```

## 9. Xử lý sự cố

| Triệu chứng | Cách xử lý |
| --- | --- |
| Trang trắng khi mở `dist/index.html` | Chạy qua server (`npm run preview`), đừng mở bằng `file://` |
| `npm run build` báo lỗi TypeScript | Đọc dòng lỗi (file và số dòng), thường do sửa file trong `src/` sai kiểu |
| Sửa file JSON mà web báo lỗi | Kiểm tra dấu phẩy, ngoặc kép của file JSON (dán vào https://jsonlint.com để soát) |
| `/admin` hiện trang chủ khi chạy `npm run dev` | Gõ `/admin/` (có dấu `/` cuối) hoặc `/admin/index.html` |
| Ảnh không hiện | Kiểm tra `src` đúng dạng `images/...` và file nằm trong `public/images/` |
| Sửa code mà link ngrok không đổi | Chạy lại `npm run build`, rồi tải lại trang |
| Cổng 4173 đã bị dùng | Đổi sang cổng khác, ví dụ `-l 4180`, và `ngrok http 4180` |