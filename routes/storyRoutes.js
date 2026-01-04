const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const authMiddleware = require('../middleware/auth');

router.get('/', storyController.getAllStories);
router.get('/stats', storyController.getStats);
router.get('/map', storyController.getStoriesForMap);
router.get('/my', authMiddleware, storyController.getMyStories);
router.get('/:id', storyController.getStoryById);
router.post('/', authMiddleware, storyController.createStory);
router.put('/:id', authMiddleware, storyController.updateStory);
router.delete('/:id', authMiddleware, storyController.deleteStory);

module.exports = router;