import { v4 as uuidv4 } from "uuid";
import slugify from "slugify";
import { User, ClassMeeting } from "../models/index.js";

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
    if (!lastName) {
      lastName = teacher.name;
    }
    const teacherLastNameSlug = slugify(lastName, { lower: true });
    const classNameSlug = slugify(className, { lower: true });

    const classUrl = `/${meetingId}/${teacherLastNameSlug}/${classNameSlug}`;

    const existingMeeting = await ClassMeeting.findOne({ where: { className } });

    if (existingMeeting) {
      existingMeeting.meetingId = meetingId;
      existingMeeting.classUrl = classUrl;

      await existingMeeting.save();

      return res.json({
        message: "✅ Meeting updated",
        meeting: existingMeeting,
      });
    }

    const newSlug = uuidv4();
    const newMeeting = await ClassMeeting.create({
      className,
      meetingId,
      teacherId: teacher.id,
      classUrl,
      teacherName: teacherLastNameSlug,
      slug: newSlug,
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

export const getMeetingBySlugTeacherNameClass = async (req, res) => {
  try {
    const { slug, teacherName, className } = req.params;
    console.log("Request to get meeting with parameters:", { slug, teacherName, className });

    const fullUrl = `${slug}/${teacherName}/${className}`;
    console.log("Forming classUrl for search:", fullUrl);

    const meeting = await ClassMeeting.findOne({
      where: { classUrl: fullUrl },
    });

    console.log("Found meeting:", meeting);

    if (!meeting) {
      console.log("Meeting not found");
      return res.status(404).json({ error: "Meeting not found" });
    }

    console.log("✅ Meeting found, sending data");
    return res.json({
      message: "✅ Meeting found",
      meeting,
    });
  } catch (error) {
    console.error("❌ Error getting meeting:", error);
    res.status(500).json({ error: "Server error" });
  }
};
