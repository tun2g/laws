/**
 * Bundled from cclaws/.claude/skills/vn-legal-translate/SKILL.md.
 */
export const TRANSLATE_SKILL_PROMPT = `# vn-legal-translate — Vietnamese ↔ English Legal Translation

Translate a legal document between Vietnamese and English with two guarantees:
1. **Legal terminology accuracy** — every legal term rendered with its correct, jurisdiction-appropriate equivalent.
2. **Format fidelity** — preserve all headings, tables, lists, bold/italic, section numbering, spacing.

This is not word-for-word translation. The goal is a document that a Vietnamese lawyer and a foreign client can both read and rely on.

## Direction

The user message will tell you the direction (\`vi-to-en\` or \`en-to-vi\`). If ambiguous, infer from the source language and proceed.

## Translation principles

**Preserve structure, not word count.** Vietnamese may need fewer or more words than English; don't pad.

**Consistent terminology.** When a legal term appears more than once, use the same target rendering throughout. Consistency matters more than stylistic variety.

**Keep law citations in original form.** \`Nghị định 01/2021/NĐ-CP ngày 04/01/2021\` should NOT be translated — keep original. For English output, on first occurrence you may add: \`Decree No. 01/2021/ND-CP dated January 4, 2021 (on Enterprise Registration)\`.

**Keep form codes and acronyms.** \`Mẫu số 01-ĐK-TCT\`, \`CFS\`, \`DICA\`, \`C/O\`, \`EVFTA\`, \`CPTPP\` — do not translate.

**Government agency names** — use the standard English. When in doubt, translate to English and put Vietnamese in parentheses on first use.

**Formal register.**
- English contracts: \`the Company\`, \`the Client\`, \`shall\`, \`herein\`
- Vietnamese contracts: \`Bên A\`, \`Bên B\`, \`quý khách\`, \`kính gửi\`, \`trân trọng\`

**Flag untranslatable items.** If no direct equivalent exists, translate the meaning and add \`[nguyên văn: ...]\` or \`[original: ...]\`. Never guess.

## Markdown handling

- Preserve all \`#\` heading levels
- Preserve all \`**bold**\`, \`*italic*\`, \`> blockquote\` markers
- Translate cell contents in tables, never alter pipe/dash structure
- Bullet lists: translate content, preserve indentation
- Code blocks: do NOT translate; leave verbatim
- Section labels: \`Bước 1\` ↔ \`Step 1\`, \`Điều 1\` ↔ \`Article 1\`, \`Khoản 2\` ↔ \`Clause 2\`, \`Điểm a\` ↔ \`Point a\`

## Legal advisory section headings (must match exactly)

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

When translating EN→VI, the reverse applies — these headings must match character-for-character for downstream renderers.

## Post-translation check

1. **Terminology consistency** — scan for the same source term appearing with two different target renderings.
2. **Numbers and dates** — \`15.000.000 VNĐ\` ↔ \`VND 15,000,000\`. \`15/01/2026\` ↔ \`January 15, 2026\`.
3. **No leakage** — no Vietnamese words in EN→VI output and vice versa (except intentionally flagged).
4. **Table completeness** — every row and cell translated.

## Output

Respond with the translated Markdown document only. Do not wrap in code fences. Do not include preface or postscript.

If you flagged terms with \`[original: ...]\` or skipped untranslatable embedded items, append a separator line \`<<<TRANSLATION_NOTES>>>\` followed by a short bulleted list of those notes.
`;
