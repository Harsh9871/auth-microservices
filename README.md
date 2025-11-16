# Auth Microservice

A robust, multi-tenant authentication microservice built with Node.js, Express, PostgreSQL, and Prisma ORM. Supports multiple applications with isolated user bases, email verification, JWT tokens, and admin management.

## 🚀 Features

- **Multi-tenant Architecture** - Isolated user bases per application
- **JWT Authentication** - Secure access and refresh tokens
- **Email Verification** - OTP-based email verification system
- **Role-based Access Control** - User and admin roles
- **Admin User Management** - Paginated user lists and management
- **Token Validation** - External service token validation endpoint
- **Security** - bcrypt password hashing, CORS, rate limiting ready
- **RESTful API** - Clean, consistent API design

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Email Service**: External microservice integration
- **CORS**: Cross-origin resource sharing enabled

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/Harsh9871/auth-microservices.git
cd auth-microservices
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=4000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/auth_microservice"

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Email Microservice
MAIL_MICROSERVICE_URL=https://your-mail-service.com/api/mail
OTP_EXPIRY_MINUTES=10
APP_NAME="Your Auth Service"

# Optional: Default app for testing
DEFAULT_APP_ID=app_1
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed with default app
npx prisma db seed
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:4000`

## 🗄 Database Schema

### User Model
```prisma
model User {
  id          String    @id @default(uuid())
  name        String
  email       String
  password    String
  role        UsersRole @default(user)
  isVerified  Boolean   @default(false)
  app_id      String
  app         App       @relation(fields: [app_id], references: [app_id])
  tokens      RefreshToken[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([email, app_id])
  @@index([app_id, createdAt])
  @@index([app_id, name])
  @@index([app_id, email])
}
```

### App Model
```prisma
model App {
  id            String   @id @default(uuid())
  name          String
  app_id        String   @unique
  client_id     String   @unique
  client_secret String
  plan          AppsPlan @default(free)
  isActive      Boolean  @default(true)
  users         User[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### RefreshToken Model
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  expiresAt DateTime
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

### EmailVerification Model
```prisma
model EmailVerification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  email     String
  otp       String
  expiresAt DateTime
  attempts  Int      @default(0)
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([email])
  @@index([expiresAt])
}
```

## 📚 API Documentation

### Authentication Endpoints

#### 1. Register User
**POST** `/api/auth/register`

Register a new user with email verification.

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "app_id": "app_1",
    "role": "user"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "app_id": "app_1",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Send Verification Email
**POST** `/api/auth/send-verification`

Send OTP verification email.

```bash
curl -X POST http://localhost:4000/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

#### 3. Verify Email
**POST** `/api/auth/verify-email`

Verify email with OTP code.

```bash
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'
```

#### 4. Login
**POST** `/api/auth/login`

Authenticate user and receive tokens.

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "app_id": "app_1"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "app_id": "app_1",
    "role": "user",
    "isVerified": true
  }
}
```

#### 5. Get Current User
**GET** `/api/auth/me`

Get current user profile (requires authentication).

```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

#### 6. Validate Token
**POST** `/api/auth/validate-token`

Validate any JWT token (for external services).

```bash
curl -X POST http://localhost:4000/api/auth/validate-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<jwt_token>"
  }'
```

#### 7. Refresh Token
**POST** `/api/auth/refresh-token`

Get new access token using refresh token.

```bash
curl -X POST http://localhost:4000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh_token>"
  }'
```

#### 8. Logout
**POST** `/api/auth/logout`

Invalidate refresh token.

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh_token>"
  }'
```

### User Management Endpoints (Admin Only)

#### 1. Get All Users
**GET** `/api/users`

Get paginated list of users from same app.

```bash
curl -X GET "http://localhost:4000/api/users?page=1&limit=10&search=john" \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "app_id": "app_1",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalUsers": 1,
      "usersPerPage": 10,
      "hasNextPage": false,
      "hasPrevPage": false,
      "nextPage": null,
      "prevPage": null
    }
  }
}
```

#### 2. Delete User
**DELETE** `/api/users/:id`

Delete user from same app.

```bash
curl -X DELETE http://localhost:4000/api/users/<user_id> \
  -H "Authorization: Bearer <admin_token>"
```

## 🔐 Authentication Flow

### 1. Registration Flow
```
User Registration → Send Verification Email → Verify Email → Account Active
```

### 2. Login Flow
```
User Login → Check Email Verification → Generate Tokens → Access Protected Routes
```

### 3. Token Refresh Flow
```
Access Token Expired → Use Refresh Token → Get New Access Token → Continue
```

## 🛡 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: HS256 algorithm with configurable secrets
- **CORS Protection**: Configurable CORS policies
- **Input Validation**: Request body validation
- **Rate Limiting**: Ready for express-rate-limit integration
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Proper content-type headers

## 🏗 Project Structure

```
auth-microservices/
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   └── otp.controller.js
├── middleware/
│   └── admin.middleware.js
├── routes/
│   ├── auth.router.js
│   └── user.router.js
├── services/
│   ├── auth.service.js
│   ├── user.service.js
│   ├── otp.service.js
│   └── email.service.js
├── utils/
│   ├── jwt.util.js
│   └── hash.util.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── index.html
├── server.js
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `MAIL_MICROSERVICE_URL` | Email service endpoint | - |
| `OTP_EXPIRY_MINUTES` | OTP expiration time | `10` |
| `APP_NAME` | Application name for emails | `"Auth Service"` |

### Multi-tenancy

Each user belongs to an `app_id`. All operations are automatically scoped to the user's application context.

## 🚦 Rate Limiting

Ready for production rate limiting:

```javascript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

## 🧪 Testing

### Manual Testing

Visit `http://localhost:4000` for interactive API documentation and testing interface.

### Automated Testing

```bash
# Run tests
npm test

# Test with coverage
npm run test:coverage
```

### Example Test Data

```json
{
  "app_id": "app_1",
  "email": "test@example.com", 
  "password": "test123",
  "name": "Test User"
}
```

## 📈 Production Deployment

### 1. Environment Setup
```bash
# Set production environment
NODE_ENV=production

# Use strong JWT secret
JWT_SECRET=your-very-strong-secret-key-here

# Configure production database
DATABASE_URL=postgresql://user:pass@prod-db:5432/auth_prod
```

### 2. Security Recommendations
- Restrict CORS origins in production
- Enable HTTPS
- Use Redis for distributed rate limiting
- Implement proper logging and monitoring
- Regular security audits

### 3. Performance Optimization
- Database connection pooling
- JWT token optimization
- Caching strategies
- Load balancing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL in .env
   - Verify PostgreSQL is running
   - Ensure database exists

2. **JWT Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate token format

3. **Email Service Errors**
   - Check MAIL_MICROSERVICE_URL
   - Verify email service is accessible
   - Check network connectivity

### Debug Mode

Enable debug logs by setting:
```bash
DEBUG=auth-service:*
```

## 📞 Support

For support and questions:
- Create an [Issue](https://github.com/Harsh9871/auth-microservices/issues)
- Check [Documentation](https://github.com/Harsh9871/auth-microservices#readme)
- Contact: [Harsh Raithatha](https://github.com/Harsh9871)

## 🙏 Acknowledgments

- Prisma ORM team for excellent database tooling
- Express.js community
- JWT and bcrypt libraries maintainers

---

**Built with ❤️ by [Harsh Raithatha](https://github.com/Harsh9871)**