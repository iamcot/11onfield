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
echo "✓ rembg ready: $PREFIX/bin/python $PREFIX/cutout.py (model $MODEL)"
