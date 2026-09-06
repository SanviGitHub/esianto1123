# Security Specification for Anonymous ESI Survey

## 1. Data Invariants
- An anonymous survey response cannot be created with missing answers; all 5 questions (`q1`, `q2`, `q3`, `q4`, `q5`) must be present with valid option IDs.
- Submissions cannot contain arbitrary shadow/injected fields (strictly exact 7 keys).
- Timestamps must equal `request.time` to prevent client clock manipulation.
- Responses cannot be modified or deleted once created by any client.
- Voter token is bounded to 64 chars max.

## 2. The "Dirty Dozen" Threat Payloads
1. Payload with additional ghost field `isAdmin: true` -> Denied (exact key count fails).
2. Payload missing question `q5` -> Denied (hasAll check fails).
3. Payload with oversized string (500 chars in `q1`) -> Denied (size limit fails).
4. Payload with invalid characters in document ID -> Denied (`isValidId` fails).
5. Attempt to overwrite (`update`) an existing survey answer -> Denied (update is false).
6. Attempt to delete (`delete`) an existing survey answer -> Denied (delete is false).
7. Spoofed past timestamp -> Denied (`createdAt == request.time` fails).
8. Non-string option ID (e.g. integer or array) -> Denied (type validation fails).
9. Null voter token -> Denied (`voterToken is string` fails).
10. Empty document ID -> Denied (`isValidId` fails).
11. Array injection into response fields -> Denied (type validation fails).
12. Attempt to write to arbitrary unspecified collection `/admin_settings` -> Denied (default catch-all deny).
