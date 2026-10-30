"""Background removal for player photos (avatar and full-body).

Reads an image on stdin and writes a transparent PNG on stdout. The backend starts one process per
photo and keeps at most one running, so nothing stays in memory between uploads.
Same library the anylearn sticker artwork was cut out with (rembg); the model is chosen for people.
"""
import io
import os
import sys

import onnxruntime as ort
from PIL import Image


class _LeanOptions(ort.SessionOptions):
    """Session options without the memory arena: the process runs once per photo, so the arena only
    adds peak memory on a box shared with other apps."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enable_cpu_mem_arena = False
        self.enable_mem_pattern = False


ort.SessionOptions = _LeanOptions  # rembg builds its session options through this name

from rembg import new_session, remove  # noqa: E402  (after the patch on purpose)

MODEL = os.environ.get("REMBG_MODEL", "isnet-general-use")


def main() -> int:
    data = sys.stdin.buffer.read()
    if not data:
        print("empty input", file=sys.stderr)
        return 2
    image = Image.open(io.BytesIO(data))
    # post_process_mask smooths the jagged edge the raw mask leaves around hair and fingers
    out = remove(image, session=new_session(MODEL), post_process_mask=True)
    buf = io.BytesIO()
    out.save(buf, format="PNG", optimize=True)
    sys.stdout.buffer.write(buf.getvalue())
    return 0


if __name__ == "__main__":
    sys.exit(main())
