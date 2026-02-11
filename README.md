# IronVault - Backend

IronVault is a cohort-based image gallery where students from the same class can share pictures, react to them, and comment. This is the backend (the server) that handles all the data and logic.

## What does the backend do?

- Stores users, images, comments, cohorts and reactions in a MongoDB database
- Handles user signup and login with secure password hashing
- Protects routes using JWT (JSON Web Tokens) so only logged-in users can access data
- Uploads images to Cloudinary (a cloud image hosting service)
- Provides a REST API that the frontend talks to

## Tech Stack

| Tool | What it does |
|------|-------------|
| **Node.js** | Runs JavaScript on the server |
| **Express** | Web framework that handles HTTP requests and routes |
| **MongoDB** | NoSQL database that stores all the data |
| **Mongoose** | Library that makes it easier to work with MongoDB |
| **JWT (jsonwebtoken)** | Creates and verifies tokens for authentication |
| **bcryptjs** | Hashes passwords so they are never stored in plain text |
| **Cloudinary + Multer** | Handles image uploads and stores them in the cloud |
| **dotenv** | Loads secret values (like database URL) from a `.env` file |
| **cors** | Allows the frontend (different origin) to talk to the backend |
| **morgan** | Logs every HTTP request in the terminal (useful for debugging) |

## Project Structure

```
IronVault-BackEnd/
├── server.js              # Starts the server and connects to the database
├── app.js                 # Sets up Express, middleware, and routes
├── config/
│   └── cloudinary.config.js  # Cloudinary setup for image uploads
├── middlewares/
│   └── jwt.middleware.js     # Checks if the user is logged in (token verification)
├── models/
│   ├── User.model.js         # User schema (email, password, role, social links...)
│   ├── Item.model.js          # Item schema (image, caption, reactions, comments...)
│   ├── Comment.model.js       # Comment schema (content, author, reactions)
│   └── Cohort.model.js        # Cohort schema (course, month, year)
├── routes/
│   ├── index.routes.js        # Base route (health check)
│   ├── auth.routes.js         # Signup and Login
│   ├── users.routes.js        # User profile (update, upload picture)
│   ├── items.routes.js        # CRUD for images + reactions
│   ├── comments.routes.js     # CRUD for comments + reactions
│   ├── cohorts.routes.js      # Cohort listing + users per cohort
│   └── admin.routes.js        # Admin-only routes (stats, manage users)
└── .env                       # Environment variables (not committed to git)
```

## Database Models

### User
| Field | Type | Notes |
|-------|------|-------|
| email | String | Unique, required, stored in lowercase |
| passwordHash | String | Hashed with bcryptjs (12 salt rounds) |
| userName | String | Required |
| cohort | ObjectId | References the Cohort model |
| role | String | `"USER"` or `"ADMIN"` (default: `"USER"`) |
| profilePicture | String | URL to Cloudinary image |
| socialLinks | Object | github, linkedin, instagram, twitter |

### Item
| Field | Type | Notes |
|-------|------|-------|
| imageUrl | String | URL of the uploaded image |
| caption | String | Max 200 characters |
| postedBy | ObjectId | References the User who posted it |
| reactions | Array | Each reaction has an emoji and list of users |
| cohort | ObjectId | References the Cohort |

### Comment
| Field | Type | Notes |
|-------|------|-------|
| content | String | Max 500 characters |
| author | ObjectId | References the User |
| item | ObjectId | References the Item |
| reactions | Array | Same structure as Item reactions |

### Cohort
| Field | Type | Notes |
|-------|------|-------|
| course | String | One of: WDFT, WDPT, UIUXFT, UIUXPT, CSFT, CSPT, DATAFT, DATAPT |
| month | String | Jan through Dec |
| year | Number | Between 2000 and 2100 |
| displayName | Virtual | Auto-generated: `course-month-year` |

## API Endpoints

### Auth (`/auth`)
| Method | Route | Auth? | What it does |
|--------|-------|-------|-------------|
| POST | `/auth/signup` | No | Creates a new user and returns a JWT token |
| POST | `/auth/login` | No | Logs in and returns a JWT token |
| GET | `/auth/verify` | Yes | Checks if the current token is still valid |

### Users (`/users`)
| Method | Route | Auth? | What it does |
|--------|-------|-------|-------------|
| GET | `/users/me` | Yes | Gets the logged-in user's profile |
| PATCH | `/users/me` | Yes | Updates social links and profile picture URL |
| POST | `/users/me/profile-picture` | Yes | Uploads a new profile picture |

### Items (`/items`)
| Method | Route | Auth? | What it does |
|--------|-------|-------|-------------|
| GET | `/items` | Yes | Gets all items for the user's cohort |
| POST | `/items/upload` | Yes | Uploads a new image with optional caption |
| GET | `/items/:id` | Yes | Gets one item by ID |
| PUT | `/items/:id` | Yes | Updates caption (only the author can) |
| DELETE | `/items/:id` | Yes | Deletes the item (only the author can) |
| POST | `/items/:id/react` | Yes | Adds or removes a reaction on an item |
| GET | `/items/reacted` | Yes | Gets all items the user has reacted to |

### Comments (`/comments`)
| Method | Route | Auth? | What it does |
|--------|-------|-------|-------------|
| GET | `/comments/item/:itemId` | Yes | Gets all comments for an item |
| POST | `/comments/item/:itemId` | Yes | Adds a new comment to an item |
| DELETE | `/comments/:id` | Yes | Deletes a comment (only the author can) |
| POST | `/comments/:id/react` | Yes | Adds or removes a reaction on a comment |

### Cohorts (`/cohorts`)
| Method | Route | Auth? | What it does |
|--------|-------|-------|-------------|
| POST | `/cohorts/create-cohort` | Yes | Creates a new cohort |
| GET | `/cohorts/cohorts` | No | Lists all cohorts |
| GET | `/cohorts/cohorts/:id` | No | Gets one cohort by ID |
| GET | `/cohorts/me/students` | Yes | Gets all students in the logged-in user's cohort |
| GET | `/cohorts/cohorts/:id/users` | Yes | Gets all users in a specific cohort |

### Admin (`/admin`)
| Method | Route | Auth? | What it does |
|--------|-------|-------|-------------|
| GET | `/admin/stats` | Yes (Admin) | Gets stats: total users, items, comments |
| GET | `/admin/users` | Yes (Admin) | Lists all users |
| DELETE | `/admin/users/:id` | Yes (Admin) | Deletes a user |
| PATCH | `/admin/users/:id/role` | Yes (Admin) | Changes a user's role |
| PATCH | `/admin/users/:id/cohort` | Yes (Admin) | Assigns a user to a cohort |

## How Authentication Works

1. **Signup**: The user sends their name, email, and password. The server hashes the password with bcryptjs (12 salt rounds), saves the user to the database, and returns a JWT token.

2. **Login**: The user sends email and password. The server finds the user, compares the password with the stored hash using `bcrypt.compare()`, and returns a JWT token if it matches.

3. **JWT Token**: The token contains the user's `_id`, `role`, and `cohortId`. It expires after 48 hours. It is signed with a secret key stored in the `.env` file.

4. **Protected Routes**: When a user makes a request to a protected route, the `isAuthenticated` middleware checks the `Authorization` header for a valid `Bearer <token>`. If the token is valid, the decoded data is attached to `req.payload` and the request continues. If not, a `401 Unauthorized` error is returned.

## Security Measures

- **Passwords are never stored in plain text** - bcryptjs hashes them with 12 salt rounds
- **Password validation** - minimum 6 characters required on signup
- **Password hashes are never sent to the frontend** - `.select("-passwordHash")` is used on user queries
- **JWT tokens expire** after 48 hours
- **Protected routes** require a valid token in the Authorization header
- **Admin routes** check that the user's role is `"ADMIN"`
- **CORS** is configured to only allow requests from the frontend origin
- **Environment variables** keep secrets (database URL, JWT secret, Cloudinary keys) out of the code

## How to Run Locally

### 1. Clone the repo
```bash
git clone <your-backend-repo-url>
cd IronVault-BackEnd
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file
Create a `.env` file in the root folder with these values:
```
PORT=5005
ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<your-connection-string>
TOKEN_SECRET=<any-long-random-string>
CLOUDINARY_NAME=<your-cloudinary-name>
CLOUDINARY_KEY=<your-cloudinary-key>
CLOUDINARY_SECRET=<your-cloudinary-secret>
```

### 4. Start the server
```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The server will run on `http://localhost:5005` by default.
