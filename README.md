# 🗺️ Peta-Pim API

**Peta-Pim API** adalah RESTful API untuk platform berbagi cerita berbasis **peta interaktif**.

---

## 🛠️ Tech Stack

- **Node.js** + **Express**
- **PostgreSQL**
- **JWT Authentication**
- **bcryptjs**

---

## ⚙️ Setup

### Install Dependencies

```bash
npm install
```

### Environment Variables

Buat file `.env` di root project:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/peta_pim
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
```

---

## 🗄️ Database Schema

### Table `users`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table `stories`

```sql
CREATE TABLE stories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  full_story TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Development

```bash
npm run dev
```

---

## 🏭 Production

```bash
npm start
```

---

## 🔌 API Endpoints

### 🔐 Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` *(protected)*
- `PUT /api/auth/profile` *(protected)*

### 📝 Stories

- `GET /api/stories`
- `GET /api/stories/:id`
- `POST /api/stories` *(protected)*
- `PUT /api/stories/:id` *(protected)*
- `DELETE /api/stories/:id` *(protected)*
- `GET /api/stories/my-stories` *(protected)*
- `GET /api/stories/map`
- `GET /api/stories/stats`
- `POST /api/stories/:id/view`

---

## 📄 License

MIT License
