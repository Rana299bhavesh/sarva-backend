const Activity = require('../models/Activity');
const { GoogleGenerativeAI } = require('@google/generative-ai');


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'missing_key');


async function generateGeminiPulse(stats, subjectInsights, teacherId) {
  if (!process.env.GEMINI_API_KEY) {
    return [" Gemini API key is missing in your .env file!"];
  }

  try {
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const topSubjects = subjectInsights.slice(0, 2).map(s => s._id).join(' and ');
    const context = teacherId ? "a specific teacher" : "the whole school";

    const prompt = `
      You are an AI data analyst for a school dashboard. 
      Analyze this week's content creation data for ${context}:
      - Lessons created: ${stats.lesson || 0}
      - Quizzes conducted: ${stats.quiz || 0}
      - Assessments assigned: ${stats.assessment || 0}
      - Top active subjects: ${topSubjects || 'None yet'}

      Write exactly 2 very short, professional, and encouraging insight sentences about this data. 
      Do not use markdown, bolding, or bullet points. Just return the two sentences separated by a new line.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Split the text into an array so our React frontend can map over it easily
    return text.split('\n').filter(line => line.trim() !== '');
    
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return ["💡 Activity volumes are stable, but AI analysis is currently sleeping."];
  }
}

// --- Main Dashboard Endpoint ---
exports.getDashboardInsights = async (req, res, next) => {
  try {
    const { teacher_id } = req.query;
    const matchStage = teacher_id ? { $match: { teacher_id } } : { $match: {} };

 
    const totals = await Activity.aggregate([
      matchStage,
      { $group: { _id: '$activity_type', count: { $sum: 1 } } }
    ]);

    const stats = { lesson: 0, quiz: 0, assessment: 0 };
    totals.forEach(t => { stats[t._id] = t.count; });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trends = await Activity.aggregate([
      { $match: { ...matchStage.$match, created_at: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, type: "$activity_type" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);
    console.log("1. Database queries finished successfully. Calling Gemini...");
    // 3. Subject Insights
    let subjectInsights = [];
    if (teacher_id) {
      subjectInsights = await Activity.aggregate([
        matchStage,
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    }

    
    const aiPulse = await generateGeminiPulse(stats, subjectInsights, teacher_id);
    console.log("2. Gemini successfully replied! Sending data to frontend...");
    
    const chartData = {};
    trends.forEach(item => {
      const date = item._id.date;
      const type = item._id.type;
      if (!chartData[date]) chartData[date] = { date, lesson: 0, quiz: 0, assessment: 0 };
      chartData[date][type] = item.count;
    });

    res.status(200).json({
      success: true,
      data: { 
        stats, 
        trends: Object.values(chartData), 
        subjectInsights,
        aiPulse 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTeachersList = async (req, res, next) => {
  try {
    const teachers = await Activity.aggregate([
      { $group: { _id: "$teacher_id", name: { $first: "$teacher_name" } } },
      { $project: { teacher_id: "$_id", name: 1, _id: 0 } },
      { $sort: { name: 1 } }
    ]);
    res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};