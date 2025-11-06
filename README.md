
# 🔐 Auth Service (Multi-Tenant + Token Validation Middleware Ready)

A lightweight and secure **authentication microservice** built with **Node.js + Express + PostgreSQL (Sequelize)**.  
It supports **multiple major apps (multi-tenancy)** — meaning a single auth backend can handle user systems for many apps while keeping data completely isolated.  
Additionally, it exposes a universal `/api/validate-token` endpoint for **external app servers** (clients) to validate user tokens with **per-client rate limiting**.

---

## 🚀 Overview

This service provides APIs for:
- User registration and login  
- JWT-based access and refresh tokens  
- Role-based access control (admin / user)  
- App-level user isolation (`app_id`) for multi-tenant environments  
- External `/api/validate-token` API for third-party app servers  
- Per-client rate limiting (3 validation requests/minute)

---

## 🧠 How It Works

Each user belongs to a specific **major app** identified by an `app_id`.  
Every token carries that same `app_id`, ensuring users and admins of one app cannot access another’s data.

### Example:
```

major_app_1 → app_id = "app_1"
major_app_2 → app_id = "app_2"

````

When a user logs in, the generated JWT includes:
```json
{
  "userId": "8dbf1a32-f22b-4f3a-9813-b0e4f613cb11",
  "role": "admin",
  "appId": "app_1",
  "iat": 1730900000,
  "exp": 1730900900
}
````

Middleware validates that every request’s `appId` matches the expected one.
If not → access is denied.

---

## 🧩 API Endpoints

| Method   | Endpoint              | Description                                      |
| -------- | --------------------- | ------------------------------------------------ |
| `POST`   | `/api/auth/register`  | Register new user (requires `app_id`)            |
| `POST`   | `/api/auth/login`     | Authenticate and receive access + refresh tokens |
| `POST`   | `/api/auth/refresh`   | Renew access token using refresh token           |
| `GET`    | `/api/auth/me`        | Get current logged-in user info                  |
| `GET`    | `/api/users`          | (Admin only) List all users of the same app      |
| `DELETE` | `/api/users/:id`      | (Admin only) Delete a user from same app         |
| `POST`   | `/api/validate-token` | Validate any JWT from client backends securely   |

---

## 🗄️ Database Structure

### **users**

| Column    | Type                 | Description                                  |
| --------- | -------------------- | -------------------------------------------- |
| id        | UUID                 | Primary Key                                  |
| name      | VARCHAR(100)         | User name                                    |
| email     | VARCHAR(120), unique | User email                                   |
| password  | VARCHAR(255)         | Hashed password                              |
| role      | ENUM('user','admin') | Access level                                 |
| app_id    | VARCHAR(50)          | Identifier for which app the user belongs to |
| createdAt | TIMESTAMP            | Auto                                         |
| updatedAt | TIMESTAMP            | Auto                                         |

### **refresh_tokens**

| Column    | Type      | Description          |
| --------- | --------- | -------------------- |
| id        | UUID      | Primary Key          |
| userId    | UUID      | Linked to `users.id` |
| token     | TEXT      | Refresh token        |
| expiresAt | TIMESTAMP | Expiry time          |
| createdAt | TIMESTAMP | Auto                 |

---

## ⚙️ Request Flow

**1. Register →** user created with `app_id`
**2. Login →** generates access + refresh tokens containing `app_id`
**3. Protected APIs →** middleware checks both token validity and `app_id`
**4. Refresh Token →** used to issue new short-lived access token
**5. Logout →** refresh token invalidated in database
**6. External Token Validation →** third-party apps call `/api/validate-token`

---

## 🧰 Tech Stack

| Component          | Library              |
| ------------------ | -------------------- |
| Framework          | Express.js           |
| Database           | PostgreSQL           |
| ORM                | Sequelize            |
| Authentication     | JWT (`jsonwebtoken`) |
| Password Hashing   | bcrypt               |
| Validation         | express-validator    |
| Rate Limiting      | express-rate-limit   |
| Environment Config | dotenv               |

---

## 🧱 Architecture Summary

```
+-------------------+       +----------------------+
|   major_app_1     | --->  |                      |
|   (Frontend)      |       |                      |
+-------------------+       |                      |
                            |     AUTH SERVICE     |
+-------------------+       |                      |
|   major_app_2     | --->  |   +----------------+ |
|   (Frontend)      |       |   | PostgreSQL DB  | |
+-------------------+       |   +----------------+ |
                            +----------┬-----------+
                                       │
                                       ▼
                            ┌───────────────────────┐
                            │ /api/validate-token   │
                            │  For external clients │
                            └───────────────────────┘
```

---

## 🔁 `/api/validate-token` — External Client Integration

This endpoint is used by **client app servers** (e.g., `app_23_backend`) to validate user tokens.

### **Headers**

```
x-client-id: <client_id>
x-client-secret: <client_secret>
Content-Type: application/json
```

### **Body**

```json
{
  "token": "<user_jwt_token>"
}
```

### ✅ **Success Response**

```json
{
  "valid": true,
  "userId": "u_12345",
  "appId": "app_23",
  "role": "user"
}
```

### ❌ **Error Responses**

| Status | Meaning             | Example                                                        |
| ------ | ------------------- | -------------------------------------------------------------- |
| 400    | Missing token       | `{ "message": "Missing token" }`                               |
| 401    | Invalid token       | `{ "message": "Invalid or expired token" }`                    |
| 403    | Unauthorized client | `{ "message": "Invalid client credentials" }`                  |
| 429    | Too many requests   | `{ "message": "Rate limit exceeded. Try again in 1 minute." }` |

---

## ⏳ Rate Limiting (Per Client)

Each **client_id** is limited to **3 token validations per minute**, across all their apps.

If limit exceeded:

```json
{
  "message": "Rate limit exceeded. Try again in 1 minute."
}
```

---

## 🧠 Example Middleware (in Client App)

Each client’s backend (like `app_23`) should include:

```js
import axios from "axios";

export const verifyUser = async (req, res, next) => {
  const tokenHeader = req.headers.authorization;
  if (!tokenHeader) return res.status(401).json({ message: "No token provided" });

  const token = tokenHeader.split(" ")[1];

  try {
    const { data } = await axios.post(
      "https://auth.harshraithatha.in/api/validate-token",
      { token },
      {
        headers: {
          "x-client-id": process.env.CLIENT_ID,
          "x-client-secret": process.env.CLIENT_SECRET,
        },
      }
    );

    req.userId = data.userId;
    req.appId = data.appId;
    req.role = data.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
```
---

## 💬 Example Use Case

> Both `major_app_1` and `major_app_2` use the same Auth backend.
> Their backends (or sub-apps like `app_23_backend`) can securely validate tokens using `/api/validate-token`.
> Each has separate rate limits and client credentials.

---

## 🧾 Notes

* Each **major app** must include its `app_id` in user APIs.
* Auth Service enforces strict **data isolation** via `app_id`.
* `/api/validate-token` allows safe external token validation with per-client limits.
* The same Auth backend can handle infinite apps securely.

---

### 🌍 Future Enhancements

* 🔄 Refresh token rotation with device tracking
* 🧱 Redis-backed distributed rate limiting
* 📊 Analytics dashboard per client
* 🔒 Role-based scopes per app
* ☁️ Docker + Kubernetes setup for scalability

---

**Made with ⚡ by Harsh Raithatha (Commando)**
*Secure. Scalable. Smart.*
