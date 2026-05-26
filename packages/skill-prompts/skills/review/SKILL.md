---
name: vn-legal-review
description: "Review and verify an existing Vietnamese legal advisory draft before client delivery. Use when the user already has a legal procedure document and wants citations, legal basis, fees, procedural steps, authority, or tone checked and corrected. Output is a revised markdown draft plus a change log. Do not use for research from scratch, translation, or docx export."
---

# vn-legal-review — Vietnamese Legal Advisory Review

## What this skill does

You are doing what a senior luật sư does to a junior associate's draft: read carefully, verify every cited văn bản is current and quoted correctly, check that the procedure is actually executable as described, fix Vietnamese legal language issues, and produce a clean revised version with a transparent change log.

This is **not** a rewrite skill. Preserve the author's structure and reasoning unless something is factually wrong or materially misleading. Conservative edits, surgical corrections.

## Input

A markdown file produced by `vn-legal-research` (or a hand-written equivalent following the same template). The file should have these sections — flag immediately if any are missing:

- `# [Tên thủ tục]` + metadata
- `## Định hướng`
- `## Thứ tự các bước`
- `## Hồ sơ các bước`
- `## Trình tự thủ tục thực hiện`
- `## Cơ quan tiếp nhận xử lý hồ sơ`
- `## Phí và lệ phí`
- `## Căn cứ pháp lý`
- `## Lưu ý & rủi ro`

## Review workflow

Work in this order — don't jump ahead. Each pass surfaces different issues.

### Pass 1 — Structural completeness

Read the draft once end-to-end. Confirm:
- All required H2 sections exist and have substantive content
- Every step in `Thứ tự các bước` appears in `Hồ sơ các bước` AND `Trình tự thủ tục thực hiện` AND `Cơ quan tiếp nhận`
- No section is left as a placeholder (`[CẦN KIỂM TRA]` is OK as a flag, but `Lorem ipsum` or empty bullets are not)

### Pass 2 — Citation validity

For **every** legal citation in `Căn cứ pháp lý` and inline (Điều X, văn bản Y):

1. **Format check** — proper format is `Điều X, Luật/Nghị định/Thông tư <tên ngắn> số <số>/<năm>/<loại-CQ> ngày <DD/MM/YYYY>`. Numbers like `59/2020/QH14` follow the pattern `<số thứ tự>/<năm>/<viết tắt CQ>`.
2. **Existence check** — verify the văn bản actually exists. WebFetch or WebSearch on `thuvienphapluat.vn` or `vbpl.vn` with the số hiệu. **Do not trust the draft** — even well-written drafts hallucinate số hiệu.
3. **Status check** — read the văn bản page on TVPL/VBPL and confirm `Còn hiệu lực`. If it's `Hết hiệu lực` or `Hết hiệu lực một phần`, that's a critical issue — flag and find the replacement.
4. **Quote check** — if the draft quotes content from a specific Điều, verify the quote matches. Common failure mode: the Điều number is right but the wording is from a different version of the law.

**Citation outcomes:**
- ✅ Verified → leave as-is, optionally add the URL in the change log
- ⚠️ Format issue → fix in place
- ❌ Wrong số hiệu / hết hiệu lực / wrong wording → fix in place AND log the change

### Pass 3 — Procedural correctness

For each step in `Trình tự thủ tục thực hiện`:

- **Cơ quan** matches the thẩm quyền defined in the cited văn bản
- **Thời gian** matches the văn bản (and cross-check against dichvucong.gov.vn if the procedure is in the national TTHC database)
- **Cách thực hiện** is achievable (e.g., don't claim "qua Cổng dịch vụ công" if the thủ tục isn't actually published there)
- **Prerequisite ordering** — if Bước 2 needs the output of Bước 1, that's clear; flag any logical loops

### Pass 4 — Fee accuracy

This is the most error-prone section. Fees change yearly via Bộ Tài chính Thông tư.

- For each fee row, verify the **Cơ sở pháp lý** column points to the **latest** Thông tư still in force
- Common stale citations to watch for: Thông tư 215/2016/TT-BTC (replaced by 47/2019), Thông tư 250/2016/TT-BTC (largely replaced by 85/2019), older versions of 47/2019
- For local fees ("Nghị quyết HĐND tỉnh"), if the draft asserts a specific number, flag it as `[Kiểm tra Nghị quyết HĐND tỉnh hiện hành nơi nộp]` unless verified
- Sanity-check the math in `Tổng dự kiến`

### Pass 5 — Vietnamese legal writing

Quick polish for tone — this is delivered to clients:

- Use formal pronouns (`quý khách` / no pronoun) — avoid `bạn`, `mình`
- Verb forms should be active and clear: `nộp hồ sơ` not `hồ sơ được nộp`
- Numbers in Vietnamese style: `1.000.000 VNĐ` (period as thousands separator), `15 ngày làm việc` (with `làm việc` when statutory)
- `nộp trực tiếp` / `qua bưu điện` / `trực tuyến qua Cổng dịch vụ công quốc gia` — standard phrasings
- Avoid English borrowings where Vietnamese has a settled term: `hồ sơ` not `documents`, `cơ quan có thẩm quyền` not `competent authority`

Don't rewrite sentences for style preference alone. Only edit if it improves legal precision or readability.

### Pass 6 — Risk completeness

Read the original client requirement (from the metadata `Khách hàng` line) and ask: are there risks the draft missed that a luật sư would flag?

Common omissions worth adding to `Lưu ý & rủi ro`:
- Time-sensitive certificates (giấy xác nhận tình trạng hôn nhân, giấy khám sức khỏe) and their expiry windows
- Related downstream procedures the client will need (visa, residence card, tax registration after company formation)
- Discretionary refusal grounds the cơ quan may invoke
- Cost items outside the official phí table (notary, translation, courier)

Add to `Lưu ý & rủi ro` rather than rewriting other sections.

## Output

Produce **two** files in the same directory as the input:

1. **`<original-basename>-reviewed.md`** — the revised draft. Edit in place; do not annotate inline with `[REVIEWER NOTE]` etc. The output should be deliverable to a client as-is.

2. **`<original-basename>-changelog.md`** — a transparent log of changes. Format:

   ```markdown
   # Change Log — [Tên thủ tục]

   **Reviewed:** [YYYY-MM-DD]

   ## Critical issues (factual / legal)
   - [Pass 2] Citation `Thông tư 215/2016/TT-BTC` → Hết hiệu lực from 2019. Replaced with `Thông tư 47/2019/TT-BTC` (Điều 4 — phí công bố thông tin doanh nghiệp 100.000 VNĐ). Source: <URL>
   - ...

   ## Procedural corrections
   - [Pass 3] Bước 2 thời gian: draft said `5 ngày` → actual is `3 ngày làm việc` per Điều 27 Nghị định 01/2021/NĐ-CP.
   - ...

   ## Fee adjustments
   - ...

   ## Language polish
   - Minor: `bạn` → `quý khách` (3 occurrences)
   - ...

   ## Items flagged for human verification
   - [Pass 2] Could not access full text of Thông tư XX/2024/TT-BTC on TVPL (paywalled). Verified existence on vbpl.vn but content quote not independently confirmed.
   - ...

   ## Unchanged but noted
   - Định hướng's framing of the foreign-element analysis is correct and well-supported. No changes.
   ```

If you found **zero** issues, the changelog is still produced with `## Status: No changes required` and a brief explanation of what you verified.

## Important behaviors

**Verify, don't assume.** A draft from `vn-legal-research` was already careful, but the upstream skill can still hallucinate citations under time pressure. Always re-verify at least the **Căn cứ pháp lý** list against actual web sources.

**Cite your verification sources.** When you confirm a citation by reading a TVPL page, paste the URL into the changelog. The user should be able to click through to your evidence.

**Be conservative on style.** A luật sư rereads their own draft and sees ten ways to improve every sentence. Don't do that — make changes that matter, leave the rest. Drafting style is the original author's.

**Flag rather than fabricate.** If a citation can't be verified after a real search attempt, mark it `[KHÔNG XÁC THỰC ĐƯỢC — vui lòng kiểm tra trên thuvienphapluat.vn]` in the doc and explain in the changelog. Do not silently swap to a citation you "think" is right.

**Don't edit `Định hướng` lightly.** That section reflects the original author's legal analysis. Only intervene if the analysis itself is wrong (cited wrong governing law, missed a material condition). Stylistic preferences are not enough reason.

## Files in this skill

- `references/common-issues.md` — checklist of recurring issues by procedure type (business formation, civil status, real estate, immigration) with sample fixes
