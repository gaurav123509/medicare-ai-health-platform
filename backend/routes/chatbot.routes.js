const express = require('express');
const { askChatbotController } = require('../controllers/chatbot.controller');

const router = express.Router();

router.post('/ask', askChatbotController);

module.exports = router;
