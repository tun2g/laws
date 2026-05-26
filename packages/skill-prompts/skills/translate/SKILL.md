---
name: vn-legal-translate
description: |
  Use this skill to translate legal documents between Vietnamese and English in either direction, preserving legal terminology and document format.

  Trigger whenever the user:
  - Asks to translate (dịch / dich / chuyển) a legal document to Vietnamese or English
  - Uses mixed Vietnamese-English phrasing like "translate hợp đồng này sang English"
  - Writes Vietnamese without diacritics (e.g., "dich bien ban hop dong sang tieng anh")
  - Needs legal materials prepared for foreign business partners or international use

  Covers all legal document types: contracts, advisories, letters, regulations, corporate filings, meeting minutes.

  Do NOT trigger for: legal research, drafting new documents, reviewing existing documents, or translating non-legal content.
---

# vn-legal-translate — Vietnamese ↔ English Legal Translation

## What this skill does

Translate a legal document between Vietnamese and English with two guarantees:
1. **Legal terminology accuracy** — every legal term is rendered with its correct, jurisdiction-appropriate equivalent (not a literal or generic translation).
2. **Format fidelity** — the output document preserves all headings, tables, lists, bold/italic, section numbering, and spacing from the source.

This is not a word-for-word translation. The goal is a document that a Vietnamese lawyer and their foreign client can both read and rely on.

---

## Step 0 — Determine direction and input type

Before anything else, establish:

1. **Direction**: Vietnamese → English, or English → Vietnamese? If the user didn't specify, check the document language and ask if direction is ambiguous.
2. **Input type**: Is the source a `.docx` file, a `.md`/`.txt` file, or inline text in the conversation?
3. **Document type**: What kind of legal document is this? (advisory, contract, letter, regulatory text, court filing, etc.) This shapes terminology choices.

---

## Step 1 — Load the terminology reference

Read `references/legal-terms-glossary.md` before translating. It contains:
- A table of established Vietnamese ↔ English legal equivalents
- Rules on terms to keep in original language (law citations, form codes, international acronyms)
- Style guidance for each document type

Do not start translating without reading this file. Failing to check the glossary is the most common source of inconsistent terminology.

---

## Step 2 — Translate

### For markdown / inline text

Translate paragraph by paragraph, preserving:
- All `#` heading levels exactly as they appear
- All `**bold**`, `*italic*`, and `> blockquote` markers
- All markdown tables — translate cell contents only, never alter the pipe/dash structure
- All bullet lists — translate content, preserve indentation
- All code blocks — do NOT translate; leave verbatim
- Section numbering and step labels (e.g., "Bước 1" → "Step 1")

### For `.docx` files

Run the bundled translation script:

```bash
# Step 1: extract all text segments
python3 .claude/skills/vn-legal-translate/scripts/translate_docx.py \
  <input.docx> --direction <vi-to-en|en-to-vi> --extract-only \
  > /tmp/segments.json

# Step 2: translate segments (Claude does this) and save to translation_map.json

# Step 3: apply translations while preserving formatting
python3 .claude/skills/vn-legal-translate/scripts/translate_docx.py \
  <input.docx> --direction <vi-to-en|en-to-vi> \
  --translation-map /tmp/translation_map.json \
  --output <output.docx>
```

The script translates each paragraph and table cell in place while preserving all python-docx Run-level formatting (font name, size, bold, italic, underline, color). It cannot translate embedded images — flag those to the user after the run.

### Translation principles

**Preserve structure, not word count.** A sentence that takes 15 words in Vietnamese might need 10 in English, or vice versa. Do not pad or truncate to match length.

**Use established legal equivalents.** Check the glossary for every legal noun. When a term appears more than once, use the same English (or Vietnamese) rendering throughout — consistency matters more than stylistic variety.

**Keep law citations in original form.** Vietnamese law references like `Nghị định 01/2021/NĐ-CP ngày 04/01/2021` should NOT be translated — keep the original citation. For clarity in English documents, you may add the English title parenthetically on first occurrence: `Decree No. 01/2021/ND-CP dated January 4, 2021 (on Enterprise Registration)`.

**Keep form codes and acronyms.** "Mẫu số 01-ĐK-TCT", "CFS", "DICA", "C/O", "EVFTA", "CPTPP" — do not translate these. They are document identifiers or internationally recognized abbreviations.

**Government agency names** — use the standard English translations from the glossary. The pattern for Vietnamese agencies is: translate the function, keep "of Vietnam" or "Vietnam" if the agency commonly uses it in English communications. When in doubt, translate to the English name and provide the Vietnamese in parentheses on first use.

**For contracts and formal letters** — maintain formal register. English: use "the Company", "the Client", "shall", "herein". Vietnamese: use "Bên A", "Bên B", "quý khách", "kính gửi", "trân trọng" consistently.

**Flag untranslatable items.** If a term has no direct equivalent, translate the meaning and add `[nguyên văn: ...]` or `[original: ...]` in brackets. Never guess or substitute a different legal concept.

---

## Step 3 — Post-translation check

After completing the full translation, do one pass:

1. **Terminology consistency** — scan for the same Vietnamese term appearing with two different English renderings (or vice versa). Pick one and normalize.
2. **Numbers and dates** — Vietnamese style `15.000.000 VNĐ` should become `VND 15,000,000` in English. Dates `15/01/2026` → `January 15, 2026`. Reverse for VI output.
3. **Untranslated items** — confirm no Vietnamese words remain in an EN→VI output and vice versa (except intentionally flagged terms).
4. **Table completeness** — every table row and cell must be translated; missing cells break the document.

---

## Step 4 — Output

### File naming

| Input | Output |
|-------|--------|
| `draft.md` | `draft-en.md` or `draft-vi.md` |
| `draft.docx` | `draft-en.docx` or `draft-vi.docx` |
| `contract_EN.docx` | `contract_VI.docx` |

Save the output file in the same directory as the input unless the user specifies otherwise.

### Inline text

If the source was inline text (pasted into the conversation), return the translation inline in the conversation. Do not create a file unless the user asks.

### Notify about limits

After delivering the translation, briefly note:
- Any terms you flagged with `[original: ...]` and why
- Any embedded images in .docx that were skipped
- Any sections where you were uncertain and recommend human review

---

## Document type conventions

### Legal advisories (tư vấn pháp lý / legal advisory)

These follow the `vn-legal-research` template. Section headings translate as:

| Vietnamese | English |
|-----------|---------|
| Định hướng | Legal Overview |
| Thứ tự các bước | Procedure Steps |
| Hồ sơ các bước | Required Documents per Step |
| Trình tự thủ tục thực hiện | Execution Sequence |
| Cơ quan tiếp nhận xử lý hồ sơ | Receiving and Processing Authorities |
| Phí và lệ phí | Fees and Charges |
| Căn cứ pháp lý | Legal Basis |
| Lưu ý & rủi ro | Notes and Risks |

When translating EN→VI, the reverse applies — these headings must match character-for-character because `vn-legal-docx` uses them as anchors.

### Contracts (hợp đồng)

- Preserve article/clause numbering exactly: "Điều 1" → "Article 1", "Khoản 2" → "Clause 2", "Điểm a" → "Point a"
- Party names: "Bên A" → "Party A", "Bên B" → "Party B"
- Keep recitals section label: "RECITALS" / "PHẦN MỞ ĐẦU / CĂN CỨ"

### Service letters (thư pháp lý / legal letters)

- Salutation: "Kính gửi: Quý Doanh nghiệp" → "Dear Sir/Madam" or "To Whom It May Concern" (ask if a specific addressee name is preferred)
- Closing: "Trân trọng" → "Yours faithfully" / "Sincerely yours"; conversely, EN → VI must use "Trân trọng./" (with the period-slash — this is the standard Vietnamese formal document closing, not a comma)
- Date line format: "*[City], ngày … tháng … năm …*" → "*[City], [Month] [Day], [Year]*"

---

## Important behaviors

**Read the glossary first, every time.** Do not rely on trained knowledge for legal terms — it may be outdated or region-specific.

**One output language only.** The translated document should be entirely in the target language (except flagged originals). Do not mix languages mid-paragraph.

**Do not alter legal substance.** You are translating, not interpreting. If the source says "within 15 working days", the target must say "trong 15 ngày làm việc" — do not change to calendar days or round down.

**For .docx, use the script.** Do not manually reconstruct .docx formatting — it will lose run-level formatting. The script handles this correctly.

**When unsure about a term**, err on the side of transparency: flag it rather than guessing. A flagged term prompts human review; a wrong term causes real legal consequences.

---

## Files in this skill

- `references/legal-terms-glossary.md` — Vietnamese ↔ English legal terminology table (read before translating)
- `scripts/translate_docx.py` — format-preserving .docx translation script
