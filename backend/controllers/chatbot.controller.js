const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const { askWebsiteChatbot } = require('../services/chatbot.service');

const askChatbotController = asyncHandler(async (req, res) => {
  const chatbot = await askWebsiteChatbot({
    message: req.body?.message,
    history: req.body?.history,
  });

  return sendSuccess(
    res,
    'Chatbot response generated successfully',
    chatbot,
  );
});

module.exports = {
  askChatbotController,
};
