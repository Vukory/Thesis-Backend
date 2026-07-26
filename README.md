# User Behavior in Design: A Survey — Collector

## Tools Used

| Tool | Purpose |
|---|---|
| Yarn | Package management! For installing dependencies from npm and managing various life cycle tasks. |
| Express | Simple Node.js webserver. |
| Ajv / JSON Schema | JSON Schema library for Node.js, to validate for submissions, and coerce types like strings to numbers. |
| TypeScript | Avoids silly mistakes in JavaScript, as it's not strictly typed by default. |
| ALTCHA | Captcha library for flagging spam. If the challenge is not completed, we still accept and store the response, but flag it as suspicious. This is so we don't block users who keep JavaScript disabled, but can still be critical of it if we do receive spam. |

## Deploying

The service is deployed through a Docker image hosted on GitHub's registry. Using Docker is more portable than installing different host dependencies between environments. In a hypothetical world where the project had evolving requirements, it also makes scaling simpler.

However, in a case like this, it may be a bit excessive as Node.js is the only direct dependency anyway.

By going through a container, we get the following benefits:

- More consistent environment between development and production.
- Reduce binaries available to the Node.js process.
- Sandboxed which contains attacks in case of a vulnerability.

To run the Docker container:

```sh
mkdir -p data
docker run --init -it \
  -p 8081:8081 \
  -e VUKORY_SECRET=CHANGE_ME \
  -v ./data:/app/data \
  ghcr.io/vukory/thesis-backend:main
```

Or through Docker Compose:

**`docker-compose.yml`**
```yml
services:
  thesis-backend:
    image: ghcr.io/vukory/thesis-backend:main
    ports:
      - "8081:8081/tcp"
    restart: "unless-stopped"
    environment:
      VUKORY_SECRET: "CHANGE_ME"
    volumes:
      - ./data/:/app/data
```

⚠️ In either setup, create the `data` directory first. Otherwise, the Docker engine creates it automatically but with the wrong permissions, and it won't be writeable at runtime.

### NGINX

If running this in reverse proxy mode, NGINX must be configured to forward the original IP that made the request with `X-Forward-For`. For example:

```nginx
location /api/ {
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_pass http://192.168.0.0:8081/;
}
```

This ensures that when we store the original IP address, User-Agent, and HTTP Referer, that we get the original headers and not of the reverse proxies.
