#!/bin/bash
# Free disk space on the deploy server. Other apps share this machine, so it only
# deletes 11of release/artifact leftovers plus system caches that rebuild themselves.
#   bash cleanup-disk.sh        -> only report what takes space
#   bash cleanup-disk.sh --yes  -> also delete the safe-to-remove items
set -u

DEPLOY_PATH="/opt/11of"
KEEP_RELEASES=3
APPLY=false
[ "${1:-}" = "--yes" ] && APPLY=true

echo "== Disk usage"
df -h /
echo
echo "== Biggest folders"
sudo du -xh --max-depth=2 / 2>/dev/null | sort -rh | head -20
echo
for p in /tmp/artifacts "$DEPLOY_PATH"/backend/releases "$DEPLOY_PATH"/frontend/releases \
         /var/log/journal ~/.npm ~/.m2/repository ~/actions-runner/_work ~/actions-runner/_diag; do
  [ -e "$p" ] && sudo du -sh "$p" 2>/dev/null
done
command -v docker >/dev/null && sudo docker system df

if ! $APPLY; then
  echo
  echo "Nothing deleted. Run again with --yes to clean up."
  exit 0
fi

echo
echo "== Cleaning"
sudo rm -rf /tmp/artifacts
for d in "$DEPLOY_PATH"/backend/releases "$DEPLOY_PATH"/frontend/releases; do
  [ -d "$d" ] || continue
  current=$(readlink -f "$(dirname "$d")/current" || true)
  ls -1dt "$d"/*/ 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | while read -r r; do
    [ "$(readlink -f "$r")" = "$current" ] && continue
    echo "remove $r"
    sudo rm -rf "$r"
  done
done
sudo journalctl --vacuum-size=200M
npm cache clean --force 2>/dev/null || true
command -v apt-get >/dev/null && sudo apt-get clean
for diag in ~/actions-runner/_diag /home/*/actions-runner/_diag; do
  [ -d "$diag" ] && sudo find "$diag" -name '*.log' -mtime +7 -delete
done

echo
df -h /
