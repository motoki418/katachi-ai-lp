#!/usr/bin/env python3
"""Verify sitemap pages against actual static build output; never publish files."""
import argparse
import hashlib
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET


def verify(root, output):
    root, output = root.resolve(), output.resolve()
    tree = ET.parse(root / "sitemap.xml")
    locations = [n.text for n in tree.findall("{*}url/{*}loc")]
    if not locations or len(set(locations)) != len(locations):
        raise ValueError("sitemap must contain unique URLs")
    checked = []
    for loc in locations:
        u = urlsplit(loc or "")
        path = unquote(u.path)
        if u.scheme != "https" or u.netloc != "katachi-ai.com" or u.query or u.fragment:
            raise ValueError("unexpected sitemap origin or query")
        if "\\" in path or "\0" in path or any(p in (".", "..") for p in path.split("/")):
            raise ValueError("unsafe sitemap path")
        relative = path.lstrip("/")
        candidates = ([relative + "index.html"] if path.endswith("/")
                      else [relative] if relative.endswith(".html")
                      else [relative + ".html", relative + "/index.html"])
        matches = [p for p in candidates if (root / p).is_file()]
        if len(matches) != 1:
            raise ValueError("missing or ambiguous source for " + path)
        rel = matches[0]
        source, built = (root / rel).resolve(), (output / rel).resolve()
        if not source.is_relative_to(root) or not built.is_relative_to(output):
            raise ValueError("page escapes its root")
        if not built.is_file():
            raise ValueError("build omitted sitemap page: " + rel)
        if hashlib.sha256(source.read_bytes()).digest() != hashlib.sha256(built.read_bytes()).digest():
            raise ValueError("build content differs: " + rel)
        checked.append(rel)
    if (output / "sitemap.xml").read_bytes() != (root / "sitemap.xml").read_bytes():
        raise ValueError("built sitemap differs")
    return checked


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        checked = verify(args.root, args.output or args.root / "dist")
    except (OSError, ValueError, ET.ParseError):
        print("FAIL: build output does not match sitemap/source pages")
        return 1
    print("OK: build output verified for {} sitemap pages".format(len(checked)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
