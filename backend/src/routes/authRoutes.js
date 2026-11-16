const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const tokenFor = id => jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const normalized = email.toLowerCase().trim();
    if (await User.findOne({ email: normalized }))
      return res.status(409).json({ message: 'Email is already registered' });
    const user = await User.create({
      name: name.trim(), email: normalized, password: await bcrypt.hash(password, 12)
    });
    res.status(201).json({
      token: tokenFor(user._id),
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: tokenFor(user._id), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});
module.exports = router;
