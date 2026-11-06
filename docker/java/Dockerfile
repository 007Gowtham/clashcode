FROM eclipse-temurin:21-jdk-alpine

# Create non-root sandbox user
RUN adduser -u 1000 -D sandbox && \
    mkdir -p /workspace && \
    chown -R sandbox:sandbox /workspace

WORKDIR /workspace
USER sandbox

