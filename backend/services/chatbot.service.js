const { createError } = require('../utils/response');

const WEBSITE_KNOWLEDGE = `
MediCare AI is an AI-powered telemedicine and health assistant platform.

Core product areas:
- Authentication: signup, login, and profile access.
- Dashboard: central hub for all product modules.
- Symptom Checker: users can submit symptoms and receive AI-based risk guidance.
- Report Analysis: users can upload PDF, image, or text medical reports and receive OCR + AI summaries.
- Doctors: users can browse a static doctor directory with consultation fees, specialization, mode, and ratings.
- Reminders: users can create, view, and delete medicine reminders with time schedules.
- SOS: users can trigger emergency support with message, symptoms, contacts, and optional location.
- Appointment Booking: users can book online or offline consultations and join meeting links for online sessions.

Important guidance:
- The chatbot should explain platform features, navigation, and how to use each section.
- The chatbot should not claim to be a doctor or provide a final medical diagnosis.
- If the user asks a medical question, it should guide them to the Symptom Checker, Report Analysis, SOS, or a doctor consultation depending on urgency.
- If the user asks about appointments, explain doctor list, fee, date/time selection, and join consultation flow.
- If the user asks about reports, explain upload and analysis.
- If the user asks about reminders, explain schedule creation and list management.
- If the user asks about SOS, explain that it records emergency details and returns priority guidance.
- If the user asks how to contact a doctor, explain using Doctors and Appointment pages.

Website navigation map:
- /dashboard
- /symptom-checker
- /report-analysis
- /doctors
- /reminder
- /appointment
- /sos
`;

const buildFallbackAnswer = (message = '') => {
  const text = String(message).trim().toLowerCase();

  if (!text) {
    return {
      reply: 'MediCare AI me aap symptom check, report analysis, doctor booking, reminders, aur SOS support use kar sakte ho. Aap kis feature ke baare me poochna chahte ho?',
      suggestions: ['Symptom Checker kaise use karein?', 'Doctor appointment kaise book karein?', 'Report upload kaise karein?'],
      provider: 'local-fallback',
    };
  }

  if (text.includes('doctor') || text.includes('appointment') || text.includes('consult')) {
    return {
      reply: 'Doctor se consultation ke liye pehle Doctors page par specialist choose karo. Phir Appointment page me date, time, aur mode select karke booking karo. Online consult me meeting link generate hota hai jise Join Consultation button se open kar sakte ho.',
      suggestions: ['Consultation fee kaha dikhegi?', 'Online meeting link kaise milega?', 'Doctor ka specialization kaise choose karun?'],
      provider: 'local-fallback',
    };
  }

  if (text.includes('symptom')) {
    return {
      reply: 'Symptom Checker page par symptoms, duration, severity, aur optional notes bharne ke baad AI-based risk summary milti hai. Result me issue summary, risk level, aur recommended next steps dikhte hain.',
      suggestions: ['Risk level ka kya meaning hota hai?', 'Symptom history kaha dikhegi?', 'Kya isse doctor consultation bhi book kar sakta hoon?'],
      provider: 'local-fallback',
    };
  }

  if (text.includes('report')) {
    return {
      reply: 'Report Analysis page par aap PDF, image, ya text report upload kar sakte ho. System OCR se text nikalta hai aur AI summary, observations, abnormal indicators, aur recommendations show karta hai.',
      suggestions: ['Kaunse file types supported hain?', 'Report history kaha save hoti hai?', 'Follow-up level ka kya meaning hai?'],
      provider: 'local-fallback',
    };
  }

  if (text.includes('reminder') || text.includes('medicine')) {
    return {
      reply: 'Reminder page me medicine name, dosage, start date, time slots, aur optional repeat schedule dekar medicine reminder create kar sakte ho. Created reminders list me dikhte hain aur delete bhi kiye ja sakte hain.',
      suggestions: ['Daily reminder kaise set karun?', 'Multiple time slots add ho sakte hain?', 'Reminder delete kaise karun?'],
      provider: 'local-fallback',
    };
  }

  if (text.includes('sos') || text.includes('emergency')) {
    return {
      reply: 'SOS page par emergency type, message, symptoms, contacts, aur location details dekar urgent support request record kar sakte ho. System priority, immediate actions, aur escalation advice return karta hai.',
      suggestions: ['Emergency location kaise bheju?', 'SOS kis kaam aata hai?', 'Critical case me kya karna chahiye?'],
      provider: 'local-fallback',
    };
  }

  return {
    reply: 'MediCare AI ek health assistant platform hai jahan aap login/signup, symptom checker, report analysis, doctor consultation booking, reminders, aur SOS support use kar sakte ho. Agar aap kisi specific feature ke baare me poochoge to main uska exact flow bata dunga.',
    suggestions: ['App ke main features batao', 'Doctor booking ka flow samjhao', 'Report analysis kaise use hota hai?'],
    provider: 'local-fallback',
  };
};

const normalizeHistory = (history = []) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content || '').trim(),
    }))
    .filter((item) => item.content)
    .slice(-8);
};

const callGroqChat = async ({ message, history = [] }) => {
  if (!process.env.GROQ_API_KEY) {
    throw createError('GROQ_API_KEY is not configured on the server', 500);
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are the website help assistant for MediCare AI.
Your job is to explain how this web app works, what features it provides, and how users can use them.
Use concise Hinglish when helpful because the user may be more comfortable with Hindi mixed with English.
Stay focused on product guidance and usage help.
Do not provide final diagnoses or professional medical treatment instructions.
If the user sounds urgent or medically unsafe, tell them to use SOS or consult a doctor immediately.
Use the following product knowledge:
${WEBSITE_KNOWLEDGE}`,
        },
        ...normalizeHistory(history),
        {
          role: 'user',
          content: String(message).trim(),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const reply = String(data.choices?.[0]?.message?.content || '').trim();

  if (!reply) {
    throw new Error('Groq returned an empty chatbot response');
  }

  return {
    reply,
    suggestions: [],
    provider: 'groq',
  };
};

const askWebsiteChatbot = async ({ message, history = [] }) => {
  const cleanMessage = String(message || '').trim();

  if (!cleanMessage) {
    throw createError('message is required', 400);
  }

  try {
    return await callGroqChat({
      message: cleanMessage,
      history,
    });
  } catch (error) {
    console.error(`[chatbot] Falling back to local responses: ${error.message}`);
    return buildFallbackAnswer(cleanMessage);
  }
};

module.exports = {
  askWebsiteChatbot,
};
