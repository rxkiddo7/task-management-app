const router = require('express').Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
router.use(auth);

router.get('/', async (req, res, next) => {
  try { res.json(await Task.find({ user: req.userId }).sort({ createdAt: -1 })); }
  catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Task title is required' });
    const task = await Task.create({
      user: req.userId, title, description, priority, dueDate: dueDate || null
    });
    res.status(201).json(task);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'priority', 'status', 'dueDate'];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
    if (update.title !== undefined && !update.title.trim())
      return res.status(400).json({ message: 'Task title cannot be empty' });
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId }, update, { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
});
module.exports = router;
