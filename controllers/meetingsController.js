const { createMeetingInVideoSDK, getMeetingFromDB } = require("../services/meetingService");


exports.createMeeting = async (req, res) => {
  try {
    const { className } = req.body;
    
    if (!className) {
      return res.status(400).json({ error: "className is required" });
    }

    console.log(`[meetingsController] 🔍 Looking for a class meeting: ${className}`);
    
    
    let meeting = await getMeetingFromDB(className);
    if (!meeting) {
      console.log(`[meetingsController] ❌ Meeting not found, creating a new one...`);
      meeting = await createMeetingInVideoSDK(className);
    }

    return res.json({ meetingId: meeting.meetingId });
  } catch (error) {
    console.error("[meetingsController] ❌ error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getMeetingByClass = async (req, res) => {
  try {
    const { className } = req.params;

    if (!className) {
      return res.status(400).json({ error: "className is required" });
    }

    console.log(`[meetingsController] 🔍 We get meetingId for the class: ${className}`);
    
    const meeting = await getMeetingFromDB(className);
    
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    return res.json({ meetingId: meeting.meetingId });
  } catch (error) {
    console.error("[meetingsController] ❌ error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
