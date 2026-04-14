const express = require('express');
const { login, profile, signup } = require('../controllers/auth.controller');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', protect, profile);

module.exports = router;
