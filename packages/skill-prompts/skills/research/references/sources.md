# Authoritative Vietnamese Legal Sources

Reference list for `vn-legal-research`. Always prefer these over general web search results.

## Primary databases

### 1. thuvienphapluat.vn (TVPL) — primary source

The most heavily indexed Vietnamese legal database. Each văn bản page shows:
- Số hiệu (document number)
- Loại văn bản (Luật / Nghị định / Thông tư / Quyết định / Công văn)
- Cơ quan ban hành
- Ngày ban hành / ngày hiệu lực
- **Tình trạng hiệu lực** — `Còn hiệu lực` / `Hết hiệu lực` / `Hết hiệu lực một phần` ← always read this

**URL patterns:**
- Document page: `https://thuvienphapluat.vn/van-ban/<lĩnh-vực>/<slug>.aspx`
- Procedure tool: `https://thuvienphapluat.vn/tnpl/...`
- Search: `https://thuvienphapluat.vn/page/timkiem?keyword=<từ-khóa>`

**Search tips:**
- Search by số hiệu when you have it: `59/2020/QH14`
- Search by procedure name: `thành lập công ty TNHH`
- TVPL sometimes paywalls full text — read the metadata box (status, effective dates) which is public, then cross-check with vbpl.vn for full text

### 2. vbpl.vn — National Legal Document Database (Bộ Tư pháp)

Official government database. Lower indexing but authoritative.

- URL: https://vbpl.vn/
- Search: https://vbpl.vn/TW/Pages/Home.aspx → "Tìm kiếm văn bản"
- Use when you need the official full text and TVPL is paywalled

### 3. dichvucong.gov.vn — National Public Services Portal

THE source for **thủ tục hành chính**. Each procedure has a page with the official:
- Thành phần hồ sơ
- Trình tự thực hiện
- Thời gian giải quyết
- Phí, lệ phí
- Cơ quan thực hiện
- Căn cứ pháp lý

**URL pattern:** `https://dichvucong.gov.vn/p/home/dvc-tthc-thu-tuc-hanh-chinh.html` then search.

This is **the** source you want for the "Trình tự thủ tục" and "Cơ quan tiếp nhận" sections. The metadata here is government-maintained and trumps blog/news interpretations.

### 4. congbao.chinhphu.vn — Official Gazette

For verifying the **published** form of a văn bản when there's any doubt about wording.

- URL: https://congbao.chinhphu.vn/

### 5. Ministry portals (for sector-specific procedures)

- **Bộ Tư pháp** (Justice): moj.gov.vn — civil status, notarization, judicial
- **Bộ Tài chính** (Finance): mof.gov.vn — fees, taxes, customs
- **Bộ Kế hoạch & Đầu tư**: mpi.gov.vn — business registration, FDI
- **Bộ Lao động - Thương binh & Xã hội**: molisa.gov.vn — labor, work permits, social insurance
- **Bộ Tài nguyên & Môi trường**: monre.gov.vn — land, environment
- **Bộ Công an**: bocongan.gov.vn — residence, ID, passport
- **Tổng cục Thuế**: gdt.gov.vn — tax administration
- **Cục Quản lý xuất nhập cảnh**: xuatnhapcanh.gov.vn — visa, immigration

For **local procedures**, also check the relevant Sở (provincial department) portal.

## Search strategy

### Step 1: Identify the governing law
Find the **Luật** first (e.g., Luật Doanh nghiệp 2020, Luật Hôn nhân và Gia đình 2014). This anchors the rest.

### Step 2: Find the implementing Nghị định
The Chính phủ Nghị định that implements the Luật contains operational details.

### Step 3: Find the procedural Thông tư
Thông tư of the relevant Bộ contains forms (mẫu), specific document lists, and fees.

### Step 4: Cross-check on dichvucong.gov.vn
Confirm the procedure exists in the national TTHC database and read the official summary.

### Step 5: Check fee Thông tư (if fees apply)
Bộ Tài chính issues fee Thông tư separately and updates them frequently. Examples:
- Thông tư 47/2019/TT-BTC — phí công bố thông tin doanh nghiệp
- Thông tư 85/2019/TT-BTC — phí, lệ phí thuộc thẩm quyền HĐND tỉnh

Always cite the **latest** fee Thông tư, not the one in older blog posts.

## WebSearch query templates

When WebFetch is restricted, use these query shapes:

```
site:thuvienphapluat.vn <procedure name>
site:dichvucong.gov.vn <procedure name>
site:vbpl.vn <số hiệu văn bản>
<procedure name> "còn hiệu lực" 2024..2026
<procedure name> "thông tư" "phí"
```

## Red flags — when to be extra careful

- Procedure involves **yếu tố nước ngoài** (foreign element): often dual-track (Luật chung + Luật chuyên ngành về FDI / kết hôn có yếu tố nước ngoài)
- Procedure crosses **provincial boundaries**: separate filings may be needed
- **Recently changed law**: if the governing Luật was amended in the last 2 years, double-check that older blog posts aren't describing the previous regime
- **Discretionary fees** ("theo quy định của địa phương"): cite the HĐND tỉnh resolution where possible, otherwise flag as `[Tùy địa phương — kiểm tra Nghị quyết HĐND tỉnh nơi nộp hồ sơ]`
