# Output Template — Annotated Reference

This file shows the strict output format with a fully worked example. Section names must match exactly — the docx generator parses them as anchors.

## Section-by-section guidance

### `# [Tên thủ tục]` (H1, top of file)
The procedure name in Vietnamese, capitalized as a title. Be specific:
- ✅ `# Thủ tục thành lập công ty TNHH một thành viên do cá nhân Việt Nam làm chủ`
- ❌ `# Thành lập công ty`

### Metadata block (right under H1)
Three lines. Fill `Khách hàng` and `Ngày soạn`. Leave `Người soạn` blank — luật sư fills this in.

### `## Định hướng`
The lawyer's framing — what the client is actually trying to achieve and the legal path you recommend.

2-4 paragraphs answering:
1. What legal regime applies? (Luật chính + nguồn pháp lý chuyên ngành nếu có)
2. What are the key conditions the client must satisfy?
3. What's the recommended path? Are there alternative paths and tradeoffs?
4. What assumptions are you making? Flag any uncertain fact you've assumed.

This is the only section where a long-form lawyerly tone is expected. The rest are operational.

### `## Thứ tự các bước`
Numbered list of step names + 1-line description. Maximum 7-8 steps. If you need more, you've sliced too finely — group related actions.

Use **bold** for the step name itself, then `— ` and the description. Sub-numbering allowed for parallel steps (e.g., `2a`, `2b`).

### `## Hồ sơ các bước`
H3 per step. Bulleted list of giấy tờ. Each bullet specifies:
- **Tên giấy tờ**
- **Số lượng** (1 bản chính / 2 bản sao công chứng)
- **Yêu cầu hình thức** (mẫu số ..., có chứng thực, dịch công chứng nếu tiếng nước ngoài)

### `## Trình tự thủ tục thực hiện`
Bold step header (`**Bước N: ...**`) followed by 4 sub-bullets:
- **Cách thực hiện** — nộp trực tiếp / qua cổng dịch vụ công / bưu điện
- **Thời gian xử lý** — X ngày làm việc kể từ khi nhận đủ hồ sơ hợp lệ
- **Kết quả** — tên giấy chứng nhận/giấy phép được cấp
- **Cơ sở pháp lý** — Điều X, văn bản Y

### `## Cơ quan tiếp nhận xử lý hồ sơ`
Markdown table. Columns: `Bước | Cơ quan | Địa chỉ / Cổng nộp | Ghi chú`. One row per step.

### `## Phí và lệ phí`
Markdown table. Columns: `Khoản phí | Mức phí (VNĐ) | Cơ sở pháp lý | Ghi chú`.
Then a `**Tổng dự kiến:**` line under the table.

If thủ tục miễn phí, write a single row: `| Toàn bộ thủ tục | 0 (miễn phí) | [Thông tư ...] | |` and `**Tổng dự kiến:** 0 VNĐ`.

### `## Căn cứ pháp lý`
Bulleted list. Full citation: loại + số hiệu + ngày ban hành + tình trạng hiệu lực.

### `## Lưu ý & rủi ro`
Bulleted list. Operational warnings, common pitfalls, optional services, deadlines that matter.

---

## Worked example (abbreviated)

```markdown
# Thủ tục đăng ký kết hôn có yếu tố nước ngoài tại Việt Nam

**Khách hàng:** Công dân Việt Nam (nữ, 32 tuổi, HKTT Hà Nội) đăng ký kết hôn với công dân Hàn Quốc tại Hà Nội.
**Ngày soạn:** 2026-05-11
**Người soạn:**

## Định hướng

Trường hợp khách hàng thuộc đăng ký kết hôn có yếu tố nước ngoài theo Điều 38, Luật Hộ tịch số 60/2014/QH13 và được hướng dẫn cụ thể tại Nghị định 123/2015/NĐ-CP. Thẩm quyền giải quyết thuộc Ủy ban nhân dân cấp huyện nơi cư trú của công dân Việt Nam (Điều 37 Luật Hộ tịch).

Khách hàng cần lưu ý hai điều kiện then chốt: (i) phía Hàn Quốc phải cung cấp Giấy xác nhận tình trạng hôn nhân do cơ quan có thẩm quyền Hàn Quốc cấp và được hợp pháp hóa lãnh sự, dịch công chứng sang tiếng Việt; (ii) nếu một trong hai bên đã ly hôn trước đó, cần bổ sung bản án/quyết định ly hôn đã có hiệu lực pháp luật.

Giả định: hai bên đều đủ điều kiện kết hôn theo Điều 8 Luật Hôn nhân và Gia đình 2014 (không thuộc các trường hợp cấm tại Điều 5). Nếu khách hàng có tiền sử kết hôn trước đó hoặc dưới 18 tuổi, đề nghị bổ sung thông tin.

## Thứ tự các bước

1. **Chuẩn bị hồ sơ** — thu thập giấy tờ của cả hai bên, hợp pháp hóa lãnh sự giấy tờ phía nước ngoài.
2. **Nộp hồ sơ tại UBND cấp huyện** — nộp trực tiếp hoặc qua Cổng dịch vụ công.
3. **Phỏng vấn (nếu được yêu cầu)** — UBND có thể yêu cầu phỏng vấn để xác minh sự tự nguyện.
4. **Nhận Giấy chứng nhận kết hôn** — ký tên trước mặt cán bộ hộ tịch.

## Hồ sơ các bước

### Bước 1: Chuẩn bị hồ sơ
- **Tờ khai đăng ký kết hôn** (mẫu theo Thông tư 04/2020/TT-BTP) — 1 bản, mỗi bên ký riêng
- **Giấy xác nhận tình trạng hôn nhân** của công dân Việt Nam — 1 bản chính, do UBND cấp xã nơi cư trú cấp, có giá trị 6 tháng
- **Giấy xác nhận tình trạng hôn nhân** của công dân Hàn Quốc — 1 bản chính, hợp pháp hóa lãnh sự + dịch công chứng tiếng Việt
- **Hộ chiếu / CCCD của hai bên** — bản sao có chứng thực
- **Giấy khám sức khỏe tâm thần** của hai bên — 1 bản chính, do cơ sở y tế có thẩm quyền cấp, có giá trị 6 tháng

### Bước 2: Nộp hồ sơ
- Toàn bộ hồ sơ tại Bước 1 nộp 1 bộ

## Trình tự thủ tục thực hiện

**Bước 1: Nộp hồ sơ**
- Cách thực hiện: Nộp trực tiếp tại Bộ phận một cửa UBND cấp huyện hoặc qua Cổng dịch vụ công quốc gia
- Thời gian xử lý: 15 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ
- Kết quả: Giấy hẹn trả kết quả
- Cơ sở pháp lý: Điều 38 Luật Hộ tịch 2014, Điều 31 Nghị định 123/2015/NĐ-CP

**Bước 2: Trao Giấy chứng nhận kết hôn**
- Cách thực hiện: Hai bên có mặt tại UBND cấp huyện để ký vào Sổ hộ tịch
- Thời gian xử lý: Trong thời hạn UBND mời (thường trong vòng 15 ngày từ ngày nộp đủ hồ sơ)
- Kết quả: Giấy chứng nhận kết hôn (2 bản chính)
- Cơ sở pháp lý: Điều 38 Luật Hộ tịch 2014

## Cơ quan tiếp nhận xử lý hồ sơ

| Bước | Cơ quan | Địa chỉ / Cổng nộp | Ghi chú |
|------|---------|--------------------|---------|
| 1-2 | UBND quận/huyện nơi công dân Việt Nam cư trú | Bộ phận một cửa UBND cấp huyện hoặc dichvucong.gov.vn | Cả hai bên có mặt khi nhận kết quả |

## Phí và lệ phí

| Khoản phí | Mức phí (VNĐ) | Cơ sở pháp lý | Ghi chú |
|-----------|---------------|---------------|---------|
| Lệ phí đăng ký kết hôn có yếu tố nước ngoài | 1.000.000 | Nghị quyết HĐND tỉnh/TP (mức trần Thông tư 85/2019/TT-BTC) | Mức cụ thể do HĐND tỉnh quy định, dao động 1-1.5 triệu |
| Phí hợp pháp hóa lãnh sự (nếu thực hiện tại VN) | 30.000/giấy | Thông tư 157/2016/TT-BTC | |
| Phí dịch công chứng giấy tờ tiếng Hàn | ~150.000-300.000/trang | Theo biểu phí công chứng địa phương | Không thuộc phí nhà nước |

**Tổng dự kiến:** ~1.500.000 - 2.500.000 VNĐ (chưa gồm phí dịch vụ luật sư và phí cấp giấy tờ phía Hàn Quốc)

## Căn cứ pháp lý

- Luật Hộ tịch số 60/2014/QH13 ngày 20/11/2014 (còn hiệu lực)
- Luật Hôn nhân và Gia đình số 52/2014/QH13 ngày 19/06/2014 (còn hiệu lực)
- Nghị định 123/2015/NĐ-CP ngày 15/11/2015 (còn hiệu lực)
- Thông tư 04/2020/TT-BTP ngày 28/05/2020 (còn hiệu lực)
- Thông tư 85/2019/TT-BTC ngày 29/11/2019 (còn hiệu lực)

## Lưu ý & rủi ro

- Giấy xác nhận tình trạng hôn nhân của cả hai bên chỉ có giá trị **6 tháng** kể từ ngày cấp — chuẩn bị hồ sơ Hàn Quốc sát ngày nộp để tránh hết hạn.
- Nếu phía Hàn Quốc đã ly hôn, cần bổ sung bản án/quyết định ly hôn đã hợp pháp hóa lãnh sự + dịch công chứng. Nếu kết hôn lần thứ hai trong vòng 300 ngày từ ngày ly hôn, cần xác nhận không mang thai.
- UBND có quyền yêu cầu phỏng vấn nếu nghi ngờ kết hôn giả tạo — cả hai bên nên thống nhất thông tin cơ bản (thời gian quen, nơi đầu tiên gặp nhau, công việc của nhau).
- Sau khi có Giấy chứng nhận kết hôn, công dân Hàn Quốc nếu muốn cư trú dài hạn tại Việt Nam cần thực hiện thủ tục riêng về thẻ tạm trú (xem `xuatnhapcanh.gov.vn`).
```

---

## Format pitfalls

- **Don't use H4 (`####`).** The docx generator only styles H1/H2/H3.
- **Don't put long paragraphs in tables.** Tables are for tabular data. Long explanations go in the paragraph sections.
- **Don't drop sections.** Even if "không áp dụng", keep the heading and explain why.
- **Use VNĐ, not VND or ₫.** Consistent unit symbol.
- **Date format:** Vietnamese context = `DD/MM/YYYY` for legal document dates. The metadata `Ngày soạn` uses `YYYY-MM-DD` for sorting.
