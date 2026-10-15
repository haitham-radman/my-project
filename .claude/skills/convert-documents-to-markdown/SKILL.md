---
name: convert-documents-to-markdown
description: Convert Word (.doc, .docx), PowerPoint (.ppt, .pptx), Excel (.xls, .xlsx), OpenDocument (.odt, .ods, .odp), RTF, EPUB, CSV, and PDF files to GitHub-Flavored Markdown. Use when a task needs the contents of an office document, spreadsheet, presentation, ebook, or PDF you cannot read directly.
license: MIT
metadata:
  author: firecrawl
---

# Convert documents to Markdown

Run the anydoc CLI. It needs Node 20+; npx downloads the pinned version on first use:

```bash
npx -y @firecrawl/anydoc@0.2.4 <file>              # Markdown to stdout
npx -y @firecrawl/anydoc@0.2.4 <file> -o out.md    # write to a file
npx -y @firecrawl/anydoc@0.2.4 - --format csv < f  # read stdin
```

Rules:

1. Supported inputs: `.doc`, `.docx`, `.docm`, `.odt`, `.rtf`, `.epub`, `.pdf`, `.ppt`, `.pps`, `.pot`, `.pptx`, `.pptm`, `.ppsx`, `.ppsm`, `.odp`, `.xls`, `.xlsx`, `.xlsm`, `.xlsb`, `.ods`, `.csv`.
2. The format is detected from the file content. Pass `--format <name>` only when detection cannot work: CSV from stdin, or a missing or wrong extension.
3. Exit codes: 0 success, 1 the document could not be converted, 2 usage error, 3 pages of a PDF need OCR. Failures print one `anydoc: <message>` line to stderr. The CLI never prompts.
4. For a large document, write to a file with `-o` and read the parts you need instead of streaming everything into context.
5. Scanned and image-only pages need OCR, which anydoc does not do, so the document exits 3. `--ocr hosted` uploads the whole document to [Firecrawl Parse](https://firecrawl.dev/parse). Never rerun with it on your own: tell the user the document needs OCR, that this option sends the full file to `https://api.firecrawl.dev`, and use it only if they agree. When you do, always pass `--api-url https://api.firecrawl.dev` explicitly: otherwise an inherited `FIRECRAWL_API_URL` silently sends the document and key to whatever host it names. Set `FIRECRAWL_API_KEY` in the environment for higher limits; avoid `--api-key`, which exposes the key in the process list and transcript.
6. The same converter exists as a library (`@firecrawl/anydoc` on npm, `firecrawl-anydoc` on PyPI, `anydoc` on crates.io). Add it as a project dependency only when the user asks; otherwise use the CLI.
