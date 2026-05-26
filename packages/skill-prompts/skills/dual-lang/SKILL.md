---
name: vn-legal-dual-lang
description: |
  Use when the output must contain BOTH Vietnamese and English in the same document — every
  Vietnamese paragraph followed immediately by its English translation (the "V,E interleaved
  format"). Output filename ends with -V,E.docx.

  Trigger whenever the user wants to:
  - Make a "V,E version" or "dual language" / "bilingual" copy of a Vietnamese legal document
  - Add English alongside existing Vietnamese text for a foreign partner or client
  - Produce a "bản song ngữ", "file song ngữ", "2 ngôn ngữ", or "V,E" document
  - Prepare a Vietnamese legal file so an international client (Korean, Japanese, Singaporean,
    Australian, etc.) can read both languages side by side
  - Uses phrases like "thêm tiếng Anh", "dịch song song", "tạo file V,E", "interleave"

  Covers: legal service letters, client introduction letters, contracts, advisories, corporate filings.

  Do NOT trigger for: pure translation (VI→EN or EN→VI only — use vn-legal-translate instead),
  reviewing documents, legal research, or creating documents from scratch.
---

# vn-legal-dual-lang — Dual-Language (VI+EN) Legal Document Builder

## What this skill produces

A `.docx` file where every Vietnamese paragraph is immediately followed by its English
translation — so a Vietnamese lawyer and a foreign client can both read the same document.

**Output format**: interleaved paragraphs (VI → EN → VI → EN …). Table cells have both
languages combined within the same cell. File is saved with a `-V,E.docx` suffix.

**This is not a pure translation** — the Vietnamese text stays intact. The English is
inserted alongside, paragraph by paragraph.

---

## Step 0 — Identify inputs and output path

1. **Source file**: the Vietnamese `.docx` (check `refs/` if not specified)
2. **Output path**: derive from the input following this pattern:
   - Strip the date and description, append `-V,E.docx`
   - Example: `LS Law Firm-2026-05-15-Thu chao moi dich vu phap ly.docx`
     → `outputs/LS Law Firm-2026-05-15-Thu chao moi dich vu phap ly-V,E.docx`
   - If the user provides an explicit output path, use it exactly
3. **Document type**: identify what kind of document this is (service letter, contract, advisory, etc.) — it shapes translation choices

---

## Step 1 — Load the terminology glossary

Read `references/legal-terms-glossary.md` from the **vn-legal-translate** skill before translating:

```
.claude/skills/vn-legal-translate/references/legal-terms-glossary.md
```

The dual-language format shares the same translation standards as the pure translation skill.
Do not start translating without reading the glossary — inconsistent legal terminology is the
most common quality problem in bilingual documents.

---

## Step 2 — Extract text segments

Run the extraction step to get all translatable segments as a JSON list:

```bash
python3 .claude/skills/vn-legal-dual-lang/scripts/dual_lang_docx.py \
  "<input.docx>" --extract-only > /tmp/segments.json
```

Review the segment list. Each segment is a paragraph (body or inside a table cell) with
its original Vietnamese text. Note which segments:
- Are already in English (header taglines, URLs, international abbreviations) — skip these
- Are contact details (email, phone, address) — translate the labels, keep the values
- Are pure Vietnamese legal content — translate fully

---

## Step 3 — Translate each segment to English

Build a translation map: a JSON object mapping each Vietnamese original to its English translation.

```json
{
  "Kính gửi: Quý Khách hàng": "Dear Clients,",
  "Trân trọng./.": "Best regards./.",
  ...
}
```

### Translation rules (same as vn-legal-translate)

**Legal terminology**: use standardized equivalents from the glossary — never improvise.

**Segments to skip** (omit from the map, or keep original = no EN paragraph inserted):
- Segments that are already in English (e.g., logo text, international acronyms)
- Person names and firm names (keep as-is)

**Date format**: `TP. Hồ Chí Minh, ngày … tháng … năm 2026`
→ `Ho Chi Minh City, [Month] [Day], [Year]`

**Salutations**:
- `Kính gửi: Quý Khách hàng` → `Dear Clients,`
- `Trân trọng./.` → `Best regards./.`

**Contact details**: translate the label, keep the value unchanged
- `Điện thoại: 0908 192 615 hoặc 0909 896 807` → `Phone: 0908 192 615 or 0909 896 807`
- `Email: a@b.com hoặc c@d.com` → `Email: a@b.com or c@d.com`

**Service bullet points**: translate the bold lead term, keep the detail clause structure
- `Sở hữu trí tuệ: Tra cứu…` → `Intellectual Property: Search for…`

**Formal register**: use "the Company", "the Client", "shall", "herein" for formal correspondence.
Use "we", "our", "you" for service/introduction letters.

**Signature block (table cells)**:
- `ĐẠI DIỆN` → `REPRESENTATIVE OF`
- `Luật sư điều hành (CEO)` → `Executive Attorney (CEO)`
- Leave the person's name and firm name unchanged

Save the translation map to `/tmp/translation_map.json`.

---

## Step 4 — Build the dual-language .docx

Run the builder script with the translation map:

```bash
python3 .claude/skills/vn-legal-dual-lang/scripts/dual_lang_docx.py \
  "<input.docx>" \
  --translation-map /tmp/translation_map.json \
  --output "<output-V,E.docx>"
```

The script inserts an English paragraph immediately after each Vietnamese paragraph that
has a translation. Paragraphs with no entry in the map remain in Vietnamese only (correct
for items like logo text or already-English content).

**English paragraph formatting**: the script automatically applies **italic + blue** (`#2E75B6`)
to every inserted EN paragraph, matching the LS Law Firm bilingual template style. Font name
and size are inherited from the corresponding VI paragraph. You do not need to set formatting
manually — the script handles it.

---

## Step 5 — Verify the output

After running the script, confirm:

1. **Interleaving is correct**: open the output and check that every body paragraph has a
   Vietnamese version followed immediately by an English version. If any VI paragraph has
   no EN counterpart, check whether it was missing from the translation map or intentionally skipped.

2. **EN formatting**: English paragraphs should be italic and blue — if they appear in the
   same style as Vietnamese text, the script was not used (check the transcript).

3. **Table cells**: signature and header table cells should have both language versions combined.

4. **Terminology consistency**: scan for the same Vietnamese term appearing with two different
   English renderings. Normalize.

5. **File naming**: confirm the output filename ends with `-V,E.docx` and is saved in `outputs/`.

---

## Output

- Save to `outputs/` unless the user specifies otherwise
- Filename convention: `<firm>-<date>-<short-desc>-V,E.docx`
- After saving, tell the user the full output path and note any segments that had no translation

---

## Files in this skill

- `scripts/dual_lang_docx.py` — extracts segments and builds the interleaved bilingual .docx
- Uses `vn-legal-translate/references/legal-terms-glossary.md` for terminology (shared resource)
