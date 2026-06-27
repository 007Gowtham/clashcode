FROM python:3.12-slim

# Security: run as non-root
RUN useradd -m -u 1000 runner
WORKDIR /solution
RUN mkdir -p /solution && chown runner:runner /solution

# Drop to non-root
USER runner

# run.sh is baked into the image
COPY --chown=runner:runner run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh

# stdin is connected by `docker run -i`
CMD ["/usr/local/bin/run.sh"]
