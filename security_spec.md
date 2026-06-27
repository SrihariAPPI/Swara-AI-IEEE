# Security Specification for Swara Firestore

## 1. Data Invariants
- `userSettings`: Each user can only have one document representing their settings, matching their `uid`.
- `messages`: Every message must have a `userId` that matches the authenticated user's `uid`.
- `timestamps`: `createdAt` and `updatedAt` must be set to `request.time`.

## 2. The "Dirty Dozen" Payloads
1. **Identity Theft**: Update `userSettings/some_other_uid` while being user `my_uid`.
2. **Settings Poison**: Set `selectedVoice` to a 1MB string.
3. **Ghost Messages**: Write a message with `userId: "admin_uid"` while being a standard user.
4. **Time Travel**: Manually set `createdAt` to a date in 1999.
5. **State Pollution**: Add a random field `isHidden: true` to a message.
6. **Query Scraping**: List all messages in the collection without a `where` filter (the rules should block this if query isn't restricted by data).
7. **Identity Swapping**: Create a message then update its `userId` to someone else.
8. **Invalid ID injection**: Use `../system/config` as a `messageId`.
9. **Role Escalation**: Try to add a `role: 'admin'` field to `userSettings`.
10. **Type Mismatch**: Send an Integer for the `text` field in messages.
11. **Negative Sizes**: Send an empty string or extremely long string.
12. **Anonymous Access**: Try to write data without being logged in.

## 3. The Test Runner Plan
- Verify `isOwner()` helper.
- Verify `isValidUserSettings()` schema check.
- Verify `isValidMessage()` schema check.
- Verify `affectedKeys().hasOnly()` gates for updates.
