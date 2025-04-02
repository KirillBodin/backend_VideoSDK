import { User, ClassMeeting, Student,ClassStudent,StudentTeacher } from "../models/index.js";
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
  const { adminId } = req.params;
  const { name, email, password, classIds = [], teacherIds = [] } = req.body;

  try {
   
    const newStudent = await Student.create({ name, email, password });

    
    if (classIds.length > 0) {
      await newStudent.setClasses(classIds);
    }

  
    if (teacherIds.length > 0) {
      await newStudent.setTeachers(teacherIds); 
    }

    res.status(201).json(newStudent);
  } catch (error) {
    console.error("Error creating student by admin:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const createClassByAdmin = async (req, res) => {
  try {
    const { className, meetingId, teacherId, studentIds } = req.body;

    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    let teacher = null;
    let teacherName = null;
    let classUrl = null;

    if (teacherId) {
      teacher = await User.findByPk(teacherId);
      if (!teacher || teacher.role !== "teacher" || teacher.adminId !== req.user.adminId) {
        return res.status(403).json({ error: "Invalid teacher ID or access denied" });
      }

      const slug = meetingId;
      const teacherLastName = teacher.name.split(" ").slice(1).join(" ");
      classUrl = `${slug}/${teacherLastName}/${className}`;
      teacherName = teacher.name;
    }

    const newClass = await ClassMeeting.create({
      className,
      meetingId,
      slug: meetingId,
      classUrl,
      teacherId: teacherId || null,
      teacherName: teacherName || null,
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
  const { studentId } = req.params;

  try {
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }


    await ClassStudent.destroy({ where: { studentId } });
    await StudentTeacher.destroy({ where: { studentId } });

    
    await student.destroy();

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting student:", err);
    res.status(500).json({ message: "Server error" });
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
  const { adminId } = req.params;
  const { name, email, password, classIds = [], studentIds = [] } = req.body;

  try {
   
    const newTeacher = await User.create({
      name,
      email,
      password,
      role: "teacher",
      adminId,
    });

   
    if (classIds.length > 0) {
      await newTeacher.setLessons(classIds);
    }

    
    if (studentIds.length > 0) {
      await newTeacher.setStudents(studentIds); 
    }

    res.status(201).json(newTeacher);
  } catch (error) {
    console.error("❌ Error creating teacher by admin:", error);
    res.status(500).json({ error: "Server error while creating teacher" });
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
      include: [
        {
          model: User,
          as: "teachers",
          attributes: ["id", "name", "email"],
          where: { id: teacherIds },
          through: { attributes: [] },
        },
        {
          model: ClassMeeting,
          as: "classes",
          attributes: ["className"],
          through: { attributes: [] },
        },
      ],
    });
    

    res.json(students);
  } catch (error) {
    console.error("❌ Ошибка получения студентов директора:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};
