FROM node:24.18.0-trixie-slim
LABEL org.opencontainers.image.authors="merjembajramovic8@gmail.com"

ENV NODE_ENV=production

WORKDIR /app
COPY .yarnrc.yml README.md package.json yarn.lock /app/
COPY src /app/src
RUN corepack enable && \
  corepack prepare --activate && \
  yarn workspaces focus --all --production && \
  npm install -g .

USER 1000
EXPOSE 8081
CMD ["thesis-backend"]
