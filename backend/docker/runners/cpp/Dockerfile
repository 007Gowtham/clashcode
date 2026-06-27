FROM alpine:3.19

# Install g++ and build essentials
RUN apk add --no-cache g++ libc-dev

RUN adduser -D -u 1000 runner
WORKDIR /solution
RUN chown runner:runner /solution

USER runner

COPY --chown=runner:runner run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh

CMD ["/usr/local/bin/run.sh"]
