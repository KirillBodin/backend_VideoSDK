import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { initDB, User, ClassMeeting } from "./models/index.js";
import authRoutes from "./routes/authRoutes.js";
import schoolAdminRoutes from "./routes/schoolAdminRoutes.js";
import verifyFirebaseToken from "./middlewares/authMiddleware.js";


dotenv.config();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const app = express();
app.use(cookieParser()); // ✅ Обязательно для работы с cookies
app.use(cors({ origin: CLIENT_URL, credentials: true })); 

app.use(
  cors({
    origin: "https://meet.tamamat.com", // ✅ Твой фронт
    credentials: true, // ✅ Разрешаем куки
  })
);


// 🔹 Конфигурация CORS (чтобы клиент мог делать запросы)
app.use(
  cors({
      origin: CLIENT_URL,
      methods: "GET,POST,PUT,DELETE",
      allowedHeaders: "Content-Type,Authorization",
      credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// 🔹 Подключаем маршруты авторизации
app.use("/api/auth", authRoutes);
app.use("/api/school-admins", schoolAdminRoutes);


// ✅ Пример защищенного маршрута
app.get("/api/protected", verifyFirebaseToken, (req, res) => {
  res.json({ success: true, message: "Ты успешно прошел аутентификацию!", user: req.user });
});

// ✅ Получение всех учителей для данного администратора
app.get("/api/:adminId/teachers", async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin not found or no permission" });
    }

    const teachers = await User.findAll({
      where: { schoolId: admin.schoolId, role: "teacher" },
      attributes: ["id", "name", "email"],
    });

    res.json(teachers);
  } catch (error) {
    console.error("❌ Error fetching teachers:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Добавление нового учителя в школу администратора
app.post("/api/:adminId/teachers", async (req, res) => {
  try {
    const { adminId } = req.params;
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 🔍 Проверяем, существует ли администратор
    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin not found or no permission" });
    }

    // 🔍 Проверяем, привязан ли админ к школе
    const schoolId = admin.schoolId;
    if (!schoolId) {
      return res.status(404).json({ error: "Admin is not assigned to a school" });
    }

    // 🔍 Проверяем, существует ли учитель с таким email
    const existingTeacher = await User.findOne({ where: { email } });
    if (existingTeacher) {
      return res.status(409).json({ error: "Teacher with this email already exists" });
    }

    // ✅ Создаём нового учителя в той же школе, что и администратор
    const newTeacher = await User.create({
      email,
      password, // В идеале нужно хешировать пароль перед сохранением!
      name,
      role: "teacher",
      schoolId, // Привязываем учителя к школе администратора
    });

    res.status(201).json({
      message: "✅ Teacher added successfully!",
      teacher: newTeacher,
    });
  } catch (error) {
    console.error("❌ Error adding teacher:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/:userId/lessons", async (req, res) => {
  try {
    const { userId } = req.params;

    // 🔍 Проверяем, существует ли пользователь (может быть как администратор, так и учитель)
    const user = await User.findByPk(userId);
    console.log("[DEBUG] User found:", user);

    if (!user) {
      console.log(`[DEBUG] ❌ User with ID ${userId} not found in DB`);
      return res.status(404).json({ error: "User not found" });
    }

    // Если это администратор, получаем все уроки его школы
    if (user.role === "admin") {
      if (!user.schoolId) {
        return res.status(400).json({ error: "Admin is not assigned to a school" });
      }

      // 🔍 Получаем всех учителей этой школы
      const teachers = await User.findAll({
        where: { schoolId: user.schoolId, role: "teacher" },
        attributes: ["id"], // Нам нужны только ID учителей
      });

      console.log("[DEBUG] Teachers found:", teachers.length);

      if (teachers.length === 0) {
        return res.json({ message: "No teachers found for this school" });
      }

      const teacherIds = teachers.map((teacher) => teacher.id);

      // 🔍 Получаем уроки, которые привязаны к этим учителям
      const lessons = await ClassMeeting.findAll({
        where: { teacherId: teacherIds },
        include: {
          model: User,
          attributes: ["name", "email"],
        },
        attributes: ["id", "className", "meetingId", "teacherId"],
      });

      console.log("[DEBUG] Найдено уроков:", lessons.length);

      if (lessons.length === 0) {
        return res.json({ message: "No lessons found for this school" });
      }

      return res.json(lessons);
    }

    // Если это учитель, получаем только его уроки
    if (user.role === "teacher") {
      const lessons = await ClassMeeting.findAll({
        where: { teacherId: user.id },
        attributes: ["id", "className", "meetingId"],
      });

      console.log("[DEBUG] Найдено уроков:", lessons.length);

      if (lessons.length === 0) {
        return res.json({ message: "No lessons found for this teacher" });
      }

      return res.json(lessons);
    }

    // Если это не администратор и не учитель
    return res.status(403).json({ error: "No permission" });
  } catch (error) {
    console.error("❌ Ошибка получения уроков:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});


app.get("/api/:adminId/lessons", async (req, res) => {
  try {
    const { adminId } = req.params;

    // 🔍 Проверяем, существует ли администратор
    const admin = await User.findByPk(adminId);
    console.log("[DEBUG] Найден администратор:", admin);

    if (!admin) {
      console.log(`[DEBUG] ❌ Админ с ID ${adminId} не найден в БД`);
      return res.status(404).json({ error: "Admin not found" });
    }

    if (admin.role !== "admin") {
      console.log(`[DEBUG] ❌ Пользователь с ID ${adminId} не является админом`);
      return res.status(403).json({ error: "No permission" });
    }

    if (!admin.schoolId) {
      console.log(`[DEBUG] ❌ У администратора ${adminId} нет schoolId`);
      return res.status(400).json({ error: "Admin is not assigned to a school" });
    }

    // 🔍 Получаем ID учителей этой школы
    const teachers = await User.findAll({
      where: { schoolId: admin.schoolId, role: "teacher" },
      attributes: ["id"], // Нам нужны только ID учителей
    });

    console.log("[DEBUG] Найдено учителей:", teachers.length);

    if (teachers.length === 0) {
      return res.json({ message: "No teachers found for this school" });
    }

    const teacherIds = teachers.map((teacher) => teacher.id);

    // 🔍 Получаем уроки, которые привязаны к этим учителям
    const lessons = await ClassMeeting.findAll({
      where: { teacherId: teacherIds },
      include: {
        model: User,
        attributes: ["name", "email"],
      },
      attributes: ["id", "className", "meetingId", "teacherId"],
    });

    console.log("[DEBUG] Найдено уроков:", lessons.length);

    if (lessons.length === 0) {
      return res.json({ message: "No lessons found for this school" });
    }

    res.json(lessons);
  } catch (error) {
    console.error("❌ Ошибка получения уроков:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// ✅ Удаление учителя и всех его уроков
app.delete("/api/:adminId/teachers/:teacherId", async (req, res) => {
  try {
    const { adminId, teacherId } = req.params;

    // Проверяем, существует ли администратор
    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin not found or no permission" });
    }

    // Проверяем, существует ли учитель и принадлежит ли он той же школе, что и админ
    const teacher = await User.findOne({
      where: { id: teacherId, schoolId: admin.schoolId, role: "teacher" },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found in this school" });
    }

    // Удаляем все уроки учителя
    const deletedLessons = await ClassMeeting.destroy({ where: { teacherId } });

    console.log(`[DEBUG] ❌ Удалено уроков: ${deletedLessons} у учителя ${teacherId}`);

    // Удаляем самого учителя
    await teacher.destroy();

    res.json({ message: `✅ Teacher (ID: ${teacherId}) and all their lessons deleted successfully` });
  } catch (error) {
    console.error("❌ Error deleting teacher and lessons:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Получение информации о встрече по названию урока
app.get("/api/get-meeting/:className", async (req, res) => {
  try {
    const { className } = req.params;
    const meeting = await ClassMeeting.findOne({ where: { className } });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json(meeting);
  } catch (error) {
    console.error("❌ Ошибка при получении встречи:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Генерация токена Video SDK
app.get("/api/get-token", (req, res) => {
  try {
    const API_KEY = "90400612-174b-4704-ad94-0cf6297984d8";
    const SECRET_KEY = "b91e87d50f5f3687eaea9fb13e634a999179d9d18a3fef4dadc21c3efaf2bd44"

    if (!API_KEY || !SECRET_KEY) {
      return res.status(500).json({ error: "Missing VideoSDK API keys" });
    }

    const token = jwt.sign(
      {
        apikey: API_KEY,
        permissions: ["allow_join", "allow_mod", "allow_create", "allow_publish", "allow_subscribe"]
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    

    res.json({ token });
  } catch (error) {
    console.error("[server] ❌ Ошибка генерации токена:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// ✅ Получение информации о встрече
app.get("/api/get-meeting/:className", async (req, res) => {
  try {
    const { className } = req.params;
    const meeting = await ClassMeeting.findOne({ where: { className } });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json(meeting);
  } catch (error) {
    console.error("❌ Ошибка при получении встречи:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Сохранение нового урока
app.post("/api/save-meeting", async (req, res) => {
  try {
    const { className, meetingId, teacherEmail } = req.body;

    if (!className || !meetingId || !teacherEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Проверяем, существует ли учитель
    const teacher = await User.findOne({ where: { email: teacherEmail } });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Проверяем, есть ли уже урок с таким именем
    const existingMeeting = await ClassMeeting.findOne({ where: { className } });

    if (existingMeeting) {
      existingMeeting.meetingId = meetingId;
      await existingMeeting.save();
      return res.json({ message: "✅ Meeting updated", meeting: existingMeeting });
    }

    // Создаем новый урок
    const newMeeting = await ClassMeeting.create({
      className,
      meetingId,
      teacherId: teacher.id,
    });

    res.status(201).json({ message: "✅ New meeting saved", meeting: newMeeting });
  } catch (error) {
    console.error("❌ Ошибка при сохранении встречи:", error);
    res.status(500).json({ error: "Server error" });
  }
});




// ✅ Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});


