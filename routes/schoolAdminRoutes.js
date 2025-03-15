const express = require("express");
const { User, School, ClassMeeting } = require("../models");

const router = express.Router();

/* ==========================
  ✅ Получение всех администраторов школ
========================== */
router.get("/", async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: "admin" },
      include: [{ model: School, attributes: ["name"] }],
      attributes: ["id", "email", "name", "schoolId"],
    });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/* ==========================
  ✅ Удаление учителя из школы
========================== */
router.delete("/:schoolId/teachers/:teacherId", async (req, res) => {
  try {
    const { schoolId, teacherId } = req.params;
    const teacher = await User.findOne({ where: { id: teacherId, schoolId, role: "teacher" } });

    if (!teacher) {
      return res.status(404).json({ error: "Учитель не найден или не принадлежит данной школе" });
    }

    await teacher.destroy();
    res.json({ message: "✅ Учитель успешно удален" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/* ==========================
  ✅ Добавление нового учителя в школу
========================== */
router.post("/:adminId/teachers", async (req, res) => {
  try {
    const { adminId } = req.params;
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    // Находим школу админа
    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Нет прав или администратор не найден" });
    }

    const schoolId = admin.schoolId;
    if (!schoolId) {
      return res.status(404).json({ error: "Администратор не привязан к школе" });
    }

    // Добавляем учителя
    const newTeacher = await User.create({ email, password, name, role: "teacher", schoolId });
    res.status(201).json({ message: "✅ Учитель добавлен!", teacher: newTeacher });
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/* ==========================
  ✅ Получение всех учителей
========================== */
router.get("/teachers", async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: { role: "teacher" },
      attributes: ["id", "email", "name"],
      order: [["name", "ASC"]],
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/* ==========================
  ✅ Получение всех пользователей
========================== */
router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "schoolId"],
      order: [["role", "ASC"], ["name", "ASC"]],
    });

    res.json(users);
  } catch (error) {
    console.error("❌ Ошибка получения пользователей:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});


/* ==========================
  ✅ Получение списка учителей конкретной школы
========================== */
router.get("/:schoolId/teachers", async (req, res) => {
  try {
    const { schoolId } = req.params;
    const teachers = await User.findAll({
      where: { schoolId, role: "teacher" },
      attributes: ["id", "name", "email"],
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/* ==========================
  ✅ Добавление администратора школы
========================== */
router.post("/", async (req, res) => {
  try {
    const { email, name, schoolName } = req.body;
    if (!email || !name || !schoolName) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    let school = await School.findOne({ where: { name: schoolName } });
    if (!school) {
      school = await School.create({ name: schoolName });
    }

    const newAdmin = await User.create({
      email,
      password: "",
      name,
      role: "admin",
      schoolId: school.id,
    });

    res.status(201).json({ message: "✅ Админ создан!", admin: newAdmin });
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/* ==========================
  ✅ Получение уроков учителя
========================== */
router.get("/:teacherId/lessons", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await User.findByPk(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(403).json({ error: "Учитель не найден или нет доступа" });
    }

    const lessons = await ClassMeeting.findAll({
      where: { teacherId },
      attributes: ["id", "className", "meetingId", "teacherId"],
    });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

/* ==========================
  ✅ Удаление урока по lessonId
========================== */
router.delete("/lessons/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const deletedLesson = await ClassMeeting.destroy({ where: { id: lessonId } });

    if (deletedLesson) {
      res.json({ message: "✅ Урок успешно удалён!" });
    } else {
      res.status(404).json({ error: "Урок не найден" });
    }
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
