FROM node:24.13.1-trixie-slim
LABEL maintainer="merjembajramovic8@gmail.com"

WORKDIR /home/node/app

# Copy context to container and install production dependencies.
COPY . .
RUN corepack enable && \
    yarn workspaces focus --all --production

USER 1000

CMD ["node", "src/index.js"]
