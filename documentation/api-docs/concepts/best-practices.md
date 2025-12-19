# Best Practices

## Client Recommendations

- Cache GET responses
- Respect pagination
- Handle 401 by refreshing tokens
- Do not retry POST blindly

## Security

- Never store tokens in localStorage on web
- Prefer HTTP-only cookies where possible

## Performance

- Use bulk endpoints
- Avoid N+1 requests