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
    res.status(500).json({ error: "error" });
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
      return res.status(404).json({ error: "The teacher was not found or does not belong to this school" });
    }

    await teacher.destroy();
    res.json({ message: "✅ The teacher has been successfully removed." });
  } catch (error) {
    res.status(500).json({ error: "error" });
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
      return res.status(400).json({ error: "All fields are required" });
    }

    // Находим школу админа
    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "No rights or administrator not found" });
    }

    const schoolId = admin.schoolId;
    if (!schoolId) {
      return res.status(404).json({ error: "The administrator is not tied to the school" });
    }

    // Добавляем учителя
    const newTeacher = await User.create({ email, password, name, role: "teacher", schoolId });
    res.status(201).json({ message: "✅ Teacher added!", teacher: newTeacher });
  } catch (error) {
    res.status(500).json({ error: "error" });
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
    res.status(500).json({ error: "error" });
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
    console.error("❌ Error getting users:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});


router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });

    if (user) {
      return res.json({ exists: true, role: user.role }); // Отдаём роль, если надо
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("❌ Email verification error:", error);
    res.status(500).json({ error: "Server error" });
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
    res.status(500).json({ error: "Server error" });
  }
});

/* ==========================
  ✅ Добавление администратора школы
========================== */
router.post("/", async (req, res) => {
  try {
    const { email, name, schoolName } = req.body;
    if (!email || !name || !schoolName) {
      return res.status(400).json({ error: "All fields are required });
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

    res.status(201).json({ message: "✅ Admin created!", admin: newAdmin });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ==========================
  ✅ Получение уроков учителя
========================== */
router.get("/:teacherId/lessons", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await User.findByPk(teacherId);
    if (!teacher) {
      return res.status(403).json({ error: "Teacher not found or no access" });
    }

    const lessons = await ClassMeeting.findAll({
      where: { teacherId },
      attributes: ["id", "className", "meetingId", "teacherId"],
    });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
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
      res.json({ message: "✅ Lesson successfully deleted!" });
    } else {
      res.status(404).json({ error: "Lesson not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
