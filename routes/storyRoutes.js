const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const authMiddleware = require('../middleware/auth');

router.get('/stats', storyController.getStats);
router.get('/map', storyController.getStoriesForMap);

router.get('/my-stories', authMiddleware, storyController.getMyStories);

router.get('/', storyController.getAllStories);

router.get('/:id', storyController.getStoryById);
router.post('/:id/view', storyController.incrementView);

router.post('/', authMiddleware, storyController.createStory);
router.put('/:id', authMiddleware, storyController.updateStory);
router.delete('/:id', authMiddleware, storyController.deleteStory);

module.exports = router;