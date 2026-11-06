FROM alpine:3.19

RUN apk add --no-cache g++ make musl-dev && \
    adduser -u 1000 -D sandbox && \
    mkdir -p /workspace && \
    chown -R sandbox:sandbox /workspace

WORKDIR /workspace
USER sandbox

