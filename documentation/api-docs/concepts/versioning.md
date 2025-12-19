# API Versioning Strategy

The API uses **URI-based versioning**.

/api/v1.0

## Compatibility Rules

- Minor versions (v1.1) are backward compatible
- Major versions (v2.0) may introduce breaking changes

## Deprecation Policy

Deprecated endpoints remain available for at least one minor release cycle.

## Why URI Versioning?

- Explicit
- Easy to document
- Clear client intent