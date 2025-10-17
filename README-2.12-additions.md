## ER диаграмма

```mermaid
erDiagram
  User {
    int id PK
    string username UK
    string displayName
    string role  "ADMIN|HEAD|EMPLOYEE"
    int departmentId FK
    int managerId "nullable"
    string passwordHash
    datetime createdAt
  }

  Department {
    int id PK
    string name UK
    datetime createdAt
  }

  Chat {
    int id PK
    string type  "DM|GROUP"
    string name
    int departmentId "nullable, FK"
    string systemKey "nullable, UK"
    datetime createdAt
  }

  ChatMember {
    int chatId PK,FK
    int userId PK,FK
    datetime createdAt
  }

  Message {
    int id PK
    int chatId FK
    int senderId FK
    string content
    datetime createdAt
  }

  AuditLog {
    int id PK
    int actorId FK
    string action
    string resource "например dm:send"
    int targetId "nullable"
    string outcome "allow|deny"
    string reason "nullable"
    datetime createdAt
  }

  Department ||--o{ User : "has users"
  User ||--o{ ChatMember : "is member of"
  Chat ||--o{ ChatMember : "has members"
  Chat ||--o{ Message : "has messages"
  User ||--o{ Message : "sends"
  User ||--o{ AuditLog : "acts"
  Department ||--o{ Chat : "has group chat"
  User ||--o| User : "managerId (optional)"
```

## Демо

Короткий GIF с основными сценариями: логин, отправка сообщения, попытка запрещенного ЛС.

![Demo GIF](docs/demo.gif)

### Как записать свой GIF поверх заглушки
1. Подними приложение локально.
2. Открой браузер, зайди в `/login` под `admin1/admin123`.
3. Используй любой экранный рекордер GIF. Рекомендации: ScreenToGif (Windows), Kap (macOS), Peek (Linux).
4. Сохрани в `docs/demo.gif` и закоммить изменения.