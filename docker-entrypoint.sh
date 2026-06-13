#!/bin/sh
set -eu

UPLOAD_DIR="/app/public/uploads"

can_write_as_nodejs() {
  su-exec nodejs sh -c "test -w '$UPLOAD_DIR' && touch '$UPLOAD_DIR/.write-test' && rm -f '$UPLOAD_DIR/.write-test'" >/dev/null 2>&1
}

can_write_as_current_user() {
  test -w "$UPLOAD_DIR" && touch "$UPLOAD_DIR/.write-test" && rm -f "$UPLOAD_DIR/.write-test"
}

mkdir -p /app/public/uploads

if ! chown -R nodejs:nodejs "$UPLOAD_DIR" >/dev/null 2>&1; then
  echo "Warning: unable to chown $UPLOAD_DIR; continuing with current mounted permissions." >&2
fi

if ! chmod -R u+rwX,g+rwX "$UPLOAD_DIR" >/dev/null 2>&1; then
  echo "Warning: unable to chmod $UPLOAD_DIR; continuing with current mounted permissions." >&2
fi

if can_write_as_nodejs; then
  exec su-exec nodejs "$@"
fi

echo "Warning: nodejs user cannot write $UPLOAD_DIR; running as root so uploads can continue." >&2

if can_write_as_current_user; then
  exec "$@"
fi

echo "Error: $UPLOAD_DIR is not writable by the container. Fix the host volume permissions in 1Panel." >&2
exit 1
