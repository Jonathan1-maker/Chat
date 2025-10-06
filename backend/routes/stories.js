const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Story = require('../models/Story');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Upload media to Cloudinary
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'social-chat-app/stories'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });
};

// Create story
router.post('/', authenticateToken, upload.single('media'), [
  body('caption')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Caption must be less than 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { caption } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    // Upload media to Cloudinary
    let mediaUrl, mediaType;
    try {
      const result = await uploadToCloudinary(file);
      mediaUrl = result.secure_url;
      mediaType = result.resource_type === 'video' ? 'video' : 'image';
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return res.status(500).json({ message: 'Failed to upload media' });
    }

    // Create story
    const story = new Story({
      userId: req.user._id,
      media: mediaUrl,
      mediaType,
      caption
    });

    await story.save();
    await story.populate('userId', 'username profilePic');

    res.status(201).json({
      message: 'Story created successfully',
      story
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stories feed
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    // Get stories from followed users and current user
    const stories = await Story.find({
      userId: { $in: [...req.user.following, req.user._id] },
      expiresAt: { $gt: new Date() }
    })
    .populate('userId', 'username profilePic')
    .sort({ createdAt: -1 });

    // Group stories by user
    const storiesByUser = {};
    stories.forEach(story => {
      const userId = story.userId._id.toString();
      if (!storiesByUser[userId]) {
        storiesByUser[userId] = {
          user: story.userId,
          stories: []
        };
      }
      storiesByUser[userId].stories.push(story);
    });

    res.json({ storiesByUser });
  } catch (error) {
    console.error('Get stories feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single story
router.get('/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId)
      .populate('userId', 'username profilePic')
      .populate('viewers.userId', 'username profilePic')
      .populate('reactions.userId', 'username profilePic')
      .populate('replies.userId', 'username profilePic');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if story has expired
    if (story.expiresAt < new Date()) {
      return res.status(404).json({ message: 'Story has expired' });
    }

    res.json({ story });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// View story
router.post('/:storyId/view', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if story has expired
    if (story.expiresAt < new Date()) {
      return res.status(404).json({ message: 'Story has expired' });
    }

    // Check if user has already viewed this story
    const hasViewed = story.viewers.some(
      viewer => viewer.userId.toString() === req.user._id.toString()
    );

    if (!hasViewed) {
      // Add viewer
      await Story.findByIdAndUpdate(storyId, {
        $addToSet: { viewers: { userId: req.user._id } }
      });

      // Create notification (only if not viewing own story)
      if (story.userId.toString() !== req.user._id.toString()) {
        const notification = new Notification({
          userId: story.userId,
          fromUserId: req.user._id,
          type: 'story_view',
          title: 'Story View',
          message: `${req.user.username} viewed your story`,
          data: { storyId: story._id }
        });
        await notification.save();
      }
    }

    res.json({ message: 'Story viewed successfully' });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reaction to story
router.post('/:storyId/reaction', authenticateToken, [
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storyId } = req.params;
    const { emoji } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if story has expired
    if (story.expiresAt < new Date()) {
      return res.status(404).json({ message: 'Story has expired' });
    }

    // Remove existing reaction from this user
    await Story.findByIdAndUpdate(storyId, {
      $pull: { reactions: { userId: req.user._id } }
    });

    // Add new reaction
    await Story.findByIdAndUpdate(storyId, {
      $push: { reactions: { userId: req.user._id, emoji } }
    });

    // Create notification (only if not reacting to own story)
    if (story.userId.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        userId: story.userId,
        fromUserId: req.user._id,
        type: 'story_reaction',
        title: 'Story Reaction',
        message: `${req.user.username} reacted to your story`,
        data: { storyId: story._id }
      });
      await notification.save();
    }

    res.json({ message: 'Reaction added successfully' });
  } catch (error) {
    console.error('Add story reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reply to story
router.post('/:storyId/reply', authenticateToken, [
  body('text')
    .notEmpty()
    .withMessage('Reply text is required')
    .isLength({ max: 200 })
    .withMessage('Reply must be less than 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storyId } = req.params;
    const { text } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if story has expired
    if (story.expiresAt < new Date()) {
      return res.status(404).json({ message: 'Story has expired' });
    }

    const reply = {
      userId: req.user._id,
      text
    };

    await Story.findByIdAndUpdate(storyId, {
      $push: { replies: reply }
    });

    // Create notification (only if not replying to own story)
    if (story.userId.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        userId: story.userId,
        fromUserId: req.user._id,
        type: 'story_reply',
        title: 'Story Reply',
        message: `${req.user.username} replied to your story`,
        data: { storyId: story._id }
      });
      await notification.save();
    }

    // Populate reply with user data
    reply.userId = await User.findById(req.user._id).select('username profilePic');

    res.status(201).json({
      message: 'Reply added successfully',
      reply
    });
  } catch (error) {
    console.error('Add story reply error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get story viewers
router.get('/:storyId/viewers', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId)
      .populate('viewers.userId', 'username profilePic');

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user owns the story
    if (story.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view story viewers' });
    }

    res.json({ viewers: story.viewers });
  } catch (error) {
    console.error('Get story viewers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete story
router.delete('/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user owns the story
    if (story.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    await Story.findByIdAndDelete(storyId);

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
