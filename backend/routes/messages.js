const express = require('express');
const { body, validationResult } = require('express-validator');
const { Chat, Message } = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's chats
router.get('/chats', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
    .populate('participants', 'username profilePic isOnline')
    .populate('lastMessage')
    .populate('lastMessage.senderId', 'username profilePic')
    .sort({ lastMessageAt: -1 });

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get or create chat
router.post('/chat', authenticateToken, [
  body('participants')
    .isArray({ min: 1 })
    .withMessage('Participants array is required'),
  body('participants.*')
    .isMongoId()
    .withMessage('Invalid participant ID'),
  body('isGroup')
    .optional()
    .isBoolean()
    .withMessage('isGroup must be a boolean'),
  body('groupName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Group name must be less than 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { participants, isGroup = false, groupName, groupDescription } = req.body;

    // Add current user to participants
    const allParticipants = [...new Set([req.user._id, ...participants])];

    if (allParticipants.length < 2) {
      return res.status(400).json({ message: 'At least 2 participants required' });
    }

    // For 1-on-1 chat, check if chat already exists
    if (!isGroup && allParticipants.length === 2) {
      const existingChat = await Chat.findOne({
        participants: { $all: allParticipants },
        isGroup: false
      }).populate('participants', 'username profilePic');

      if (existingChat) {
        return res.json({ chat: existingChat });
      }
    }

    // Create new chat
    const chat = new Chat({
      participants: allParticipants,
      isGroup,
      groupName: isGroup ? groupName : undefined,
      groupDescription: isGroup ? groupDescription : undefined,
      admins: isGroup ? [req.user._id] : undefined
    });

    await chat.save();
    await chat.populate('participants', 'username profilePic');

    res.status(201).json({ chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat messages
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    // Check if user is participant of the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    const messages = await Message.find({ chatId })
      .populate('senderId', 'username profilePic')
      .populate('replyTo')
      .populate('replyTo.senderId', 'username profilePic')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:chatId/messages', authenticateToken, [
  body('content')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Message content must be less than 1000 characters'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId } = req.params;
    const { content, replyTo } = req.body;

    // Check if user is participant of the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to send messages to this chat' });
    }

    if (!content && !req.files) {
      return res.status(400).json({ message: 'Message content or media is required' });
    }

    // Create message
    const message = new Message({
      chatId,
      senderId: req.user._id,
      content,
      replyTo,
      mediaType: 'text'
    });

    await message.save();

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageAt: new Date()
    });

    // Populate message with user data
    await message.populate('senderId', 'username profilePic');
    if (replyTo) {
      await message.populate('replyTo');
      await message.populate('replyTo.senderId', 'username profilePic');
    }

    // Create notifications for other participants
    const otherParticipants = chat.participants.filter(
      participant => participant.toString() !== req.user._id.toString()
    );

    for (const participantId of otherParticipants) {
      const notification = new Notification({
        userId: participantId,
        fromUserId: req.user._id,
        type: 'message',
        title: 'New Message',
        message: `${req.user.username} sent you a message`,
        data: { chatId, messageId: message._id }
      });
      await notification.save();
    }

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as seen
router.put('/:chatId/seen', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Check if user is participant of the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Mark all messages in this chat as seen by current user
    await Message.updateMany(
      { 
        chatId,
        senderId: { $ne: req.user._id },
        'seenBy.userId': { $ne: req.user._id }
      },
      {
        $addToSet: {
          seenBy: {
            userId: req.user._id,
            seenAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    console.error('Mark messages seen error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reaction to message
router.post('/messages/:messageId/reaction', authenticateToken, [
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(message.chatId);
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove existing reaction from this user
    await Message.findByIdAndUpdate(messageId, {
      $pull: { reactions: { userId: req.user._id } }
    });

    // Add new reaction
    await Message.findByIdAndUpdate(messageId, {
      $push: { reactions: { userId: req.user._id, emoji } }
    });

    res.json({ message: 'Reaction added successfully' });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndUpdate(messageId, {
      isDeleted: true,
      deletedAt: new Date()
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
