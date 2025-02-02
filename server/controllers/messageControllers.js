import Message from '../models/messageModel.js';
import user from '../models/userModel.js';
import Chat from '../models/chatModel.js';
import fs from 'fs';

export const sendMessage = async (req, res) => {
  const { chatId, message, image } = req.body; // Accepts image in request

  try {
    let imageString = '';

    // Convert image to Base64 if it's a file (assuming it's sent as a path)
    if (image) {
      if (fs.existsSync(image)) {
        const imageBuffer = fs.readFileSync(image);
        imageString = imageBuffer.toString('base64');
      } else {
        imageString = image; // If it's already a Base64 string or URL, store it as is
      }
    }

    let msgData = { sender: req.rootUserId, chatId };
    if (message) msgData.message = message;
    if (imageString) msgData.image = imageString; // Store Base64 string in MongoDB

    let msg = await Message.create(msgData);

    msg = await (
      await msg.populate('sender', 'name profilePic email')
    ).populate({
      path: 'chatId',
      select: 'chatName isGroup users',
      model: 'Chat',
      populate: {
        path: 'users',
        select: 'name email profilePic',
        model: 'User',
      },
    });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: msg,
    });

    res.status(200).send(msg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  try {
    let messages = await Message.find({ chatId })
      .populate({
        path: 'sender',
        model: 'User',
        select: 'name profilePic email',
      })
      .populate({
        path: 'chatId',
        model: 'Chat',
      });

    res.status(200).json(messages);
  } catch (error) {
    res.sendStatus(500).json({ error: error });
    console.log(error);
  }
};
