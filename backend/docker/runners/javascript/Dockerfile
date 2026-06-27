FROM node:20-alpine

# node:20-alpine already ships with a 'node' user at UID 1000 — reuse it.
WORKDIR /solution
RUN chown node:node /solution

USER node

# run.sh is baked into the image
COPY --chown=node:node run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh

# stdin is connected by `docker run -i`
CMD ["/usr/local/bin/run.sh"]
