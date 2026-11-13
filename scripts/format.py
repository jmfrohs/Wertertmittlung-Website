#!/usr/bin/env python3

# MIT License
#
# Copyright (c) 2026 Your Author Name
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.


import os
import sys
import re
from datetime import datetime

CURRENT_YEAR = datetime.now().year
AUTHOR = "jmfrohs"

MIT_LICENSE_JS_CSS = f"""/*
MIT License

Copyright (c) {CURRENT_YEAR} {AUTHOR}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/"""

MIT_LICENSE_HTML = f"""<!--
MIT License

Copyright (c) {CURRENT_YEAR} {AUTHOR}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-->"""

DIRS_TO_SCAN = ["src", "tests-src", "tests-src-old", "scripts", "server"]
FILE_EXTENSIONS = (".js", ".html", ".css")
IGNORED_DIRS = {
    ".git",
    ".github",
    "node_modules",
    ".vscode",
    ".qodo",
    ".husky",
    ".media",
}

stats = {
    "total": 0,
    "added": 0,
    "updated": 0,
    "skipped": 0,
    "errors": 0,
}

colors = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "error": "\033[31m",
    "added": "\033[32m",
    "updated": "\033[33m",
    "skipped": "\033[90m",
    "cyan": "\033[36m",
    "orange": "\033[38;2;255;165;0m",
    "jsYellow": "\033[33m",
    "cssBlue": "\033[94m",
}

def find_files_recursive(directory, extensions=FILE_EXTENSIONS):
    files = []
    try:
        entries = list(os.scandir(directory))
    except OSError:
        return files

    for entry in entries:
        full_path = os.path.join(directory, entry.name)
        if entry.is_dir(follow_symlinks=False):
            if entry.name not in IGNORED_DIRS:
                files.extend(find_files_recursive(full_path, extensions))
        elif entry.name.endswith(extensions):
            files.append(full_path)

    return files

def has_license_header(content):
    content_without_shebang = re.sub(r"^#!.*\n", "", content).lstrip()
    return (
        (content_without_shebang.startswith("/*") or content_without_shebang.startswith("<!--"))
        and "MIT License" in content_without_shebang[:1000]
    )

def extract_license_and_body(content):
    has_shebang = content.startswith("#!")
    shebang = ""
    rest = content

    if has_shebang:
        first_newline = content.find("\n")
        if first_newline != -1:
            shebang = content[: first_newline + 1]
            rest = content[first_newline + 1 :]

    trimmed_rest = rest.lstrip()

    if trimmed_rest.startswith("/*") and "MIT License" in trimmed_rest[:1000]:
        end_idx = trimmed_rest.find("*/")
        if end_idx != -1:
            license_text = trimmed_rest[: end_idx + 2]
            body = trimmed_rest[end_idx + 2 :]
            return shebang, license_text, body, True

    elif trimmed_rest.startswith("<!--") and "MIT License" in trimmed_rest[:1000]:
        end_idx = trimmed_rest.find("-->")
        if end_idx != -1:
            license_text = trimmed_rest[: end_idx + 3]
            body = trimmed_rest[end_idx + 3 :]
            return shebang, license_text, body, True

    return shebang, "", rest, False

def remove_comments(code):
    pattern = re.compile(
        r'("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`)'
        r'|(//[^\n\r]*)'
        r'|(/\*[^\n\r]*?\*/)'
        r'|(<!--[^\n\r]*?-->)',
        re.DOTALL
    )

    def replacer(match):
        string_literal = match.group(1)
        if string_literal:
            return string_literal
        return ""

    return pattern.sub(replacer, code)

def process_file(file_path):
    stats["total"] += 1

    if file_path.endswith("format.js") or file_path.endswith("format.py"):
        stats["skipped"] += 1
        return f"{colors['skipped']}skipped{colors['reset']}"

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            original_content = f.read()

        shebang, _, body, had_license = extract_license_and_body(original_content)

        is_html = file_path.endswith(".html")
        is_js_or_css = file_path.endswith(".js") or file_path.endswith(".css")
        target_license = MIT_LICENSE_HTML if is_html else MIT_LICENSE_JS_CSS

        processed_body = body

        if is_js_or_css or is_html:
            # processed_body = remove_comments(processed_body)
            processed_body = "\n".join(line.rstrip() for line in processed_body.split("\n"))
            processed_body = re.sub(r"\n{3,}", "\n\n", processed_body)

        clean_body = processed_body.lstrip()

        if len(clean_body) > 0:
            final_content = f"{shebang}{target_license}\n\n{clean_body}"
        else:
            final_content = f"{shebang}{target_license}\n"

        raw_status = "skipped"

        if not had_license:
            raw_status = "added"
        elif final_content != original_content:
            raw_status = "updated"

        if raw_status != "skipped":
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(final_content)

        stats[raw_status] += 1

        if raw_status == "added":
            return f"{colors['added']}added{colors['reset']}"
        elif raw_status == "updated":
            return f"{colors['updated']}updated{colors['reset']}"
        return f"{colors['skipped']}skipped{colors['reset']}"

    except Exception as err:
        print(f"Error processing {file_path}: {err}", file=sys.stderr)
        stats["errors"] += 1
        return f"{colors['error']}error{colors['reset']}"

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cli_args = [arg for arg in sys.argv[1:] if arg]
    quiet = "--quiet" in cli_args
    cli_dirs = [arg for arg in cli_args if arg != "--quiet"]
    dirs_to_scan = cli_dirs if len(cli_dirs) > 0 else DIRS_TO_SCAN

    if os.path.exists(os.path.join(base_dir, "src")) or os.path.exists(os.path.join(base_dir, "scripts")):
        project_root = base_dir
    else:
        project_root = os.path.normpath(os.path.join(base_dir, ".."))

    all_files = []
    for d in dirs_to_scan:
        full_dir = os.path.join(project_root, d)
        all_files.extend(find_files_recursive(full_dir, FILE_EXTENSIONS))

    if len(all_files) == 0:
        if not quiet:
            print(f"{colors['bold']}{colors['error']}ERROR:{colors['reset']} No files found to format.\n")
        return

    if not quiet:
        print(f"{colors['cyan']}{colors['bold']}Formatting {len(all_files)} files{colors['reset']}\n")

    for file_path in all_files:
        process_status = process_file(file_path)
        rel_path = os.path.relpath(file_path, project_root).replace("\\", "/")

        dirname = os.path.dirname(rel_path)
        filename = os.path.basename(rel_path)

        dir_prefix = f"{dirname}/" if dirname and dirname != "." else ""

        colored_filename = filename
        if file_path.endswith(".html"):
            colored_filename = f"{colors['orange']}{filename}{colors['reset']}"
        elif file_path.endswith(".js"):
            colored_filename = f"{colors['jsYellow']}{filename}{colors['reset']}"
        elif file_path.endswith(".css"):
            colored_filename = f"{colors['cssBlue']}{filename}{colors['reset']}"

        formatted_path = f"{dir_prefix}{colored_filename}"
        color_padding = len(formatted_path) - len(rel_path)
        target_width = 60 + color_padding

        if not quiet:
            print(f"{formatted_path.ljust(target_width)} ({process_status})")

    if not quiet:
        print(f"\n{colors['cyan']}Processing Results:{colors['reset']}")
        print("─" * 40)
        print(f"{colors['bold']}Total files processed:           {colors['reset']} {stats['total']}")
        print(f"* License headers added:          {colors['added']}{stats['added']}{colors['reset']}")
        print(f"* Format/license headers updated: {colors['updated']}{stats['updated']}{colors['reset']}")
        print(f"* Already formatted/licensed:     {colors['skipped']}{stats['skipped']}{colors['reset']}")
        if stats["errors"] > 0:
            print(
                f"* {colors['bold']}{colors['error']}ERRORS:{colors['reset']}                  {colors['error']}{stats['errors']}{colors['reset']}"
            )
        print("─" * 40)
        print("\n")

if __name__ == "__main__":
    main()
