#!/usr/bin/env bash
# Installs rembg once in /opt/rembg (venv + model). Safe to run again: it does nothing when the
# installed version and the script are already current. Run by the production deploy, or by hand:
#   sudo bash deployment/rembg/install.sh
set -euo pipefail

PREFIX=/opt/rembg
# a range, because each rembg release supports only some Python versions (Ubuntu 22.04 = 3.10, 24.04 = 3.12)
SPEC="rembg[cpu]>=2.0.59,<2.1"
MODEL=isnet-general-use
HERE="$(cd "$(dirname "$0")" && pwd)"

if ! python3 -c 'import venv, ensurepip' 2>/dev/null; then
  sudo apt-get update -y && sudo apt-get install -y python3-venv
fi

if [ ! -x "$PREFIX/bin/python" ] || [ "$(cat "$PREFIX/SPEC" 2>/dev/null)" != "$SPEC" ]; then
  echo "Installing $SPEC into $PREFIX..."
  sudo mkdir -p "$PREFIX"
  sudo python3 -m venv "$PREFIX"
  sudo "$PREFIX/bin/pip" install --no-cache-dir --upgrade pip
  sudo "$PREFIX/bin/pip" install --no-cache-dir "$SPEC"
  echo "$SPEC" | sudo tee "$PREFIX/SPEC" >/dev/null
fi

sudo cp "$HERE/cutout.py" "$PREFIX/cutout.py"

# download the model ahead, so the first upload does not wait for it (the backend cannot write to /opt)
sudo mkdir -p "$PREFIX/models"
if [ -z "$(sudo find "$PREFIX/models" -name "$MODEL.onnx" -print -quit)" ]; then
  echo "Downloading model $MODEL..."
  sudo U2NET_HOME="$PREFIX/models" "$PREFIX/bin/python" -c "from rembg import new_session; new_session('$MODEL')"
fi
sudo chmod -R a+rX "$PREFIX"

# numba cache for pymatting, writable by the backend's user (11of-backend.service lists it in ReadWritePaths) and
# warmed once here, so the first photo after a deploy does not spend ~40 s compiling
APP_USER=11of-app
sudo mkdir -p "$PREFIX/numba-cache"
if id "$APP_USER" >/dev/null 2>&1; then
  sudo chown -R "$APP_USER" "$PREFIX/numba-cache"
  if [ -z "$(sudo find "$PREFIX/numba-cache" -name '*.nbi' -print -quit)" ]; then
    echo "Warming the numba cache..."
    sudo -u "$APP_USER" U2NET_HOME="$PREFIX/models" "$PREFIX/bin/python" -c \
      "import io, sys; from PIL import Image; b = io.BytesIO(); Image.new('RGB', (64, 64), 'white').save(b, 'PNG'); sys.stdout.buffer.write(b.getvalue())" \
      | sudo -u "$APP_USER" U2NET_HOME="$PREFIX/models" "$PREFIX/bin/python" "$PREFIX/cutout.py" >/dev/null
  fi
else
  sudo chmod 1777 "$PREFIX/numba-cache"
fi
echo "✓ rembg ready: $PREFIX/bin/python $PREFIX/cutout.py (model $MODEL)"
