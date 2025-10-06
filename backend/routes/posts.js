const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Post = require('../models/Post');
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
        folder: 'social-chat-app/posts'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });
};

// Extract hashtags and mentions from caption
const extractHashtagsAndMentions = (caption) => {
  const hashtags = [];
  const mentions = [];
  
  if (caption) {
    // Extract hashtags
    const hashtagMatches = caption.match(/#[\w]+/g);
    if (hashtagMatches) {
      hashtags.push(...hashtagMatches.map(tag => tag.substring(1).toLowerCase()));
    }
    
    // Extract mentions
    const mentionMatches = caption.match(/@[\w]+/g);
    if (mentionMatches) {
      mentions.push(...mentionMatches.map(mention => mention.substring(1)));
    }
  }
  
  return { hashtags, mentions };
};

// Create post
router.post('/', authenticateToken, upload.array('media', 10), [
  body('caption')
    .optional()
    .isLength({ max: 2200 })
    .withMessage('Caption must be less than 2200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { caption, location } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'At least one media file is required' });
    }

    // Upload media files to Cloudinary
    const mediaUrls = [];
    let mediaType = 'image';

    for (const file of files) {
      try {
        const result = await uploadToCloudinary(file);
        mediaUrls.push(result.secure_url);
        
        if (result.resource_type === 'video') {
          mediaType = 'video';
        }
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ message: 'Failed to upload media' });
      }
    }

    if (mediaUrls.length > 1) {
      mediaType = 'carousel';
    }

    // Extract hashtags and mentions
    const { hashtags, mentions } = extractHashtagsAndMentions(caption);

    // Find mentioned users
    const mentionedUsers = await User.find({ username: { $in: mentions } }).select('_id');

    // Create post
    const post = new Post({
      userId: req.user._id,
      caption,
      media: mediaUrls,
      mediaType,
      hashtags,
      mentions: mentionedUsers.map(user => user._id),
      location: location ? { name: location } : undefined
    });

    await post.save();

    // Create notifications for mentioned users
    for (const mentionedUser of mentionedUsers) {
      if (mentionedUser._id.toString() !== req.user._id.toString()) {
        const notification = new Notification({
          userId: mentionedUser._id,
          fromUserId: req.user._id,
          type: 'mention',
          title: 'You were mentioned',
          message: `${req.user.username} mentioned you in a post`,
          data: { postId: post._id }
        });
        await notification.save();
      }
    }

    // Populate post with user data
    await post.populate('userId', 'username profilePic');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feed posts
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get posts from followed users and current user
    const feedPosts = await Post.find({
      userId: { $in: [...req.user.following, req.user._id] },
      isArchived: false
    })
    .populate('userId', 'username profilePic isVerified')
    .populate('likes', 'username')
    .populate('comments.userId', 'username profilePic')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

    res.json({ posts: feedPosts });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('userId', 'username profilePic isVerified')
      .populate('likes', 'username')
      .populate('comments.userId', 'username profilePic');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: req.user._id }
      });
    } else {
      // Like
      await Post.findByIdAndUpdate(postId, {
        $addToSet: { likes: req.user._id }
      });

      // Create notification (only if not liking own post)
      if (post.userId.toString() !== req.user._id.toString()) {
        const notification = new Notification({
          userId: post.userId,
          fromUserId: req.user._id,
          type: 'like',
          title: 'New Like',
          message: `${req.user.username} liked your post`,
          data: { postId: post._id }
        });
        await notification.save();
      }
    }

    res.json({ 
      message: isLiked ? 'Post unliked' : 'Post liked',
      isLiked: !isLiked
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:postId/comment', authenticateToken, [
  body('text')
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 500 })
    .withMessage('Comment must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId } = req.params;
    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      userId: req.user._id,
      text
    };

    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment }
    });

    // Create notification (only if not commenting on own post)
    if (post.userId.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        userId: post.userId,
        fromUserId: req.user._id,
        type: 'comment',
        title: 'New Comment',
        message: `${req.user.username} commented on your post`,
        data: { postId: post._id }
      });
      await notification.save();
    }

    // Populate comment with user data
    comment.userId = await User.findById(req.user._id).select('username profilePic');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share post
router.post('/:postId/share', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add to shares
    await Post.findByIdAndUpdate(postId, {
      $addToSet: { 
        shares: { 
          userId: req.user._id 
        } 
      }
    });

    // Create notification (only if not sharing own post)
    if (post.userId.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        userId: post.userId,
        fromUserId: req.user._id,
        type: 'post_share',
        title: 'Post Shared',
        message: `${req.user.username} shared your post`,
        data: { postId: post._id }
      });
      await notification.save();
    }

    res.json({ message: 'Post shared successfully' });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
