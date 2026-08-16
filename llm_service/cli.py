from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .core import complete_chat, complete_guidelines, complete_intents, health


def _read(path: str | None) -> dict:
    if not path or path == "-":
        return json.load(sys.stdin)
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _write(value: object, path: str | None) -> None:
    text = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    if not path or path == "-":
        sys.stdout.write(text)
    else:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        Path(path).write_text(text, encoding="utf-8")


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(prog="developer-twin-llm")
    sub = root.add_subparsers(dest="command", required=True)
    sub.add_parser("health")
    for name in ("intent", "guidelines"):
        item = sub.add_parser(name)
        item.add_argument("--input", default="-")
        item.add_argument("--output", default="-")
    chat = sub.add_parser("chat")
    chat.add_argument("message")
    chat.add_argument("--model")
    shell = sub.add_parser("shell")
    shell.add_argument("--model")
    serve = sub.add_parser("serve")
    serve.add_argument("--host", default="127.0.0.1")
    serve.add_argument("--port", type=int, default=8099)
    return root


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    if args.command == "health":
        _write(health(), "-")
    elif args.command == "intent":
        _write(complete_intents(_read(args.input)), args.output)
    elif args.command == "guidelines":
        _write(complete_guidelines(_read(args.input)), args.output)
    elif args.command == "chat":
        _write(complete_chat([{"role": "user", "content": args.message}], model=args.model), "-")
    elif args.command == "shell":
        while True:
            try:
                message = input("twin> ").strip()
            except EOFError:
                break
            if not message or message in {"exit", "quit"}:
                break
            result = complete_chat([{"role": "user", "content": message}], model=args.model)
            print(result["choices"][0]["message"]["content"])
    elif args.command == "serve":
        import uvicorn

        uvicorn.run("llm_service.app:app", host=args.host, port=args.port, reload=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
