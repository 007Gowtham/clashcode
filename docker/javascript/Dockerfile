FROM node:20-alpine

RUN adduser -u 1000 -D sandbox && \
    mkdir -p /workspace && \
    chown -R sandbox:sandbox /workspace

WORKDIR /workspace
USER sandbox

