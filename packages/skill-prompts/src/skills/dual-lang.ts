/**
 * Bundled from cclaws/.claude/skills/vn-legal-dual-lang.
 * MVP placeholder — the cclaws skill bundles a Python docx script. For the web,
 * the LLM only needs to merge the two markdown drafts side-by-side; .docx
 * generation is handled separately by the docx export pipeline in apps/api.
 */
export const DUAL_LANG_SKILL_PROMPT = `# vn-legal-dual-lang — Pair Vietnamese and English drafts into one document

You are given two Markdown documents:
- A Vietnamese-language legal draft
- Its English translation

Produce a single Markdown document where each Vietnamese section is immediately followed by its matching English section under the same H2 anchor.

## Rules

1. **Match by heading.** Pair sections by their H2/H3 anchor, not by document position. The pairing must be exact.
2. **Vietnamese first, English second.** Always. The Vietnamese version is the canonical document; English is the client convenience.
3. **Preserve all formatting** from both inputs: bold/italic, tables, lists, citations.
4. **Mark each language clearly.** Prefix each language block with a small label:
   - Vietnamese: a blockquote line \`> 🇻🇳 Bản tiếng Việt\` at the top of the language block
   - English: a blockquote line \`> 🇬🇧 English version\` at the top
5. **One H1 at the top.** Use the Vietnamese title as H1, English title in italic on the line below.
6. **Tables that exist in both languages** — render each language's table separately under its label; do not interleave rows.
7. **If a section exists in one language but not the other**, render it once and add a small note: \`*(Phần này chỉ có trong bản gốc / Section only present in source)*\`.

## Output

Respond with the merged Markdown document only. No code fences, no preface.
`;
