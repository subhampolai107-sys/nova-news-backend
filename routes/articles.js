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

router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ANALYTICS SUMMARY (must stay BEFORE the /:id route)
router.get('/analytics/summary', async (req, res) => {
  try {
    const totalArticles = await Article.countDocuments();

    const categoryBreakdown = await Article.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const topArticles = await Article.find()
      .sort({ views: -1 })
      .limit(5)
      .select('title views category');

    const totalViews = await Article.aggregate([
      { $group: { _id: null, total: { $sum: "$views" } } }
    ]);

    res.json({
      totalArticles,
      totalViews: totalViews[0] ? totalViews[0].total : 0,
      categoryBreakdown,
      topArticles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TRENDING - Latest 5 articles (must stay BEFORE the /:id route below)
router.get('/trending', async (req, res) => {
  try {
    const trending = await Article.find().sort({ createdAt: -1 }).limit(5);
    res.json(trending);
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