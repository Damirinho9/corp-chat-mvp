
# API
База - http://localhost:3000

## Auth
- POST /api/auth/login { username, password } -> 200 { id, username, displayName, role, departmentId, managerId }, ставит httpOnly cookies access, refresh.
- POST /api/auth/refresh -> 200 { ok: true }
- POST /api/auth/logout -> 200 { ok: true }

## Users
- GET /api/users/me -> профиль текущего пользователя
- GET /api/users/search?q= -> список разрешенных адресатов ЛС

## Departments
- GET /api/departments -> список отделов
- POST /api/departments { name } -> создать отдел (только админ)

## Chats/Messages
- GET /api/chats -> список чатов пользователя
- POST /api/chats/dm { recipientId } -> получить или создать DM
- GET /api/chats/:id/messages -> сообщения в чате, членом которого является пользователь
- POST /api/messages/dm { recipientId, content } -> отправить ЛС с серверной проверкой
- POST /api/messages/chat { chatId, content } -> отправить в групповой чат, проверка членства и политики групп

## Admin
- GET /api/admin/audit -> аудит
- GET /api/admin/dms?a=&b= -> прочитать ЛС между двумя пользователями
- GET /api/admin/users -> список пользователей
- POST /api/admin/users { username, displayName, role, departmentId?, managerId?, password } -> создать пользователя
