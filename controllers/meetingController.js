import { v4 as uuidv4 } from "uuid";
import slugify from "slugify";
import { User, ClassMeeting,Student } from "../models/index.js";
import { Op } from "sequelize";


export const getUserRoleByEmail = async (req, res) => {
  const { email } = req.body;

 

  try {
    const student = await Student.findOne({ where: { email } });
    if (student) {
   
      return res.json({ role: "student" });
    } else {
      console.log("❌ No student found with email:", email);
    }

    const teacher = await User.findOne({ where: { email } });
    if (teacher) {
  
      return res.json({ role: "teacher" });
    } else {
      console.log("❌ No teacher found with email:", email);
    }

    
    return res.status(404).json({ message: "User not found" });

  } catch (err) {
    console.error("❗ Error checking user role:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



export const saveMeeting = async (req, res) => {
  try {
    const { className, meetingId, teacherEmail } = req.body;

    if (!className || !meetingId || !teacherEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const teacher = await User.findOne({ where: { email: teacherEmail } });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }


    let [, lastName] = teacher.name.split("_");
    if (!lastName) lastName = teacher.name;

    const teacherLastNameSlug = slugify(lastName, { lower: false });
    const classNameSlug = slugify(className, { lower: false });

    const existingMeeting = await ClassMeeting.findOne({
      where: {
        className: { [Op.iLike]: className },
      },
    });

    if (existingMeeting) {
      existingMeeting.meetingId = meetingId;

      await existingMeeting.save();

      return res.json({
        message: "✅ Meeting updated (slug preserved)",
        meeting: existingMeeting,
      });
    }

    const generatedSlug = "meet-" + Math.random().toString(36).substring(2, 8);
    const classUrl = `/${generatedSlug}/${teacherLastNameSlug}/${classNameSlug}`;

    const newMeeting = await ClassMeeting.create({
      className,
      meetingId,
      teacherId: teacher.id,
      classUrl,
      teacherName: teacherLastNameSlug,
      slug: generatedSlug,
    });

    return res.status(201).json({
      message: "✅ New meeting saved",
      meeting: newMeeting,
    });
  } catch (error) {
    console.error("❌ Error saving meeting:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const getClassNameByMeetingId = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await ClassMeeting.findOne({
      where: { meetingId },
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    return res.json({ className: meeting.className });
  } catch (error) {
    console.error("❌ Error fetching className by meetingId:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const checkAccessToClass = async (req, res) => {
  try {
    const { email, className } = req.body;

    if (!email || !className) {
      return res.status(400).json({ error: "Missing email or className" });
    }


    const meeting = await ClassMeeting.findOne({
      where: { className: { [Op.iLike]: className } },
    });

    if (!meeting) {
      return res.status(404).json({ error: "Class not found" });
    }


    const teacher = await User.findOne({ where: { email } });
    if (teacher && teacher.id === meeting.teacherId) {
      return res.json({ access: true, role: "teacher" });
    }

    const student = await Student.findOne({ where: { email } });
    if (student) {
      return res.json({ access: true, role: "student" });
    }

    return res.status(403).json({ access: false, error: "Access denied" });
  } catch (error) {
    console.error("❌ Error checking access:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const getMeetingByClassName = async (req, res) => {
  try {
    const { className } = req.params;

    if (!className) {
      return res.status(400).json({ error: "Missing className parameter" });
    }


    const meeting = await ClassMeeting.findOne({
      where: {
        className: {
          [Op.iLike]: className,
        },
      },
      attributes: ["meetingId", "updatedAt"], 
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    return res.json({ meeting });
  } catch (error) {
    console.error("❌ Error fetching meeting by className:", error);
    return res.status(500).json({ error: "Server error" });
  }
};



export const getMeetingBySlugTeacherNameClass = async (req, res) => {
  try {
    const { slug, teacherName, className } = req.params;


    const fullUrl = `${slug}/${teacherName}/${className}`;
 

    const meeting = await ClassMeeting.findOne({
      where: { classUrl: fullUrl },
    });

  

    if (!meeting) {
    
      return res.status(404).json({ error: "Meeting not found" });
    }

    return res.json({
      message: "✅ Meeting found",
      meeting,
    });
  } catch (error) {
    console.error("❌ Error getting meeting:", error);
    res.status(500).json({ error: "Server error" });
  }
};
