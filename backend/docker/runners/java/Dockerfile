FROM eclipse-temurin:21-jdk-alpine

RUN adduser -D -u 1000 runner
WORKDIR /solution
RUN chown runner:runner /solution

USER runner

COPY --chown=runner:runner run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh

# /tmp is mounted as tmpfs (rw) in SandboxService — compiler writes class files there
CMD ["/usr/local/bin/run.sh"]
