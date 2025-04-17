import User from "../models/User.js";
import ClassMeeting from "../models/ClassMeeting.js";
import Student from "../models/Student.js";
import StudentTeacher from "../models/StudentTeacher.js";
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
      return res.status(403).json({ error: "Access denied" });
    }

    if (!name || !email || !password || !schoolName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      schoolName,
    });

    res.status(201).json({
      message: "School Admin created successfully",
      admin: newAdmin,
    });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, schoolName } = req.body;

  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const admin = await User.findByPk(id);
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ error: "School Admin not found" });
    }

    admin.name = name ?? admin.name;
    admin.email = email ?? admin.email;
    admin.schoolName = schoolName ?? admin.schoolName;

    if (password) {
      admin.password = await bcrypt.hash(password, 10);
    }

    await admin.save();
    res.json({ message: "School Admin updated", admin });
  } catch (err) {
    console.error("Error updating admin:", err);
    res.status(500).json({ error: "Server error" });
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
  try {
    const { teacherName, teacherEmail, teacherPassword } = req.body;

    if (!teacherName || !teacherEmail || !teacherPassword) {
      return res.status(400).json({ error: "Fill in all fields" });
    }

    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

   
    const hashedPassword = await bcrypt.hash(teacherPassword, 10);

    const teacher = await User.create({
      name: teacherName,
      email: teacherEmail,
      password: hashedPassword,
      role: "teacher",
      adminId: req.user.adminId || null
    });

    res.status(201).json(teacher);
  } catch (error) {
    console.error("❌ Error creating teacher:", error);
    res.status(500).json({ error: error.message });
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
  const { className, teacherId, studentIds, adminId } = req.body;

  try {
    const cls = await ClassMeeting.findByPk(classId);
    if (!cls) {
      return res.status(404).json({ error: "Class not found" });
    }

    cls.className = className || cls.className;
    cls.teacherId = teacherId || cls.teacherId;
    cls.adminId = adminId || cls.adminId;
    if (className || teacherId) {
      const teacherLastName = (await cls.getTeacher()).name?.split(" ")[1] || "teacher";
      const slug = cls.slug || "slug"; // оставить старый или сгенерировать заново
      cls.classUrl = `/meet-${slug}/${teacherLastName}/${className}`;
    }

    await cls.save();

    if (Array.isArray(studentIds)) {
      await cls.setStudents(studentIds); 
    }

    res.json({ message: "Class updated successfully", class: cls });
  } catch (error) {
    console.error("❌ Failed to update class:", error);
    res.status(500).json({ error: "Failed to update class" });
  }
};


export const createClass = async (req, res) => {
  try {
    const { className, teacherId, studentIds } = req.body;
    if (!className || !teacherId) {
      return res.status(400).json({ error: "Fill in class name and select a teacher" });
    }

    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const teacher = await User.findByPk(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(400).json({ error: "Invalid teacher ID" });
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

    if (studentIds && Array.isArray(studentIds)) {
      const students = await Student.findAll({ where: { id: studentIds } });
      await newClass.addStudents(students);
    }

    res.status(201).json(newClass);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
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
          include: [{ model: User, as: "admin" }], // подключаем админа учителя
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
  try {
    const { studentName, studentEmail, classIds = [], teacherIds = [] } = req.body;

    if (!studentName || !studentEmail || !Array.isArray(classIds) || !Array.isArray(teacherIds)) {
      return res.status(400).json({ error: "Fill in name, email and select classes/teachers" });
    }

    const student = await Student.create({ name: studentName, email: studentEmail });

    if (classIds.length) {
      const classes = await ClassMeeting.findAll({ where: { id: classIds } });
      await student.addClasses(classes);
    }

    if (teacherIds.length) {
      const teachers = await User.findAll({ where: { id: teacherIds, role: "teacher" } });
      await student.addTeachers(teachers);
    }

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
