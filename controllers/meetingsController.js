const { createMeetingInVideoSDK, getMeetingFromDB } = require("../services/meetingService");

// 📌 Функция для создания встречи
exports.createMeeting = async (req, res) => {
  try {
    const { className } = req.body;
    
    if (!className) {
      return res.status(400).json({ error: "className is required" });
    }

    console.log(`[meetingsController] 🔍 Ищем встречу для класса: ${className}`);
    
    // Проверяем, существует ли встреча
    let meeting = await getMeetingFromDB(className);
    if (!meeting) {
      console.log(`[meetingsController] ❌ Встреча не найдена, создаем новую...`);
      meeting = await createMeetingInVideoSDK(className);
    }

    return res.json({ meetingId: meeting.meetingId });
  } catch (error) {
    console.error("[meetingsController] ❌ Ошибка:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 Функция для получения `meetingId` по `className`
exports.getMeetingByClass = async (req, res) => {
  try {
    const { className } = req.params;

    if (!className) {
      return res.status(400).json({ error: "className is required" });
    }

    console.log(`[meetingsController] 🔍 Получаем meetingId для класса: ${className}`);
    
    const meeting = await getMeetingFromDB(className);
    
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    return res.json({ meetingId: meeting.meetingId });
  } catch (error) {
    console.error("[meetingsController] ❌ Ошибка:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
