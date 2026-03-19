from pathlib import Path
from datetime import datetime
import os


def main() -> None:
    flag_path = Path(
        os.getenv("REGISTRATION_CLOSED_FLAG_FILE", "./registration_closed.flag")
    )
    flag_path.parent.mkdir(parents=True, exist_ok=True)
    flag_path.write_text(
        f"closed_at={datetime.now().isoformat()}\n",
        encoding="utf-8",
    )
    print(f"registration closed flag created: {flag_path.resolve()}")


if __name__ == "__main__":
    main()
