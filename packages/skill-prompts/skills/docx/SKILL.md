---
name: vn-legal-docx
description: "Convert a finalized Vietnamese legal advisory markdown file into a formatted Word docx for client delivery. Use whenever the user wants to export a reviewed legal procedure or legal advisory to Word or docx. The output follows Vietnamese legal document formatting. Do not use for researching, reviewing, or rewriting the advisory, generic non-legal markdown conversion, or PDF and spreadsheet export."
---

# vn-legal-docx — Vietnamese Legal Advisory → DOCX

## What this skill does

Run the bundled Python script to convert a Vietnamese legal advisory markdown into a styled `.docx` file ready to send to a client. The script handles parsing, formatting, tables, and Vietnamese typography.

## Prerequisite

`python-docx` must be installed. Check first:

```bash
python3 -c "import docx" 2>&1
```

If the import fails:

```bash
pip3 install python-docx
```

## Running the script

The script lives at `scripts/generate_legal_docx.py` inside this skill folder. Call it with the path to the input markdown:

```bash
python3 .claude/skills/vn-legal-docx/scripts/generate_legal_docx.py <path/to/draft.md>
```

By default the output `.docx` is written next to the input with the same basename (e.g., `thanh-lap-cong-ty.md` → `thanh-lap-cong-ty.docx`). To override the output path:

```bash
python3 .claude/skills/vn-legal-docx/scripts/generate_legal_docx.py <input.md> --output <output.docx>
```

To process a whole directory of legal advisory drafts:

```bash
python3 .claude/skills/vn-legal-docx/scripts/generate_legal_docx.py <directory> --batch
```

## Expected input format

The markdown **must** follow the structure produced by `vn-legal-research` / `vn-legal-review`. The parser anchors on these exact H2 headings:

- `## Định hướng`
- `## Thứ tự các bước`
- `## Hồ sơ các bước`
- `## Trình tự thủ tục thực hiện`
- `## Cơ quan tiếp nhận xử lý hồ sơ`
- `## Phí và lệ phí`
- `## Căn cứ pháp lý`
- `## Lưu ý & rủi ro`

Also expected:
- `# [Tên thủ tục]` as the first H1
- A metadata block (`**Khách hàng:** ...`, `**Ngày soạn:** ...`, `**Người soạn:** ...`) right under H1
- H3 sub-headings inside `Hồ sơ các bước` (one per step)
- Markdown tables under `Cơ quan tiếp nhận` and `Phí và lệ phí`

If a section is missing, the script will warn and continue (producing a partial document). If the H1 is missing, the script errors out — that's a structural failure that needs fixing in the source markdown.

## Output styling

The script enforces these conventions (matched to Vietnamese formal document norms):

| Property | Value |
|----------|-------|
| Font | Times New Roman |
| Size | 14pt (body), 16pt bold (title), 13pt bold (section headers) |
| Paper | A4 (21 × 29.7 cm) |
| Margins | Left 3cm, top/bottom/right 2cm |
| Line spacing | 1.5 |
| First-line indent | 1cm for paragraphs in `Định hướng` and `Lưu ý` |
| Tables | Grid border, header row bold, full width |
| Alignment | Title centered; body justified; tables left |

These match standard Vietnamese legal document conventions and the existing `scripts/generate_docx.py` house style in this project.

## Verifying output

After running, confirm:

```bash
ls -lh <output.docx>
```

If the user wants to open it on macOS: `open <output.docx>`.

Spot-check that:
- The H1 title is centered and bold at the top
- Tables for `Cơ quan tiếp nhận` and `Phí và lệ phí` rendered as actual tables (not raw markdown pipe characters)
- Vietnamese diacritics render correctly (no `?` or square boxes)
- The legal citation list under `Căn cứ pháp lý` is bulleted

## Important behaviors

**Don't edit the markdown content from inside this skill.** If the markdown has issues (missing sections, broken tables), report them to the user and suggest re-running `vn-legal-review`. Don't silently rewrite the input.

**Run the script — don't reimplement it.** The script is the source of truth for formatting. If formatting needs to change, edit the script and rerun, don't write a one-off conversion in your response.

**No external network.** The script is fully offline; only python-docx is needed. If install of python-docx is restricted, tell the user the exact pip command rather than trying alternative libraries.

**Filename slug.** The output `.docx` filename should be a kebab-case ASCII slug of the procedure name. If the input markdown is `tu-van-thanh-lap-tnhh.md`, the output is `tu-van-thanh-lap-tnhh.docx`. Don't try to "translate" or expand the slug.

## Files in this skill

- `scripts/generate_legal_docx.py` — the bundled converter (the real work)
- `assets/sample-input.md` — a small sample markdown showing the expected format, useful for testing the script
