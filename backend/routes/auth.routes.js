const express = require('express');
const {
  login,
  profile,
  signup,
  updateProfile,
} = require('../controllers/auth.controller');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', protect, profile);
router.patch('/profile', protect, updateProfile);

module.exports = router;
