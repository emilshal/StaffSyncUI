# StaffSync Event Contract

## Envelope

```json
{
  "version": 1,
  "requestId": "uuid",
  "actionType": "GUIDE.REQUEST",
  "actor": { "userId": "usr_123", "role": "staff" },
  "organizationId": "org_123",
  "timestamp": "2025-12-19T12:00:00.000Z",
  "payload": {},
  "meta": { "source": "web", "uiVersion": "1.0.0" }
}
```

## Rules

- `requestId` is required and should be unique per user action (used for dedupe/idempotency in Make/Airtable).
- `actionType` routes the Make scenario.
- `payload` is action-specific and must be a JSON object.
- `timestamp` is the client timestamp; Make should also store its own received time.

## Supported `actionType`s (UI)

| UI Action | actionType |
| --- | --- |
| Request a Guide | `GUIDE.REQUEST` |
| Report SOP Issue | `SOP.ISSUE_REPORT` |
| Record New SOP | `SOP.CREATE` |
| Promote/Demote User | `USER.ROLE_SET` |
| (Later) Problem Report | `PROBLEM.REPORT` |

## Payload shapes (recommended)

These are the suggested minimum fields for each `actionType`.

### `GUIDE.REQUEST`

```json
{ "text": "Close out bar shift", "categoryHint": "Food & Beverage" }
```

### `SOP.ISSUE_REPORT`

```json
{ "sopId": "recXXXX", "message": "Step 3 is missing a safety check." }
```

### `SOP.CREATE`

```json
{
  "taskName": "Close out bar shift",
  "category": "Food & Beverage",
  "sourceRequestId": "req-optional",
  "video": {
    "provider": "cloudinary",
    "url": "https://...",
    "publicId": "staffsync/sops/....",
    "durationSeconds": 123,
    "mimeType": "video/mp4",
    "originalFilename": "closeout.mp4"
  }
}
```

### `USER.ROLE_SET`

```json
{ "targetUserId": "usr_456", "role": "manager" }
```

### `PROBLEM.REPORT`

```json
{ "message": "The ice machine is leaking.", "locationName": "Kitchen", "category": "Maintenance", "mediaUrl": "https://..." }
```
