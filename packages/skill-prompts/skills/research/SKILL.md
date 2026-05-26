---
name: vn-legal-research
description: "Research a Vietnamese legal procedure from authoritative sources and draft a Vietnamese legal advisory in markdown. Use whenever the user describes a Vietnam client scenario and needs required documents, steps, authority, timing, fees, or legal basis for a procedure. Covers business, FDI, civil status, land, labor, IP, tax, and licensing matters. Do not use for reviewing an existing draft or exporting to docx."
---

# vn-legal-research — Vietnamese Legal Procedure Research

## What this skill does

Given a customer scenario in Vietnamese (or English describing a Vietnamese matter), research the relevant procedure on authoritative Vietnamese legal databases and produce a structured Vietnamese-language advisory draft.

The output is a markdown file with a strict section structure that downstream skills (`vn-legal-review`, `vn-legal-docx`) consume. **Do not change the section names** — the docx generator parses them by heading.

## Workflow

### 1. Parse the client requirement

Extract from the user's message:
- **Loại thủ tục** (procedure type) — e.g. thành lập doanh nghiệp, ly hôn, sang tên sổ đỏ
- **Chủ thể** (subject) — cá nhân Việt Nam / người nước ngoài / pháp nhân / hộ gia đình
- **Bối cảnh đặc thù** — vốn nước ngoài, có tranh chấp, đã có/chưa có giấy tờ gì
- **Địa phương** (locality) — nếu có, vì một số thủ tục có quy định địa phương riêng

If essential context is missing (e.g., bạn không biết quốc tịch khách hàng cho thủ tục có yếu tố nước ngoài), state the assumption explicitly in the **Định hướng** section rather than blocking.

### 2. Research authoritative sources

**Always** consult Vietnamese authoritative sources. Do not rely on training knowledge — Vietnamese law changes frequently and trained data is stale.

Source priority order (read `references/sources.md` for full list and search patterns):

1. **thuvienphapluat.vn** — primary source for indexed legal documents with status (còn hiệu lực / hết hiệu lực)
2. **vbpl.vn** — National legal document database (Bộ Tư pháp)
3. **dichvucong.gov.vn** — National public services portal: thủ tục, hồ sơ, phí, cơ quan tiếp nhận
4. **congbao.chinhphu.vn** — Official Gazette
5. Ministry portals (mof.gov.vn for fees/tax, moj.gov.vn for justice, etc.)

For each procedure, you MUST verify:
- The governing legal documents are **còn hiệu lực** (still in force) — flag any that are hết hiệu lực
- The procedure steps match the **current** version of the regulation (check năm ban hành and lần sửa đổi)
- Fees match the current Thông tư of Bộ Tài chính (these change often)

Cite the legal basis using format: **`Điều X, Luật/Nghị định/Thông tư Y số Z/NN/Loại-CQ ngày DD/MM/YYYY`**. Example: `Điều 22, Luật Doanh nghiệp số 59/2020/QH14 ngày 17/06/2020`.

When using WebFetch, search both Vietnamese and English keywords. thuvienphapluat.vn URLs typically look like `https://thuvienphapluat.vn/van-ban/...` or `https://thuvienphapluat.vn/phap-luat/thoi-su-phap-luat/...`. If WebFetch is unavailable or pages are paywalled, fall back to WebSearch with site filters: `site:thuvienphapluat.vn`, `site:dichvucong.gov.vn`.

### 3. Structure the output

Use **exactly this template** (read `references/output-template.md` for the full reference with examples). The headings must match character-for-character — the docx generator uses them as anchors.

```markdown
# [Tên thủ tục]

**Khách hàng:** [tóm tắt bối cảnh khách hàng — 1-2 câu]
**Ngày soạn:** [YYYY-MM-DD]
**Người soạn:** [bỏ trống để khách hàng/luật sư điền]

## Định hướng

[2-4 đoạn văn: phân tích pháp lý sơ bộ, xác định cơ sở pháp lý chính, lưu ý rủi ro/điều kiện đặc biệt, khuyến nghị hướng xử lý.]

## Thứ tự các bước

1. **[Tên bước 1]** — [mô tả ngắn]
2. **[Tên bước 2]** — [mô tả ngắn]
3. ...

## Hồ sơ các bước

### Bước 1: [Tên bước 1]
- [Tên giấy tờ] — [số lượng, yêu cầu (bản chính / bản sao công chứng / mẫu số ...)]
- ...

### Bước 2: [Tên bước 2]
- ...

## Trình tự thủ tục thực hiện

**Bước 1: [Tên bước]**
- Cách thực hiện: [nộp trực tiếp / qua cổng dịch vụ công / qua bưu điện]
- Thời gian xử lý: [X ngày làm việc]
- Kết quả: [tên giấy tờ được cấp]
- Cơ sở pháp lý: [Điều X, văn bản Y]

**Bước 2: [Tên bước]**
- ...

## Cơ quan tiếp nhận xử lý hồ sơ

| Bước | Cơ quan | Địa chỉ / Cổng nộp | Ghi chú |
|------|---------|--------------------|---------|
| 1 | [Sở/Phòng/Cục ...] | [địa chỉ hoặc URL cổng] | [trực tuyến/trực tiếp] |

## Phí và lệ phí

| Khoản phí | Mức phí (VNĐ) | Cơ sở pháp lý | Ghi chú |
|-----------|---------------|---------------|---------|
| [Tên khoản] | [số tiền] | [Thông tư ...] | [miễn/giảm nếu có] |

**Tổng dự kiến:** [số tiền VNĐ] (chưa bao gồm phí dịch vụ luật sư / công chứng ngoài nhà nước)

## Căn cứ pháp lý

- [Luật/Nghị định/Thông tư ... — đầy đủ số hiệu, ngày ban hành, trạng thái hiệu lực]
- ...

## Lưu ý & rủi ro

- [Bất kỳ điều khoản đặc biệt, ngoại lệ, rủi ro thực tiễn nào]
```

If a section is genuinely **không áp dụng** (e.g., thủ tục miễn phí), keep the heading and write `Không có / Miễn phí — [cơ sở pháp lý]`. Do NOT delete sections; the docx generator expects every heading.

### 4. Save the draft

Save to `<workspace>/legal-drafts/<slug>-draft.md` where `<slug>` is a kebab-case ASCII version of the procedure name (e.g., `thanh-lap-cong-ty-tnhh-1tv-draft.md`). Use the project root's `tmp/` directory if no workspace is provided.

Tell the user the file path and offer to run `/vn-legal-review` on it.

## Important behaviors

**Cite or don't claim.** Every concrete number (số ngày, số tiền, số mẫu giấy tờ) must trace to a specific Điều of a specific văn bản. If you cannot verify it, write `[CẦN KIỂM TRA — chưa tìm được nguồn xác thực]` and move on. It is better to flag uncertainty than to fabricate.

**Prefer the most recent source.** When two văn bản conflict, the newer one (with status còn hiệu lực) governs. Thông tư > Nghị định > Luật only when implementing within delegation; otherwise higher-rank văn bản governs.

**Don't oversimplify procedural ordering.** Some steps run in parallel, some have prerequisites. Reflect this in the "Thứ tự các bước" — use sub-numbering (1a, 1b) for parallel branches and write `(sau khi hoàn tất bước X)` for prerequisites.

**One procedure per draft.** If the client scenario involves multiple separable procedures (e.g., thành lập công ty + xin giấy phép con), produce one draft per procedure and list cross-references in **Lưu ý**.

## Files in this skill

- `references/sources.md` — authoritative Vietnamese legal databases, search patterns, URL templates
- `references/output-template.md` — fuller annotated template with a worked example
