#!/bin/bash
# Run on misc as swombat: refresh ~/souls-lifecycle/site and (re)start the container.
set -euo pipefail
cd ~/souls-lifecycle
if ! docker ps --format '{{.Names}}' | grep -qx souls-lifecycle-web; then
  docker rm -f souls-lifecycle-web 2>/dev/null || true
  docker run -d --name souls-lifecycle-web --network kamal --restart unless-stopped \
    -v ~/souls-lifecycle/site:/usr/share/nginx/html:ro \
    -v ~/souls-lifecycle/nginx.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine
  docker exec kamal-proxy kamal-proxy deploy souls-lifecycle-web --target souls-lifecycle-web:80 --host lifecycle.swombat.io --tls --health-check-path /up
fi
docker exec souls-lifecycle-web nginx -s reload
