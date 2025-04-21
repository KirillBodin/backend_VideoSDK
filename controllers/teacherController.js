import { Op } from "sequelize";
import { User, ClassMeeting, Student, StudentTeacher,ClassStudent }from "../models/index.js";
import bcrypt from "bcrypt";

const isAuthorized = (user, entity) => {
 
  if (user.role === "superadmin") return true;
  if (user.role === "admin" && entity.adminId === user.adminId) return true;
  if (user.role === "teacher" && entity.teacherId === user.id) return true;
  return false;
};


function handleSequelizeError(err, res) {
  return res.status(500).json({ error: err });
}


export const getTeacherByLessonId = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await ClassMeeting.findByPk(lessonId, {
      include: { model: User, as: "teacher", attributes: ["id","name","email"] }
    });
    if (!lesson) {
      return res.status(404).json({ error: `Lesson with id=${lessonId} not found` });
    }
    if (!lesson.teacher) {
      return res.status(404).json({ error: "Teacher not assigned to this lesson" });
    }
    res.json(lesson.teacher);
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};

export const getTeacherAdmin = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await User.findOne({ where: { id: teacherId, role: "teacher" } });
    if (!teacher) {
      return res.status(404).json({ error: `Teacher with id=${teacherId} not found` });
    }
    if (!teacher.adminId) {
      return res.status(404).json({ error: `No admin assigned to teacher id=${teacherId}` });
    }
    const admin = await User.findOne({ where: { id: teacher.adminId, role: "admin" } });
    if (!admin) {
      return res.status(404).json({ error: `Admin with id=${teacher.adminId} not found` });
    }
    res.json(admin);
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};



export const getAllTeachers = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Only superadmin can view all teachers" });
    }
    const teachers = await User.findAll({ where: { role: "teacher" } });
    const result = await Promise.all(teachers.map(async t => {
      const classes = await ClassMeeting.count({ where: { teacherId: t.id } });
      const students = await StudentTeacher.count({ where: { teacherId: t.id } });
      return { ...t.toJSON(), numberOfClasses: classes, numberOfStudents: students };
    }));
    res.json(result);
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};
export const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await ClassMeeting.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: `Lesson with id=${lessonId} not found` });
    }
    if (!isAuthorized(req.user, lesson)) {
      return res.status(403).json({ error: "You do not have permission to delete this lesson" });
    }
    await lesson.setStudents([]);
    await lesson.destroy();
    res.json({ message: "Lesson deleted and student links removed" });
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};

export const createLesson = async (req, res) => {
  try {
    const { className, slug, teacherEmail, studentIds = [] } = req.body;
    if (!className || !slug || !teacherEmail) {
      return res.status(400).json({
        error: "Missing required fields: className, slug, teacherEmail"
      });
    }
    const teacher = await User.findOne({ where: { email: teacherEmail, role: "teacher" } });
    if (!teacher) {
      return res.status(404).json({ error: `Teacher with email="${teacherEmail}" not found` });
    }
    const [_, identifier="teacher"] = teacher.name.includes("_")
      ? teacher.name.split("_")
      : teacher.name.split(" ");
    const formatted = className.trim().replace(/\s+/g, "_");
    const classUrl = `${slug}/${identifier}/${formatted}`;

    const newClass = await ClassMeeting.create({
      className, slug, teacherId: teacher.id, teacherName: teacher.name, classUrl
    });
    if (studentIds.length) {
      const students = await Student.findAll({ where: { id: studentIds } });
      await newClass.addStudents(students);
    }
    res.status(201).json(newClass);
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};




export const createTeacher = async (req, res) => {
  try {
    if (!["superadmin", "admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Only admin or superadmin can create teachers" });
    }

    const { teacherName, teacherEmail, teacherPassword } = req.body;

    if (!teacherName || !teacherEmail || !teacherPassword) {
      return res.status(400).json({
        error: "Missing required fields: teacherName, teacherEmail, teacherPassword"
      });
    }

    const existingTeacher = await User.findOne({ where: { email: teacherEmail } });
    if (existingTeacher) {
      return res.status(409).json({ error: `Teacher with email ${teacherEmail} already exists` });
    }

    const hashed = await bcrypt.hash(teacherPassword, 10);
    const teacher = await User.create({
      name: teacherName,
      email: teacherEmail,
      password: hashed,
      role: "teacher",
      adminId: req.user.adminId || null
    });

    res.status(201).json(teacher);
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};



export const deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findOne({ where: { id: teacherId, role: "teacher" } });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });

    if (!isAuthorized(req.user, teacher)) {
      return res.status(403).json({ error: "Access denied" });
    }

   
    const students = await teacher.getStudents();

  
    for (const student of students) {
      const teachers = await student.getTeachers();
      if (teachers.length === 1 && teachers[0].id === teacher.id) {
 
        await student.destroy();
      } else {
        await student.removeTeacher(teacher);
      }
    }

   
    await ClassMeeting.destroy({ where: { teacherId } });

  
    await teacher.destroy();

    res.json({ message: "Teacher and related lessons deleted. Students handled." });
  } catch (error) {
    console.error("❌ Error deleting teacher:", error);
    res.status(500).json({ error: error.message });
  }
};


export const getAllClasses = async (req, res) => {
  try {
    const classes = await ClassMeeting.findAll();
    const filtered = classes.filter(c => isAuthorized(req.user, c));
    const result = await Promise.all(filtered.map(async c => {
      const count = await c.countStudents();
      return { ...c.toJSON(), numberOfStudents: count };
    }));
    res.json(result);
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};

export const createClass = async (req, res) => {
  try {
    const { className, teacherId } = req.body;
    if (!className || !teacherId) {
      return res.status(400).json({ error: "Missing required: className, teacherId" });
    }
    const meetingId = Math.random().toString(36).substring(2, 11);
    const cls = await ClassMeeting.create({ className, teacherId, meetingId });
    res.status(201).json(cls);
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await ClassMeeting.findByPk(id);
    if (!cls) {
      return res.status(404).json({ error: `Class with id=${id} not found` });
    }
    if (!isAuthorized(req.user, cls)) {
      return res.status(403).json({ error: "You do not have permission to delete this class" });
    }
    await cls.destroy();
    res.json({ message: "Class deleted successfully" });
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};


export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: User, as: "teachers", attributes: ["id","name"], through:{attributes:[]} },
        { model: ClassMeeting, as: "classes", attributes: ["id","className"], through:{attributes:[]} }
      ]
    });
    const filtered = students.filter(s => isAuthorized(req.user, s));
    const result = filtered.map(s => {
      const j = s.toJSON();
      j.teacherNames = j.teachers.map(t=>t.name);
      j.classNames = j.classes.map(c=>c.className);
      delete j.teachers; delete j.classes;
      return j;
    });
    res.json(result);
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};

export const createStudent = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { name, email, classIds = [] } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

   
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
      return res.status(409).json({ error: `Student with email ${email} already exists` });
    }

    const teacher = await User.findByPk(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const student = await Student.create({ name, email });

    await student.addTeacher(teacher);

    if (Array.isArray(classIds) && classIds.length > 0) {
      const validClasses = await ClassMeeting.findAll({
        where: { id: classIds },
      });
      await student.addClasses(validClasses);
    }

    res.status(201).json(student);
  } catch (error) {
    console.error("❌ Error creating student:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};




export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

   
    await ClassStudent.destroy({ where: { studentId } });

    
    await student.destroy();

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({ where: { role: "admin" } });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStudentsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findOne({
      where: { id: teacherId, role: "teacher" },
      include: {
        model: Student,
        as: "students",
        include: {
          model: ClassMeeting,
          as: "classes",
          attributes: ["id", "className"],
          through: { attributes: [] },
        },
        through: { attributes: [] },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const students = teacher.students.map((student) => {
      const studentJson = student.toJSON();
      studentJson.classNames = studentJson.classes?.map(c => c.className) || [];
      delete studentJson.classes;
      return studentJson;
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



export const getTeacherById = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await User.findOne({ where:{ id: teacherId, role:"teacher" } });
    if (!teacher) {
      return res.status(404).json({ error: `Teacher with id=${teacherId} not found` });
    }
    const classes = await ClassMeeting.count({ where:{ teacherId } });
    const students = await StudentTeacher.count({ where:{ teacherId } });
    res.json({ ...teacher.toJSON(), numberOfClasses: classes, numberOfStudents: students });
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};

export const getTeacherLessons = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const lessons = await ClassMeeting.findAll({ where:{ teacherId } });
    res.json(lessons);
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};

export const getTeachers = async (req, res) => {
  try {
    const teachers = await User.findAll({
      where:{ role:"teacher" }, attributes:["id","name","email"]
    });
    res.json(teachers);
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};

export const getStudentsByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await ClassMeeting.findByPk(lessonId, {
      include:{ model:Student, as:"students", through:{attributes:[]} }
    });
    if (!lesson) {
      return res.status(404).json({ error: `Lesson with id=${lessonId} not found` });
    }
    res.json(lesson.students);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch students for this lesson" });
  }
};


export const updateStudent = async (req, res) => {
  let emailStudent;
  try {
    const { studentId } = req.params;
    const { name, email, classIds=[] } = req.body;
    emailStudent = email
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: `Student with id=${studentId} not found` });
    }
    if (name) student.name = name;
    if (email) student.email = email;
    await student.save();
    if (Array.isArray(classIds)) {
      const valid = await ClassMeeting.findAll({ where:{ id:classIds } });
      await student.setClasses(valid);
    }
    res.json({ message: "Student updated successfully", student });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: `A student with email ${emailStudent} already exists` });
    }
    return handleSequelizeError(err, res);
  }
};



export const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { className, meetingId, teacherId, studentIds=[] } = req.body;
    const lesson = await ClassMeeting.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: `Lesson with id=${lessonId} not found` });
    }
    if (className) lesson.className = className;
    if (meetingId) lesson.meetingId = meetingId;
    if (teacherId) lesson.teacherId = teacherId;
    await lesson.save();
    if (Array.isArray(studentIds)) {
      const valid = await Student.findAll({ where:{ id:studentIds } });
      await lesson.setStudents(valid);
    }
    res.json({ message: "Lesson updated successfully", lesson });
  } catch (err) {
    return handleSequelizeError(err, res);
  }
};

// UPDATE teacher
export const updateTeacher = async (req, res) => {
  let emailTeacher;
  try {
    const { teacherId } = req.params;
    const { name, email, password, classIds=[], studentIds=[] } = req.body;
    email = emailTeacher;
    const teacher = await User.findOne({
      where:{ id:teacherId, role:"teacher" },
      include:[{ model: Student, as:"students" }]
    });
    if (!teacher) {
      return res.status(404).json({ error: `Teacher with id=${teacherId} not found` });
    }
    if (!isAuthorized(req.user, teacher)) {
      return res.status(403).json({ error: "You do not have permission to update this teacher" });
    }
    if (name) teacher.name = name.trim();
    if (email) teacher.email = email.trim();
    if (password) teacher.password = await bcrypt.hash(password.trim(), 10);
    await teacher.save();
    // classes reassignment
    if (Array.isArray(classIds)) {
      const existing = (await ClassMeeting.findAll({ where:{ teacherId } })).map(c=>c.id);
      const toRemove = existing.filter(id => !classIds.includes(id));
      const toAdd = classIds.filter(id => !existing.includes(id));
      if (toRemove.length) {
        await ClassMeeting.update({ teacherId: null }, { where:{ id:toRemove } });
      }
      if (toAdd.length) {
        await ClassMeeting.update({ teacherId }, { where:{ id:toAdd } });
      }
    }
    // students reassignment
    if (Array.isArray(studentIds)) {
      const studs = await Student.findAll({ where:{ id:studentIds } });
      await teacher.setStudents(studs);
    }
    res.json({ message: "Teacher updated successfully", teacher });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: `A teacher with email ${emailTeacher} already exists`});
    }
    return handleSequelizeError(err, res);
  }
};