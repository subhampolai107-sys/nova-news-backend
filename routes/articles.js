const express = require('express');
const Article = require('../models/Article');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// CREATE - Naya article add karo (protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, imageUrl, category } = req.body;
    const article = new Article({
      title,
      description,
      imageUrl,
      category,
      author: req.user.role === 'admin' ? 'Admin' : 'User',
      createdBy: req.user.id
    });
    await article.save();
    res.status(201).json({ message: "Article created successfully!", article });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ - Saare articles dekho (public, koi bhi dekh sakta hai)
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ - Ek specific article dekho by ID
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - Article edit karo (protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json({ message: "Article updated successfully!", article });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - Article delete karo (protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json({ message: "Article deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;