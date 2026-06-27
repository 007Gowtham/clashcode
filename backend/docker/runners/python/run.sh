#!/bin/sh
# Universal runner entrypoint — used by all language images.
# Reads $CODE (base64-encoded source), decodes it, then compiles/runs.
# Language-specific logic is handled by each image's CMD override.
set -e

# Decode source code from base64 env var
echo "$CODE" | base64 -d > /solution/Main.py

# Execute with stdin from container's stdin
exec python3 /solution/Main.py
