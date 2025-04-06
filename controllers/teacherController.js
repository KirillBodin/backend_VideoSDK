import { Op } from "sequelize";
import { User, ClassMeeting, Student, StudentTeacher,ClassStudent }from "../models/index.js";

const isAuthorized = (user, entity) => {
 
  if (user.role === "superadmin") return true;
  if (user.role === "admin" && entity.adminId === user.adminId) return true;
  if (user.role === "teacher" && entity.teacherId === user.id) return true;
  return false;
};


export const getTeacherByLessonId = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await ClassMeeting.findByPk(lessonId, {
      include: {
        model: User,
        as: "teacher",
        attributes: ["id", "name", "email"]
      }
    });

    if (!lesson || !lesson.teacher) {
      return res.status(404).json({ error: "Lesson or teacher not found" });
    }

    res.json(lesson.teacher);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const getTeacherAdmin = async (req, res) => {
 
  try {
    const { teacherId } = req.params;
    

    const teacher = await User.findOne({ where: { id: teacherId, role: "teacher" } });
    
    if (!teacher) {
      
      return res.status(404).json({ error: "Teacher not found" });
    }

    if (teacher.adminId) {
      

      const admin = await User.findOne({ where: { id: teacher.adminId, role: "admin" } });
      
      if (!admin) {
        
        return res.status(404).json({ error: "Admin not found" });
      }
      return res.json(admin);
    } else {
      
      return res.status(404).json({ error: "Admin not found for teacher" });
    }
  } catch (error) {
    console.error("Error in getTeacherAdmin:", error);
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
    return res.status(500).json({ error: error.message });
  }
};



export const getAllTeachers = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }
    const teachers = await User.findAll({ where: { role: "teacher" } });
    const teachersWithCounts = await Promise.all(
      teachers.map(async (teacher) => {
        const numberOfClasses = await ClassMeeting.count({ where: { teacherId: teacher.id } });
        const numberOfStudents = await Student.count({ where: { teacherId: teacher.id } });
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

export const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await ClassMeeting.findByPk(lessonId);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    if (!isAuthorized(req.user, lesson)) {
      return res.status(403).json({ error: "Access denied" });
    }

    await lesson.setStudents([]);
    await lesson.destroy();

    res.status(200).json({ message: "Lesson and student associations deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createLesson = async (req, res) => {
  try {
    const { className, slug, teacherEmail, studentIds } = req.body;
    if (!className || !slug || !teacherEmail) {
      return res.status(400).json({ error: "Class name, slug and teacherEmail are required" });
    }

    const teacher = await User.findOne({ where: { email: teacherEmail, role: "teacher" } });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });

  
    const nameParts = teacher.name.includes("_")
      ? teacher.name.split("_")
      : teacher.name.split(" ");
    const teacherIdentifier = nameParts[1] || nameParts[0]; 

    const formattedClassName = className.trim().replace(/\s+/g, "_");
    const classUrl = `${slug}/${teacherIdentifier}/${formattedClassName}`;

    const newClass = await ClassMeeting.create({
      className,
      teacherId: teacher.id,
      teacherName: teacher.name,
      slug,
      classUrl,
    });

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const students = await Student.findAll({ where: { id: studentIds } });
      await newClass.addStudents(students);
    }

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





export const createTeacher = async (req, res) => {
  try {
    if (req.user.role !== "superadmin" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    const { teacherName, teacherEmail, teacherPassword } = req.body;
    if (!teacherName || !teacherEmail || !teacherPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const teacher = await User.create({
      name: teacherName,
      email: teacherEmail,
      password: teacherPassword,
      role: "teacher",
      adminId: req.user.adminId || null
    });
    res.status(201).json(teacher);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const filtered = classes.filter((cls) => isAuthorized(req.user, cls));
    const classesWithCounts = await Promise.all(
      filtered.map(async (cls) => {
        const count = await cls.countStudents();
        const clsJson = cls.toJSON();
        clsJson.numberOfStudents = count;
        return clsJson;
      })
    );
    res.json(classesWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createClass = async (req, res) => {
  try {
    const { className, teacherId } = req.body;
    if (!className || !teacherId) {
      return res.status(400).json({ error: "Class name and teacher are required" });
    }
    const meetingId = Math.random().toString(36).substring(2, 11);
    const newClass = await ClassMeeting.create({ className, teacherId, meetingId });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await ClassMeeting.findByPk(id);
    if (!cls) return res.status(404).json({ error: "Class not found" });

    if (!isAuthorized(req.user, cls)) {
      return res.status(403).json({ error: "Access denied" });
    }

    await cls.destroy();
    res.json({ message: "Class deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: User,
          as: "teachers",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
        {
          model: ClassMeeting,
          as: "classes",
          attributes: ["id", "className"],
          through: { attributes: [] },
        },
      ],
    });

    const filtered = students.filter((s) => isAuthorized(req.user, s));

    const transformed = filtered.map((student) => {
      const studentJson = student.toJSON();
      studentJson.teacherNames = studentJson.teachers?.map(t => t.name) || [];
      studentJson.classNames = studentJson.classes?.map(c => c.className) || [];
      delete studentJson.teachers;
      delete studentJson.classes;
      return studentJson;
    });

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { name, email, classIds = [] } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
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

    const teacher = await User.findOne({
      where: { id: teacherId, role: "teacher" },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const numberOfClasses = await ClassMeeting.count({ where: { teacherId } });

    
    const numberOfStudents = await StudentTeacher.count({
      where: { teacherId },
    });

    const teacherJson = teacher.toJSON();
    teacherJson.numberOfClasses = numberOfClasses;
    teacherJson.numberOfStudents = numberOfStudents;

    res.json(teacherJson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeacherLessons = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const lessons = await ClassMeeting.findAll({
      where: { teacherId },
    });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeachers = async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: { role: "teacher" },
      attributes: ["id", "name", "email"],
    });

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getStudentsByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await ClassMeeting.findByPk(lessonId, {
      include: [
        {
          model: Student,
          as: "students",
          through: { attributes: [] }, 
        },
      ],
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.json(lesson.students);
  } catch (error) {
    console.error("❌ getStudentsByLesson error:", error);
    res.status(500).json({ error: "Failed to fetch students for the lesson" });
  }
};


export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, email, classIds = [] } = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (name) student.name = name;
    if (email) student.email = email;
    await student.save();

    if (Array.isArray(classIds)) {
      const validClasses = await ClassMeeting.findAll({
        where: { id: classIds },
      });
      await student.setClasses(validClasses);
    }

    res.json({
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    console.error("❌ Error updating student:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};



export const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { className, meetingId, teacherId, studentIds } = req.body;

    const lesson = await ClassMeeting.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    if (className) lesson.className = className;
    if (meetingId) lesson.meetingId = meetingId;
    if (teacherId) lesson.teacherId = teacherId;

    await lesson.save();

   
    if (Array.isArray(studentIds)) {
      const validStudents = await Student.findAll({ where: { id: studentIds } });
      await lesson.setStudents(validStudents);
    }

    res.json({ message: "Lesson updated", lesson });
  } catch (error) {
    console.error("❌ Error updating lesson:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { name, email, password, classIds = [], studentIds = [] } = req.body;

    const teacher = await User.findOne({
      where: { id: teacherId, role: "teacher" },
      include: [{ model: Student, as: "students" }],
    });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });

    if (!isAuthorized(req.user, teacher)) {
      return res.status(403).json({ error: "Access denied" });
    }

    
    if (name && name.trim()) teacher.name = name.trim();
    if (email && email.trim()) teacher.email = email.trim();

    if (password !== undefined && password.trim()) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      teacher.password = hashedPassword;
    }

    await teacher.save();

    
    if (Array.isArray(classIds)) {
      const existingLessons = await ClassMeeting.findAll({ where: { teacherId: teacher.id } });
      const existingIds = existingLessons.map((l) => l.id);

      const toRemove = existingIds.filter((id) => !classIds.includes(id));
      const toAdd = classIds.filter((id) => !existingIds.includes(id));

      if (toRemove.length > 0) {
        await ClassMeeting.update(
          { teacherId: null },
          { where: { id: toRemove } }
        );
      }

      if (toAdd.length > 0) {
        await ClassMeeting.update(
          { teacherId: teacher.id },
          { where: { id: toAdd } }
        );
      }
    }

    
    if (Array.isArray(studentIds)) {
      const students = await Student.findAll({ where: { id: studentIds } });
      await teacher.setStudents(students); 
    }

    res.json({ success: true, teacherId: teacher.id, teacher });
  } catch (error) {
    console.error("❌ Error updating teacher:", error);
    res.status(500).json({ error: error.message });
  }
};
