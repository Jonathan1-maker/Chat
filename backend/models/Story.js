const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: {
    type: String, // Cloudinary URL
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  caption: {
    type: String,
    maxlength: 200,
    default: ''
  },
  viewers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: 200
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  highlightTitle: {
    type: String,
    maxlength: 50
  }
}, {
  timestamps: true
});

// Indexes for better performance
storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired stories
storySchema.index({ viewers: 1 });

// Virtual for viewers count
storySchema.virtual('viewersCount').get(function() {
  return this.viewers.length;
});

// Virtual for reactions count
storySchema.virtual('reactionsCount').get(function() {
  return this.reactions.length;
});

// Virtual for replies count
storySchema.virtual('repliesCount').get(function() {
  return this.replies.length;
});

// Ensure virtual fields are serialized
storySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Story', storySchema);
