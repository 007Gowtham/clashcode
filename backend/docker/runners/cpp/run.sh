#!/bin/sh
# C++ runner — decode, compile with g++, then run.
# Exit codes:
#   0  = success
#   2  = compilation error  (stderr contains compiler output)
#   1  = runtime error      (stderr contains program crash output)

echo "$CODE" | base64 -d > /tmp/main.cpp

# Compile — capture stderr separately so it doesn't pollute stdout
COMPILE_ERR=$(g++ -O2 -o /tmp/solution /tmp/main.cpp 2>&1 1>/dev/null)
if [ $? -ne 0 ]; then
    # Print compiler errors to stderr and signal COMPILE_ERROR
    echo "$COMPILE_ERR" >&2
    exit 2
fi

# Run — let runtime stderr flow naturally to the container's stderr
exec /tmp/solution
