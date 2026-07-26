# Plan 003: Account deletion with two-step confirmation

## Goal

Add a UI affordance for a logged-in user to permanently delete their own account and all associated tracking data. The action must require two-step confirmation.

## Backend changes

1. **New endpoint** `DELETE /api/users/me`
   - Add `UsersController` under `server/src/users/`.
   - Protected by `JwtAuthGuard`; reads `req.user.userId`.
   - Calls `UsersService.deleteUser(userId)`.
   - `UsersService.deleteUser` runs `prisma.user.delete({ where: { id } })`.
   - The existing Prisma schema already has `onDelete: Cascade` on the `User` → `Event` relation, so all events are deleted automatically.
   - Returns `204 No Content` on success.
2. **Tests**
   - Add `users.service.spec.ts` verifying `deleteUser` calls `prisma.user.delete` with the correct id.

## Frontend changes

1. **New component** `client/src/components/DeleteAccount.jsx`
   - Two-step inline confirmation:
     1. Idle state shows a subtle red text/link: **“Delete account”**.
     2. Clicking it reveals a warning card with two buttons: a **danger “Confirm deletion”** button and a **“Cancel”** button.
   - On confirm: call `api.del('/users/me')`, then:
     - Call `logout()` from `AuthContext` (clears token/user).
     - Show a brief success message before login form reappears.
   - On error: show the error inline and return to idle state.
2. **Placement**
   - Add it near the logout button in the header (e.g., next to or below it).
   - Keep it small and unobtrusive.
3. **i18n**
   - Add keys to both `client/src/locales/en.json` and `pt.json`:
     - `account.delete`
     - `account.deleteWarning`
     - `account.confirmDelete`
     - `account.cancel`
     - `account.deleteSuccess`
     - `account.deleteError`
4. **Tests**
   - Add a minimal unit test for the two-step toggle/confirm flow using Vitest.

## Verification

- `npm test` passes.
- `npm run build` passes.
- Manual smoke test: create user → log in → track events → delete account → confirm → app returns to login → re-creating the same user yields empty data.

## Decision

Two-button confirmation (Delete → Confirm / Cancel) is sufficient; no typing required.
