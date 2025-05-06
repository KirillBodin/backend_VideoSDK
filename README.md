# VideoSDK Backend

This is the backend service for a video conferencing and classroom platform built using **Node.js**, **Express**, **PostgreSQL**, and **Sequelize** ORM.

---

## 🚀 Features

- JWT-based authentication
- Role-based access (Super Admin, School Admin, Teacher, Student)
- Class and meeting management
- RESTful API with Express
- PostgreSQL database with Sequelize ORM
- Integration with VideoSDK Live for real-time meetings

---

## 📦 Technologies

- Node.js
- Express.js
- PostgreSQL
- Sequelize
- dotenv
- bcrypt / jsonwebtoken
- cors, body-parser
- VideoSDK Live

---

## 📁 Project Structure

backend/
├── controllers/
│ ├── schoolAdminController.js
│ ├── superAdminController.js
│ ├── teacherController.js
│ └── tokenController.js
│ └── ...
├── routes/
│ ├── schoolAdminRoutes.js
│ ├── superAdminRoutes.js
│ ├── teacherRoutes.js
│ └── tokenRoutes.js
│ └── ...
├── models/
│ └── (Sequelize models)
├── server.js
├── .env
└── README.md



---

## 🔧 Setup & Installation

1. **Clone the repository**
2. **Install dependencies**
   npm install
3. Create a .env file
   PORT=5000
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=videosdk_db
  DB_USER=postgres
  DB_PASSWORD=yourpassword
  JWT_SECRET=yourjwtsecret
  ...
5. Initialize the database (if using Sequelize CLI)
6. Start the server
   scripts": {
    "start": "node server.js",
  },


