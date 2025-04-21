
import { User, ClassMeeting, StudentTeacher,Student } from "../models/index.js"; 
import { Op } from "sequelize";
import bcrypt from "bcrypt";

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.findAll({ where: { role: "teacher" } });
    const teachersWithCounts = await Promise.all(
      teachers.map(async (teacher) => {
        const numberOfClasses = await ClassMeeting.count({ where: { teacherId: teacher.id } });
        const numberOfStudents = await StudentTeacher.count({ where: { teacherId: teacher.id } });
        const teacherJson = teacher.toJSON();
        teacherJson.numberOfClasses = numberOfClasses;
        teacherJson.numberOfStudents = numberOfStudents;
        return teacherJson;
      })
    );
    res.json(teachersWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const createAdmin = async (req, res) => {
  const { name, email, password, schoolName } = req.body;

  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Only superadmin can create admins" });
    }

    if (!name || !email || !password || !schoolName) {
      return res.status(400).json({
        error: "Missing required fields: name, email, password, schoolName"
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: `School Admin with email "${email}" is already exist` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      schoolName,
    });

    return res.status(201).json({
      message: "School admin created successfully",
      admin: newAdmin,
    });

  } catch (err) {
    console.error("Error creating admin:", err);

    if (err.name === "SequelizeValidationError") {
      const msgs = err.errors.map(e => e.message).join("; ");
      return res.status(400).json({ error: msgs });
    }
    if (err.name === "SequelizeUniqueConstraintError") {
      const msgs = err.errors.map(e => e.message).join("; ");
      return res.status(409).json({ error: msgs });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};


export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, schoolName } = req.body;

  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Only superadmin can update admins" });
    }

    const admin = await User.findByPk(id);
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ error: `Admin with id=${id} not found` });
    }


    const existing = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
    if (existing) {
      return res.status(409).json({ error: `School Admin with email "${email}" already exists` });
    }
    

    admin.name = name ?? admin.name;
    admin.email = email ?? admin.email;
    admin.schoolName = schoolName ?? admin.schoolName;
    if (password) {
      admin.password = await bcrypt.hash(password, 10);
    }

    await admin.save();
    return res.json({ message: "School admin updated", admin });

  } catch (err) {
    console.error("Error updating admin:", err);

    if (err.name === "SequelizeValidationError") {
      const msgs = err.errors.map(e => e.message).join("; ");
      return res.status(400).json({ error: msgs });
    }
    if (err.name === "SequelizeUniqueConstraintError") {
      const msgs = err.errors.map(e => e.message).join("; ");
      return res.status(409).json({ error: msgs });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};


export const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const admin = await User.findByPk(id);
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ error: "Director not found" });
    }

    await admin.destroy();
    res.json({ message: "Director deleted" });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createTeacher = async (req, res) => {
  const { teacherName, teacherEmail, teacherPassword, classIds = [], studentIds = [] } = req.body;

  try {
    if (!teacherName || !teacherEmail || !teacherPassword) {
      return res.status(400).json({
        error: "Missing required fields: teacherName, teacherEmail, teacherPassword"
      });
    }

    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Only admin or superadmin can create teachers" });
    }

    const hashedPassword = await bcrypt.hash(teacherPassword, 10);

    const teacher = await User.create({
      name: teacherName,
      email: teacherEmail,
      password: hashedPassword,
      role: "teacher",
      adminId: req.user.adminId || null
    });

    // ⬇️ Привязка уроков
    if (Array.isArray(classIds) && classIds.length > 0) {
      await teacher.setLessons(classIds);
    }

    // ⬇️ Привязка учеников
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      await teacher.setStudents(studentIds);
    }

    return res.status(201).json(teacher);

  } catch (err) {
    console.error("❌ Error creating teacher:", err);

    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ error: `Email "${teacherEmail}" already exists` });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};


export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await User.findOne({ where: { id, role: "teacher" } });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    if (teacher.adminId !== req.user.adminId && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    await teacher.destroy();
    res.json({ message: "Teacher deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getAllClasses = async (req, res) => {
  try {
    const classes = await ClassMeeting.findAll();
    const classesWithCounts = await Promise.all(
      classes.map(async (cls) => {
        const numberOfStudents = await cls.countStudents(); 
        const clsJson = cls.toJSON();
        clsJson.numberOfStudents = numberOfStudents;
        return clsJson;
      })
    );
    res.json(classesWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateClass = async (req, res) => {
  const classId = req.params.id;
  const { className, teacherId, studentIds } = req.body;

  try {
    const cls = await ClassMeeting.findByPk(classId);
    if (!cls) {
      return res.status(404).json({ error: `Class with id=${classId} not found` });
    }

    cls.className = className ?? cls.className;
    cls.teacherId = teacherId ?? cls.teacherId;

    if (className || teacherId) {
      const teacher = await cls.getTeacher();
      const lastName = teacher?.name.split(" ")[1] || "teacher";
      const slug = cls.slug;
      cls.classUrl = `/meet-${slug}/${lastName}/${cls.className}`;
    }

    await cls.save();

    if (Array.isArray(studentIds)) {
      await cls.setStudents(studentIds);
    }

    return res.json({ message: "Class updated successfully", class: cls });

  } catch (err) {
    console.error("Error updating class:", err);

    if (err.name === "SequelizeValidationError") {
      const msgs = err.errors.map(e => e.message).join("; ");
      return res.status(400).json({ error: msgs });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const createClass = async (req, res) => {
  const { className, teacherId, studentIds } = req.body;

  try {
    if (!className || !teacherId) {
      return res.status(400).json({
        error: "Missing required fields: className, teacherId"
      });
    }
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Only admin or superadmin can create classes" });
    }

    const teacher = await User.findByPk(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(400).json({ error: `Teacher with id=${teacherId} not found` });
    }

    const meetingId = Math.random().toString(36).substring(2, 11);
    const slug = meetingId;
    const teacherLastName = teacher.name.split(" ").slice(1).join(" ");
    const classUrl = `/meet-${slug}/${teacherLastName}/${className}`;

    const newClass = await ClassMeeting.create({
      className,
      meetingId,
      slug,
      classUrl,
      teacherId,
      teacherName: teacher.name,
    });

    if (Array.isArray(studentIds) && studentIds.length) {
      const students = await Student.findAll({ where: { id: studentIds } });
      await newClass.addStudents(students);
    }

    return res.status(201).json(newClass);

  } catch (err) {
    console.error("Error creating class:", err);

    if (err.name === "SequelizeValidationError") {
      const msgs = err.errors.map(e => e.message).join("; ");
      return res.status(400).json({ error: msgs });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};



export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classInstance = await ClassMeeting.findByPk(id);
    if (!classInstance) {
      return res.status(404).json({ error: "Class not found" });
    }

    if (req.user.role === "admin" && classInstance.teacherId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await classInstance.destroy();
    res.json({ message: "Class deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: User, as: "teachers", attributes: ["name"], through: { attributes: [] } },
        { model: ClassMeeting, as: "classes", attributes: ["className"], through: { attributes: [] } },
      ],
    });
    const studentsTransformed = students.map((student) => {
      const studentJson = student.toJSON();
      studentJson.teacherName =
        studentJson.teachers && studentJson.teachers.length > 0
          ? studentJson.teachers[0].name
          : null;
      studentJson.className =
        studentJson.classes && studentJson.classes.length > 0
          ? studentJson.classes[0].className
          : null;
      delete studentJson.teachers;
      delete studentJson.classes;
      return studentJson;
    });
    res.json(studentsTransformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getAdminDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const admin = await User.findOne({
      where: { id, role: "admin" },
      attributes: ["id", "name", "email", "schoolName"]
    });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

  
    const teachers = await User.findAll({
      where: { role: "teacher", adminId: id },
      attributes: ["id"]
    });

    const teacherIds = teachers.map((t) => t.id);

    res.json({
      name: admin.name,
      email: admin.email,
      schoolName: admin.schoolName,
      teacherIds
    });
  } catch (err) {
    console.error("❌ Failed to get admin details:", err);
    res.status(500).json({ error: "Failed to get admin details" });
  }
};


export const getClassDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const classItem = await ClassMeeting.findByPk(id, {
      include: [
        {
          model: Student,
          as: "students",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });

    if (!classItem) {
      return res.status(404).json({ error: "Class not found" });
    }

    const studentIds = classItem.students.map((s) => s.id);

    res.json({
      className: classItem.className,
      teacherId: classItem.teacherId,
      studentIds,
    });
  } catch (error) {
    console.error("❌ Error getting class details:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateTeacher = async (req, res) => {
  const {
    id,
    teacherName,
    teacherEmail,
    teacherPassword,
    adminId,
    classIds = [],
    studentIds = [],
  } = req.body;

  try {
    const teacher = await User.findByPk(id);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const existing = await User.findOne({ where: { email: teacherEmail, id: { [Op.ne]: id } } });
    if (existing) {
      return res.status(409).json({ error: `Teacher with email "${teacherEmail}" already exists` });
    }
    

    teacher.name = teacherName;
    teacher.email = teacherEmail;
    teacher.adminId = adminId;

    if (teacherPassword && teacherPassword.trim()) {
      const hashed = await bcrypt.hash(teacherPassword, 10);
      teacher.password = hashed;
    }

    await teacher.save();

    // ⬇️ Это вместо ручного обновления ClassMeeting
    await teacher.setLessons(classIds);   // many-to-many через ClassMeeting.teacherId
    await teacher.setStudents(studentIds); // many-to-many через StudentTeacher

    res.json({ message: "Teacher updated successfully" });
  } catch (err) {
    console.error("❌ updateTeacher error:", err);
    res.status(500).json({ error: err.message });
  }
};



export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { studentName, studentEmail, classIds, teacherIds } = req.body;
  try {
    const [firstName, ...rest] = studentName.split(" ");
    const lastName = rest.join(" ");

    const existing = await Student.findOne({ where: { email: studentEmail, id: { [Op.ne]: id } } });
if (existing) {
  return res.status(409).json({ error: `Student with email "${studentEmail}" already exists` });
}


    await Student.update({ name: studentName, email: studentEmail }, { where: { id } });

    if (Array.isArray(classIds)) {
      await ClassStudent.destroy({ where: { studentId: id } });
      await Promise.all(classIds.map(classId =>
        ClassStudent.create({ classId, studentId: id })
      ));
    }

    if (Array.isArray(teacherIds)) {
      await StudentTeacher.destroy({ where: { studentId: id } });
      await Promise.all(teacherIds.map(teacherId =>
        StudentTeacher.create({ teacherId, studentId: id })
      ));
    }

    res.json({ message: "Student updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update student" });
  }
};


export const getStudentDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findByPk(id, {
      include: [
        {
          model: ClassMeeting,
          as: "classes",
          through: { attributes: [] }
        },
        {
          model: User,
          as: "teachers",
          include: [{ model: User, as: "admin" }], 
          through: { attributes: [] }
        }
      ]
    });

    if (!student) return res.status(404).json({ error: "Student not found" });

    const classIds = student.classes.map((c) => c.id);
    const teacherIds = student.teachers.map((t) => t.id);
    const [firstName, ...lastParts] = student.name.split(" ");
    const lastName = lastParts.join(" ");

    // Получаем adminId через первого учителя
    const adminName = student.teachers[0]?.admin?.name || "";

    res.json({
      id: student.id,
      firstName,
      lastName,
      email: student.email,
      classIds,
      teacherIds,
      adminName
    });
  } catch (error) {
    console.error("❌ Error fetching student details:", error);
    res.status(500).json({ error: "Server error" });
  }
};



export const getTeacherDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const teacher = await User.findByPk(id, {
      where: { role: "teacher" }
    });

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ error: "Teacher not found" });
    }

    
    const classes = await ClassMeeting.findAll({ where: { teacherId: id } });
    const classIds = classes.map(cls => cls.id);

  
    const studentLinks = await StudentTeacher.findAll({ where: { teacherId: id } });
    const studentIds = studentLinks.map(link => link.studentId);

    const { name, email, adminId } = teacher;

    const [firstName, ...lastParts] = name.split(" ");
    const lastName = lastParts.join(" ");

    res.json({
      id,
      firstName,
      lastName,
      email,
      adminId,
      classIds,
      studentIds
    });
  } catch (error) {
    console.error("Error fetching teacher details:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const createStudent = async (req, res) => {
  const { studentName, studentEmail, classIds = [], teacherIds = [] } = req.body;

  try {
    // Проверка обязательных полей
    if (!studentName || !studentEmail) {
      return res.status(400).json({
        error: "Missing required fields: studentName, studentEmail"
      });
    }

    if (!Array.isArray(classIds) || !Array.isArray(teacherIds)) {
      return res.status(400).json({
        error: "classIds and teacherIds must be arrays"
      });
    }

    // Создание студента
    const student = await Student.create({
      name: studentName,
      email: studentEmail
    });

    // Привязка классов (если есть)
    if (classIds.length) {
      const classes = await ClassMeeting.findAll({ where: { id: classIds } });
      await student.addClasses(classes);
    }

    // Привязка учителей (если есть)
    if (teacherIds.length) {
      const teachers = await User.findAll({
        where: { id: teacherIds, role: "teacher" }
      });
      await student.addTeachers(teachers);
    }

    return res.status(201).json(student);

  } catch (err) {
    console.error("Error creating student:", err);

    if (err.name === "SequelizeValidationError") {
      const msgs = err.errors.map(e => e.message).join("; ");
      return res.status(400).json({ error: msgs });
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      const duplicateField = err?.errors?.[0]?.path;
      return res.status(409).json({
        error: duplicateField === "email"
          ? `Student with email ${studentEmail} already exists`
          : "Duplicate entry"
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};



export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
   
    await student.destroy();
    res.json({ message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getAllAdmins = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const admins = await User.findAll({ where: { role: "admin" } });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
