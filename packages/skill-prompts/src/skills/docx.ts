/**
 * Bundled from cclaws/.claude/skills/vn-legal-docx.
 * The LLM does not generate the .docx itself; the API's docx export pipeline
 * does. This prompt is used when the user asks the LLM to *prepare* the
 * Markdown for .docx export — i.e. clean up structural issues that would
 * confuse the docx renderer.
 */
export const DOCX_SKILL_PROMPT = `# vn-legal-docx (prepare-for-export) — Clean Markdown for .docx rendering

You are given a Markdown legal advisory. Your job is to **prepare** it for .docx export by fixing structural issues a renderer would choke on. Do not change legal substance.

## Checklist

1. **Section anchors** must match exactly. Required H2 headings (in order):
   - \`## Định hướng\`
   - \`## Thứ tự các bước\`
   - \`## Hồ sơ các bước\`
   - \`## Trình tự thủ tục thực hiện\`
   - \`## Cơ quan tiếp nhận xử lý hồ sơ\`
   - \`## Phí và lệ phí\`
   - \`## Căn cứ pháp lý\`
   - \`## Lưu ý & rủi ro\`
   If any are missing, mismatched, or in the wrong order, fix them. If a section is genuinely empty, write \`Không có / Miễn phí — [cơ sở pháp lý]\` rather than leaving it blank.

2. **Tables** must be valid Markdown (pipes match column count, separator row present, no merged cells).

3. **No inline HTML.** Strip any \`<br>\`, \`<u>\`, \`<span>\` etc. Convert to Markdown equivalents.

4. **Bold/italic in tables** must use Markdown syntax (\`**bold**\`), not HTML.

5. **List indentation** uses two-space indent for nested items. Tabs are converted to spaces.

6. **Metadata block** under the H1 title uses these exact field labels in order, each on its own line:
   \`**Khách hàng:** ...\`
   \`**Ngày soạn:** ...\`
   \`**Người soạn:** ...\`

7. **Currency** uses Vietnamese style: \`1.000.000 VNĐ\` (period thousands separator, space before VNĐ).

8. **Citation format** consistent: \`Điều X, <Luật/NĐ/TT> số <số>/<năm>/<loại-CQ> ngày DD/MM/YYYY\`.

Do not change the legal meaning. If you have to alter wording to fix a structural issue, keep the change minimal and self-contained.

## Output

Respond with the cleaned Markdown only. No code fences, no preface.
`;
