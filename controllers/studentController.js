import { Student, ClassMeeting } from "../models/index.js";
import { Op } from "sequelize";

export const checkStudentAccess = async (req, res) => {
  const { slug	, email } = req.body;

  if (!slug	 || !email) {
    return res.status(400).json({ error: "Missing meetingId or email" });
  }

  try {
    
    const classMeeting = await ClassMeeting.findOne({ where: { slug } });
    if (!classMeeting) {
      return res.status(404).json({ error: "Lesson not found" });
    }

  
    const student = await Student.findOne({ where: { email } });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    
    const isRelated = await classMeeting.hasStudent(student);

    return res.json({ access: isRelated });
  } catch (err) {
    console.error("❌ Access check error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getStudentsForTeacher = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const meetings = await ClassMeeting.findAll({
      where: { teacherId },
      include: [{ model: Student, through: { attributes: [] } }],
    });

    const studentMap = {};
    meetings.forEach(meeting => {
      if (meeting.Students && meeting.Students.length) {
        meeting.Students.forEach(student => {
          studentMap[student.id] = student;
        });
      }
    });

    const students = Object.values(studentMap);
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Server error" });
  }
};
