#!/usr/bin/env python3
"""PostToolUse hook: validate the frontmatter of an edited .claude/skills/*/SKILL.md.

Exit 0 when the file is not a skill or is valid; exit 2 with the problems on
stderr so Claude sees them and fixes the file.
"""
import json
import re
import sys

NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MAX_NAME = 64
MAX_DESCRIPTION = 1024


def parse(block):
    try:
        import yaml
    except ImportError:
        # Fallback: top-level "key: value" lines only; block scalars count as present.
        data = {}
        for line in block.splitlines():
            m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
            if m:
                value = m.group(2).strip().strip("'\"")
                data[m.group(1)] = value if value not in ("|", ">", "|-", ">-") else "(block)"
        return data
    data = yaml.safe_load(block)
    if not isinstance(data, dict):
        raise ValueError("frontmatter is not a YAML mapping")
    return data


def check(text):
    if not text.startswith("---\n"):
        return ["file must start with a '---' frontmatter line"]
    end = text.find("\n---", 4)
    if end == -1:
        return ["frontmatter has no closing '---' line"]
    try:
        data = parse(text[4:end])
    except Exception as e:
        return [f"frontmatter is not valid YAML: {e}"]

    errors = []
    name = data.get("name")
    if not isinstance(name, str) or not name.strip():
        errors.append("'name' is missing or empty")
    elif len(name) > MAX_NAME or not NAME_RE.match(name):
        errors.append(f"'name' must be lowercase letters, digits and hyphens, at most {MAX_NAME} chars (got {name!r})")

    desc = data.get("description")
    if not isinstance(desc, str) or not desc.strip():
        errors.append("'description' is missing or empty")
    elif len(desc.strip()) > MAX_DESCRIPTION:
        errors.append(f"'description' is {len(desc.strip())} chars; keep it at most {MAX_DESCRIPTION}")
    return errors


def main():
    try:
        payload = json.load(sys.stdin)
    except ValueError:
        return 0
    path = (payload.get("tool_input") or {}).get("file_path", "")
    if not re.search(r"(^|/)\.claude/skills/[^/]+/SKILL\.md$", path):
        return 0
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
    except OSError:
        return 0
    errors = check(text)
    if not errors:
        return 0
    print(f"Invalid skill frontmatter in {path}:", file=sys.stderr)
    for e in errors:
        print(f"  - {e}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
