import { User, ClassMeeting, Student } from "../models/index.js";
import bcrypt from "bcrypt";

export const getAdminTeachers = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (req.user.role !== "admin" || req.user.adminId !== Number(adminId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const teachers = await User.findAll({
      where: { adminId, role: "teacher" },
      attributes: ["id", "name", "email"],
    });

    res.json(teachers);
  } catch (error) {
    console.error("❌ Ошибка получения учителей директора:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

export const createStudentByAdmin = async (req, res) => {
  try {
    const { name, email, teacherId, classIds = [] } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const teacher = await User.findOne({ where: { id: teacherId, role: "teacher" } });

    if (!teacher || teacher.adminId !== req.user.adminId) {
      return res.status(403).json({ error: "You cannot assign students to this teacher" });
    }

    const student = await Student.create({ name, email, teacherId });

    if (classIds.length > 0) {
      const classes = await ClassMeeting.findAll({
        where: {
          id: classIds,
          teacherId: teacherId, 
        },
      });

      await student.addClasses(classes); 
    }

    res.status(201).json(student);
  } catch (error) {
    console.error("❌ Ошибка добавления студента:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};


export const createClassByAdmin = async (req, res) => {
  try {
    const { className, meetingId, teacherId, studentIds } = req.body;

    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const teacher = await User.findByPk(teacherId);
    if (!teacher || teacher.role !== "teacher" || teacher.adminId !== req.user.adminId) {
      return res.status(403).json({ error: "Invalid teacher ID or access denied" });
    }

    const slug = meetingId;
    const teacherLastName = teacher.name.split(" ").slice(1).join(" "); 
    const classUrl = `${slug}/${teacherLastName}/${className}`;


    const newClass = await ClassMeeting.create({
      className,
      meetingId,
      slug,
      classUrl,
      teacherId,
      teacherName: teacher.name,
    });

    if (studentIds && Array.isArray(studentIds)) {
      const students = await Student.findAll({ where: { id: studentIds } });
      await newClass.addStudents(students);
    }

    res.status(201).json(newClass);
  } catch (error) {
    console.error("❌ Ошибка добавления класса:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

export const deleteClassByAdmin = async (req, res) => {
  try {
    const { classId } = req.params;

    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const classInstance = await ClassMeeting.findByPk(classId);
    if (!classInstance) return res.status(404).json({ error: "Class not found" });

    const teacher = await User.findByPk(classInstance.teacherId);
    if (!teacher || teacher.adminId !== req.user.adminId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await classInstance.destroy();
    res.json({ message: "Урок удалён" });
  } catch (error) {
    console.error("❌ Ошибка удаления класса:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

export const deleteStudentByAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const teacher = await User.findByPk(student.teacherId);
    if (!teacher || teacher.adminId !== req.user.adminId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await student.destroy();
    res.json({ message: "Студент удалён" });
  } catch (error) {
    console.error("❌ Ошибка удаления студента:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

export const deleteTeacherByAdmin = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const teacher = await User.findByPk(teacherId);
    if (!teacher || teacher.role !== "teacher" || teacher.adminId !== req.user.adminId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await teacher.destroy();
    res.json({ message: "Учитель удалён" });
  } catch (error) {
    console.error("❌ Ошибка удаления учителя:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

export const createTeacherByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email, password } = req.body;

    if (req.user.role !== "admin" || req.user.adminId !== Number(adminId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 👈 хешируем

    const teacher = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "teacher",
      adminId,
    });

    res.status(201).json(teacher);
  } catch (error) {
    console.error("❌ Ошибка добавления учителя:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};



export const getAdminClasses = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (req.user.role !== "admin" || req.user.adminId !== Number(adminId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const teachers = await User.findAll({
      where: { adminId, role: "teacher" },
      attributes: ["id"],
    });

    const teacherIds = teachers.map((t) => t.id);

    const classes = await ClassMeeting.findAll({
      where: { teacherId: teacherIds },
      include: [
        { model: User, as: "teacher", attributes: ["name", "email"] },
        { model: Student, as: "students", through: { attributes: [] }, attributes: ["name", "email"] },
      ],
    });

    res.json(classes);
  } catch (error) {
    console.error("❌ Ошибка получения уроков директора:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

export const getAdminStudents = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (req.user.role !== "admin" || req.user.adminId !== Number(adminId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const teachers = await User.findAll({
      where: { adminId, role: "teacher" },
      attributes: ["id"],
    });

    const teacherIds = teachers.map((t) => t.id);

    const students = await Student.findAll({
      where: { teacherId: teacherIds },
      include: [
        { model: User, as: "teacher", attributes: ["name", "email"] },
        { model: ClassMeeting, as: "classes", through: { attributes: [] }, attributes: ["className"] },
      ],
    });

    res.json(students);
  } catch (error) {
    console.error("❌ Ошибка получения студентов директора:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};
