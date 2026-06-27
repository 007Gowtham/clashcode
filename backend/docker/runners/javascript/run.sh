#!/bin/sh
# JavaScript (Node.js) runner — decode base64 code and run with node
set -e
echo "$CODE" | base64 -d > /solution/main.js
exec node /solution/main.js
