

# 🔐 Auth Service (Multi-Tenant Ready)

A lightweight and secure authentication microservice built with **Node.js + Express + PostgreSQL (Sequelize)**.  
It supports **multiple major apps (multi-tenancy)** — meaning a single auth backend can handle user systems for many apps while keeping data completely isolated.

---

## 🚀 Overview

This service provides APIs for:
- User registration and login  
- JWT-based access and refresh tokens  
- Role-based access control (admin / user)  
- App-level user isolation (`app_id`) for multi-tenant environments  

---

## 🧠 How It Works

Each user belongs to a specific **major app** identified by an `app_id`.  
Every token carries that same `app_id`, ensuring users and admins of one app cannot access another’s data.

Example:

major_app_1  →  app_id = "app_1"
major_app_2  →  app_id = "app_2"

When a user logs in, the generated JWT includes:
```json
{
  "userId": "8dbf1a32-f22b-4f3a-9813-b0e4f613cb11",
  "role": "admin",
  "appId": "app_1",
  "iat": 1730900000,
  "exp": 1730900900
}
```

Middleware validates that every request’s `appId` matches the expected one.
If not → access is denied.

---

## 🧩 API Endpoints

| Method   | Endpoint             | Description                                      |
| -------- | -------------------- | ------------------------------------------------ |
| `POST`   | `/api/auth/register` | Register new user (requires `app_id`)            |
| `POST`   | `/api/auth/login`    | Authenticate and receive access + refresh tokens |
| `POST`   | `/api/auth/refresh`  | Renew access token using refresh token           |
| `GET`    | `/api/auth/me`       | Get current logged-in user info                  |
| `GET`    | `/api/users`         | (Admin only) List all users of the same app      |
| `DELETE` | `/api/users/:id`     | (Admin only) Delete a user from same app         |

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
                            +----------------------+
                                   ▲
                                   │
                                   └── Isolated by app_id
```

---

## 🧾 Notes

* Each **major app** must include its `app_id` in requests.
* The Auth Service enforces **data isolation** based on that `app_id`.
* Same codebase can handle infinite apps securely.

---

### 💬 Example Use-Case

> Both `major_app_1` and `major_app_2` use the same Auth backend.
> `admin_app_1` cannot view or control users of `major_app_2` because every request is verified by its unique `app_id`.

---

**Made with ⚡ by Harsh Raithatha (Commando)**
*Secure. Scalable. Smart.*

```


