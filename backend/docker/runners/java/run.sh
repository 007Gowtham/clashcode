#!/bin/sh
# Java runner — decode, compile to /tmp, then run.
# Exit codes:
#   0  = success
#   2  = compilation error  (stderr contains javac output)
#   1  = runtime error      (stderr contains JVM exception)

mkdir -p /tmp/solution
echo "$CODE" | base64 -d > /tmp/solution/Main.java

# Compile — capture stderr separately
COMPILE_ERR=$(javac -d /tmp/solution /tmp/solution/Main.java 2>&1 1>/dev/null)
if [ $? -ne 0 ]; then
    echo "$COMPILE_ERR" >&2
    exit 2
fi

# Run — let runtime stderr flow naturally to the container's stderr
exec java -cp /tmp/solution Main
