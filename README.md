# User Behavior in Design: A Survey — Collector

## Tools Used

| Tool | Purpose |
|---|---|
| Yarn | Package management! For installing dependencies from npm and managing various life cycle tasks. |
| Express | Simple Node.js webserver. |
| Ajv / JSON Schema | JSON Schema library for Node.js, to validate for submissions, and coerce types like strings to numbers. |
| TypeScript | Avoids silly mistakes in JavaScript, as it's not strictly typed by default. |
| ALTCHA | Captcha library for flagging spam. If the challenge is not completed, we still accept and store the response, but flag it as suspicious. This is so we don't block users who keep JavaScript disabled, but can still be critical of it if we do receive spam. |

## NGINX

If running this in reverse proxy mode, NGINX must be configured to forward the original IP that made the request with `X-Forward-For`. For example:

```nginx
location /api/ {
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_pass http://192.168.000.000:8081/;
}
```

This ensures that when we store the original IP address, User-Agent, and HTTP Referer, that we get the original headers and not of the reverse proxies.
