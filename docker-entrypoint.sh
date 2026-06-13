#!/bin/sh
set -eu

mkdir -p /app/public/uploads
chown -R nodejs:nodejs /app/public/uploads
chmod -R u+rwX,g+rwX /app/public/uploads

exec su-exec nodejs "$@"
