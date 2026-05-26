#!/usr/bin/env python3
"""
Convert a finalized Vietnamese legal advisory markdown to a styled .docx.

Expected input structure (produced by vn-legal-research / vn-legal-review):
    # [Tên thủ tục]
    **Khách hàng:** ...
    **Ngày soạn:** ...
    **Người soạn:** ...

    ## Định hướng
    [paragraphs]

    ## Thứ tự các bước
    1. **Bước 1** — ...

    ## Hồ sơ các bước
    ### Bước 1: ...
    - ...

    ## Trình tự thủ tục thực hiện
    **Bước 1: ...**
    - Cách thực hiện: ...

    ## Cơ quan tiếp nhận xử lý hồ sơ
    | Bước | Cơ quan | ... |
    |------|---------|-----|
    | 1 | ... | ... |

    ## Phí và lệ phí
    | Khoản phí | Mức phí (VNĐ) | ... |
    | ...

    ## Căn cứ pháp lý
    - ...

    ## Lưu ý & rủi ro
    - ...

Usage:
    python3 generate_legal_docx.py <input.md>
    python3 generate_legal_docx.py <input.md> --output <output.docx>
    python3 generate_legal_docx.py <directory> --batch
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Iterable

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

FONT_NAME = "Times New Roman"
SIZE_BODY = Pt(14)
SIZE_TITLE = Pt(16)
SIZE_H2 = Pt(13)
SIZE_H3 = Pt(13)


# ---------- low-level helpers ----------

def _set_run_font(run, *, size=SIZE_BODY, bold=False, italic=False):
    run.font.name = FONT_NAME
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.append(rFonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rFonts.set(qn(attr), FONT_NAME)
    run.font.size = size
    run.bold = bold
    run.italic = italic


def _add_run(paragraph, text, *, size=SIZE_BODY, bold=False, italic=False):
    run = paragraph.add_run(text)
    _set_run_font(run, size=size, bold=bold, italic=italic)
    return run


def _add_runs_with_inline_bold(paragraph, text, *, size=SIZE_BODY):
    """Split on **bold** spans and emit runs."""
    parts = re.split(r"(\*\*[^*]+\*\*)", text)
    for part in parts:
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            _add_run(paragraph, part[2:-2], size=size, bold=True)
        else:
            _add_run(paragraph, part, size=size)


def _new_paragraph(
    doc,
    text="",
    *,
    bold=False,
    align=WD_ALIGN_PARAGRAPH.JUSTIFY,
    size=SIZE_BODY,
    indent_first=False,
    space_before=Pt(0),
    space_after=Pt(0),
    line_spacing=1.5,
):
    p = doc.add_paragraph()
    p.alignment = align
    fmt = p.paragraph_format
    fmt.space_before = space_before
    fmt.space_after = space_after
    fmt.line_spacing = line_spacing
    if indent_first:
        fmt.first_line_indent = Cm(1.0)
    if text:
        _add_run(p, text, size=size, bold=bold)
    return p


def _set_cell_border(cell):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        border = OxmlElement(f"w:{edge}")
        border.set(qn("w:val"), "single")
        border.set(qn("w:sz"), "4")
        border.set(qn("w:color"), "000000")
        tc_borders.append(border)
    tc_pr.append(tc_borders)


def _shade_cell(cell, fill="D9E2F3"):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


# ---------- markdown parsing ----------

# Recognised H2 sections in order. Anything outside this list is rendered as plain text.
SECTIONS = [
    "Định hướng",
    "Thứ tự các bước",
    "Hồ sơ các bước",
    "Trình tự thủ tục thực hiện",
    "Cơ quan tiếp nhận xử lý hồ sơ",
    "Phí và lệ phí",
    "Căn cứ pháp lý",
    "Lưu ý & rủi ro",
]


def parse_markdown(md_text: str) -> dict:
    """Split the markdown into title, metadata, and section bodies (keyed by section name)."""
    lines = md_text.splitlines()
    title = ""
    metadata: list[str] = []
    sections: dict[str, list[str]] = {}
    current_section: str | None = None
    seen_title = False
    seen_first_section = False

    for line in lines:
        stripped = line.strip()

        if not seen_title and stripped.startswith("# "):
            title = stripped[2:].strip()
            seen_title = True
            continue

        if stripped.startswith("## "):
            current_section = stripped[3:].strip()
            sections.setdefault(current_section, [])
            seen_first_section = True
            continue

        if current_section is None:
            # We're between the title and the first H2 — collect metadata lines
            if seen_title and stripped:
                metadata.append(stripped)
            continue

        sections[current_section].append(line)

    return {
        "title": title,
        "metadata": metadata,
        "sections": sections,
    }


def _parse_table(lines: list[str]) -> tuple[list[list[str]] | None, int]:
    """If `lines` starts with a markdown table, parse it. Returns (rows, lines_consumed)."""
    if not lines or "|" not in lines[0]:
        return None, 0
    if len(lines) < 2 or not re.match(r"^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$", lines[1]):
        # second line must be separator
        return None, 0

    rows: list[list[str]] = []
    consumed = 0
    for i, raw in enumerate(lines):
        line = raw.strip()
        if i == 1:
            # separator row
            consumed += 1
            continue
        if not line or "|" not in line:
            break
        cells = [c.strip() for c in line.strip("|").split("|")]
        rows.append(cells)
        consumed += 1
    return rows, consumed


# ---------- document setup ----------

def configure_document(doc: Document) -> None:
    style = doc.styles["Normal"]
    style.font.name = FONT_NAME
    style.font.size = SIZE_BODY

    section = doc.sections[0]
    section.page_height = Cm(29.7)
    section.page_width = Cm(21.0)
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(3.0)
    section.right_margin = Cm(2.0)


# ---------- renderers ----------

def render_title(doc: Document, title: str) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1.5
    _add_run(p, title.upper(), size=SIZE_TITLE, bold=True)


def render_metadata(doc: Document, metadata: list[str]) -> None:
    for line in metadata:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.5
        _add_runs_with_inline_bold(p, line, size=SIZE_BODY)
    if metadata:
        _new_paragraph(doc, "")


def render_section_header(doc: Document, name: str) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.5
    _add_run(p, name.upper(), size=SIZE_H2, bold=True)


def render_h3(doc: Document, text: str) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.5
    _add_run(p, text, size=SIZE_H3, bold=True, italic=True)


def render_bullet(doc: Document, text: str, *, indent_left=Cm(0.5)) -> None:
    p = doc.add_paragraph(style="List Bullet")
    fmt = p.paragraph_format
    fmt.line_spacing = 1.5
    fmt.space_after = Pt(0)
    fmt.left_indent = indent_left
    _add_runs_with_inline_bold(p, text, size=SIZE_BODY)


def render_ordered(doc: Document, text: str) -> None:
    p = doc.add_paragraph(style="List Number")
    fmt = p.paragraph_format
    fmt.line_spacing = 1.5
    fmt.space_after = Pt(0)
    fmt.left_indent = Cm(0.5)
    _add_runs_with_inline_bold(p, text, size=SIZE_BODY)


def render_paragraph(doc: Document, text: str, *, indent_first=True) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    fmt = p.paragraph_format
    fmt.line_spacing = 1.5
    fmt.space_after = Pt(0)
    if indent_first:
        fmt.first_line_indent = Cm(1.0)
    _add_runs_with_inline_bold(p, text, size=SIZE_BODY)


def render_table(doc: Document, rows: list[list[str]]) -> None:
    if not rows:
        return
    n_cols = max(len(r) for r in rows)
    # pad short rows
    rows = [r + [""] * (n_cols - len(r)) for r in rows]

    table = doc.add_table(rows=len(rows), cols=n_cols)
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = True

    for r_idx, row in enumerate(rows):
        for c_idx, cell_text in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            _set_cell_border(cell)
            if r_idx == 0:
                _shade_cell(cell)
            # clear default empty paragraph
            cell.text = ""
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.2
            _add_runs_with_inline_bold(p, cell_text, size=Pt(12))
            if r_idx == 0:
                for run in p.runs:
                    run.bold = True

    # spacing after table
    _new_paragraph(doc, "")


# ---------- section dispatch ----------

def _flush_paragraph_buffer(doc, buf: list[str], *, indent_first=True):
    if not buf:
        return
    text = " ".join(line.strip() for line in buf if line.strip())
    if text:
        render_paragraph(doc, text, indent_first=indent_first)


def render_body_lines(doc: Document, lines: list[str], *, paragraph_indent=True) -> None:
    """Generic renderer: bullets, numbered lists, tables, paragraphs."""
    i = 0
    para_buf: list[str] = []

    def flush():
        nonlocal para_buf
        _flush_paragraph_buffer(doc, para_buf, indent_first=paragraph_indent)
        para_buf = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            flush()
            i += 1
            continue

        # H3
        if stripped.startswith("### "):
            flush()
            render_h3(doc, stripped[4:].strip())
            i += 1
            continue

        # markdown table
        if "|" in stripped and i + 1 < len(lines):
            rows, consumed = _parse_table(lines[i:])
            if rows:
                flush()
                render_table(doc, rows)
                i += consumed
                continue

        # bullet
        m_bullet = re.match(r"^[-*]\s+(.*)$", stripped)
        if m_bullet:
            flush()
            render_bullet(doc, m_bullet.group(1))
            i += 1
            continue

        # ordered list
        m_num = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if m_num:
            flush()
            render_ordered(doc, m_num.group(2))
            i += 1
            continue

        # bold-leading line (e.g. "**Bước 1: ...**" — standalone)
        if stripped.startswith("**") and stripped.endswith("**") and stripped.count("**") == 2:
            flush()
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.5
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(0)
            _add_run(p, stripped.strip("*"), size=SIZE_BODY, bold=True)
            i += 1
            continue

        # plain paragraph line — buffer until blank
        para_buf.append(stripped)
        i += 1

    flush()


# ---------- main build ----------

def build_document(parsed: dict, output_path: Path) -> None:
    doc = Document()
    configure_document(doc)

    if not parsed["title"]:
        raise ValueError("Markdown is missing an H1 title (# ...).")

    render_title(doc, parsed["title"])
    render_metadata(doc, parsed["metadata"])

    rendered_sections = set()
    for section_name in SECTIONS:
        body = parsed["sections"].get(section_name)
        if body is None:
            print(f"  [warn] missing section: {section_name}", file=sys.stderr)
            continue
        render_section_header(doc, section_name)
        # `Định hướng` and `Lưu ý` benefit from first-line indent for prose feel
        indent = section_name in ("Định hướng", "Lưu ý & rủi ro")
        render_body_lines(doc, body, paragraph_indent=indent)
        rendered_sections.add(section_name)

    # Any extra sections the author added (not in our canonical list) — append at the end
    extras = [name for name in parsed["sections"] if name not in rendered_sections]
    for extra in extras:
        render_section_header(doc, extra)
        render_body_lines(doc, parsed["sections"][extra], paragraph_indent=False)

    doc.save(output_path)


# ---------- CLI ----------

def find_markdown_files(path: Path) -> list[Path]:
    if path.is_file():
        return [path]
    return sorted(p for p in path.glob("*.md"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input", type=Path, help="Path to a markdown file or directory.")
    parser.add_argument("--output", type=Path, help="Output .docx path (single-file mode).")
    parser.add_argument("--batch", action="store_true", help="Treat input as a directory; convert all .md inside.")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Input not found: {args.input}", file=sys.stderr)
        sys.exit(2)

    if args.batch or args.input.is_dir():
        if args.output:
            print("--output is ignored in --batch mode; outputs go alongside each .md file.", file=sys.stderr)
        md_files = find_markdown_files(args.input)
        if not md_files:
            print(f"No .md files found in {args.input}", file=sys.stderr)
            sys.exit(2)
    else:
        md_files = [args.input]

    for md in md_files:
        parsed = parse_markdown(md.read_text(encoding="utf-8"))
        out = args.output if (args.output and not args.batch) else md.with_suffix(".docx")
        try:
            build_document(parsed, out)
        except ValueError as exc:
            print(f"  [error] {md.name}: {exc}", file=sys.stderr)
            continue
        print(f"  ✓ {md.name} -> {out.name}")

    print(f"\nDone — {len(md_files)} file(s) processed.")


if __name__ == "__main__":
    main()
