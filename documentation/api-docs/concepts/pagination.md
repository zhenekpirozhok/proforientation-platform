# Pagination

The ProfOrientation API uses **offset-based pagination**
for endpoints that return collections of resources.

Pagination follows Spring Data conventions to ensure
predictable performance and consistent API behavior.

---

## 1. Pagination Parameters

Paginated endpoints accept the following query parameters:

| Parameter | Type    | Description                              |
|-----------|---------|------------------------------------------|
| `page`    | integer | Zero-based page index (default: `0`)     |
| `size`    | integer | Number of items per page (default: `20`) |
| `sort`    | string  | Sorting criteria                         |

### Example Request

GET /questions/quiz/5?page=0&size=10&sort=ord,asc

---

## 2. Paginated Response Format

Paginated responses use the Spring Data `Page<T>` structure.

### Example Response

```json
{
  "content": [
    {
      "id": 1,
      "text": "Example question"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 42,
  "totalPages": 5,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false
}
```

## 3. Sorting
Sorting is defined using the sort query parameter:

```ini
sort=<field>,<direction>
```

Examples:

- sort=id,asc
- sort=ord,desc

Multiple sort fields are supported:

```bash
sort=ord,asc&sort=id,desc
```

## 4. Default Behavior
If pagination parameters are omitted:

- page = 0
- size = 20
- Default sorting defined by the endpoint

## 5. Design Rationale
Pagination is used to:

- Prevent large payloads
- Improve response time
- Enable scalable database queries
- Support frontend infinite scrolling and paging patterns