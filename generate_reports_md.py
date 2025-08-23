#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Перегон JSON -> Markdown:
Ищет public/data/reports_*_restyle.json
Создаёт public/data/<stem>_md и кладёт туда <KEY>.md
где KEY — строка вида X1-Y1-Z1 из ключей JSON.

Запуск: python3 generate_reports_md.py
Опции (необязательно):
  --data-dir /путь/к/public/data
  --dry-run  (только покажет, что сделает)
"""

import argparse
import json
from pathlib import Path
import sys

EXPECTED_COUNT = 64  # ожидаем 64 комбинации X1–X4, Y1–Y4, Z1–Z4

def safe_filename(name: str) -> str:
    """
    Оставляем ровно "X1-Y1-Z1.md" и подобные.
    На всякий случай уберём недопустимые для некоторых ОС символы.
    """
    bad = '<>:"/\\|?*'
    out = "".join(c for c in name if c not in bad)
    return out.strip()

def write_markdown_files(json_path: Path, out_dir: Path, dry: bool = False) -> dict:
    with json_path.open("r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"JSON parse error in {json_path}: {e}") from e

    if not isinstance(data, dict):
        raise RuntimeError(f"Ожидался объект с парами 'ключ: текст', но в {json_path.name} {type(data)}")

    out_dir.mkdir(parents=True, exist_ok=True)

    written = 0
    for key, content in data.items():
        if not isinstance(key, str):
            raise RuntimeError(f"Ключ не строка в {json_path.name}: {key!r}")
        if not isinstance(content, str):
            raise RuntimeError(f"Значение по ключу {key!r} не строка в {json_path.name}")

        fname = safe_filename(key) + ".md"
        target = out_dir / fname

        if dry:
            print(f"[DRY] {target}")
        else:
            target.write_text(content, encoding="utf-8")
        written += 1

    return {
        "file": json_path.name,
        "written": written,
        "expected": EXPECTED_COUNT,
        "ok": (written == EXPECTED_COUNT),
        "out_dir": str(out_dir),
    }

def main():
    parser = argparse.ArgumentParser(description="Convert reports_*_restyle.json to per-key Markdown files.")
    default_data = Path(__file__).resolve().parent / "public" / "data"
    parser.add_argument("--data-dir", type=Path, default=default_data, help="Папка с JSON (по умолчанию: ./public/data)")
    parser.add_argument("--dry-run", action="store_true", help="Показать, что будет сделано, без записи на диск")
    args = parser.parse_args()

    data_dir: Path = args.data_dir
    if not data_dir.exists():
        print(f"❌ Папка {data_dir} не найдена. Укажи правильную через --data-dir.", file=sys.stderr)
        sys.exit(1)

    json_files = sorted(data_dir.glob("reports_*_restyle.json"))
    if not json_files:
        print(f"❌ В {data_dir} не найдено файлов reports_*_restyle.json", file=sys.stderr)
        sys.exit(2)

    print(f"🔎 Нашёл {len(json_files)} JSON:", *(p.name for p in json_files), sep="\n  • ")

    summaries = []
    for jf in json_files:
        stem = jf.stem  # например: reports_7_9_restyle
        out_dir = data_dir / f"{stem}_md"  # -> reports_7_9_restyle_md
        res = write_markdown_files(jf, out_dir, dry=args.dry_run)
        summaries.append(res)

    print("\n📦 Результаты:")
    all_ok = True
    for s in summaries:
        status = "✅" if s["ok"] else "⚠️"
        print(f"{status} {s['file']} → {s['out_dir']} | записано: {s['written']} (ожидалось {s['expected']})")
        all_ok = all_ok and s["ok"]

    if not all_ok:
        print("\nℹ️ Замечание: количество ключей не равно 64 хотя бы в одном файле.")
        print("   Это не ошибка скрипта, просто проверь содержание JSON (все ли комбинации X1–X4/Y1–Y4/Z1–Z4 присутствуют).")

    if args.dry_run:
        print("\n(Был запущен --dry-run: ничего не записывалось.)")

if __name__ == "__main__":
    main()