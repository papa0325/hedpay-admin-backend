import { Op } from 'sequelize';
import { Chat } from '../models/Chat';
import config from '../config/config';
import { error, getUUID, output } from '../utils';
import { accessCheck, randomString } from '../utils/auth';
import { AdminRole } from '../utils/types';
import * as FileType from 'file-type';
import { Admin } from '../models/Admin';
import { ChatLine } from '../models/ChatLine';
import { User } from '../models/User';
import axios from 'axios';
import * as btoa from 'btoa';
import { ChatLineAttachment } from '../models/ChatLineAttachment';
import console = require('console');

const fs = require('fs');
const path = require('path');
const appDir = path.dirname(require.main.filename);

interface IChatPreview {
  chatID: number;
  username: string;
  active: boolean;
  lastMessage: string;
  lastSender: Object;
}

interface IFile {
  fileExtension: string;
  data: string;
}

const startChat = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const newChat: Chat = await Chat.create({
      userId: r.auth.credentials.id,
      active: true,
    });
    return output({ chatID: newChat.id, messagesCount: 0, data: [] });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to create a chat', {});
  }
};

const startChatByAdmin = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const checkEx: Chat = await Chat.findOne({ where: { [Op.and]: [{ userId: r.payload.userId }, { active: true }] } });
    if (checkEx) return output({ message: 'Chat with specified user is already started', chatID: checkEx.id, exists: true });

    const newChat: Chat = await Chat.create({
      userId: r.payload.userId,
      active: true,
    });

    return output({ chatID: newChat.id, messagesCount: 0, data: [] });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to create a chat', {});
  }
};

const sendMessage = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const message = r.payload.message;
    const attachments = r.payload.file;

    let chat: Chat | null;
    let sender;
    if (!message && !attachments) return error(400000, 'Either message or attachments have to be sent', {});
    sender = await Admin.findByPk(r.auth.credentials.id);
    if (!sender) return error(404000, 'Admin with given accessToken was not found', {});
    const chatID = r.payload.id;
    chat = await Chat.findByPk(chatID);
    if (!chat) return error(404000, 'Chat with given id was not found', {});
    if (!chat.active) return error(400000, 'You cannot send message to closed chat', {});

    const attachmentsArray = [];
    const attachmentsToSendArray = [];

    if (attachments) {
      const files = Array.isArray(attachments) ? [...attachments] : [attachments];
      for await (let file of files) {
        let fileUUID = getUUID();
        if (!Buffer.isBuffer(file)) return error(400000, 'This file type is now allowed', null);
        let fileExt = await FileType.fromBuffer(file);
        if (!fileExt || !fileExt.ext.match(config.files.allowedExt)) return error(400000, 'This file type is now allowed', null);
        let fileName = fileUUID + '.' + fileExt.ext;
        const newAttachment = {
          file: fileName,
          ext: fileExt,
        };
        const newAttachmentToSend = {
          fileName: fileName,
          data: file,
        };
        attachmentsArray.push(newAttachment);
        attachmentsToSendArray.push(newAttachmentToSend);
      }
    }

    const newChatLine: ChatLine = await ChatLine.create(
      {
        chatID: chat.id,
        sender: { type: 'admin', senderID: sender.id },
        message: message,
        timestamp: Math.round(Date.now() / 1000),
        attachments: attachmentsArray,
      },
      {
        include: [
          {
            model: ChatLineAttachment,
            as: 'attachments',
          },
        ],
      }
    );

    const senderObj = {} as any;

    senderObj.type = 'admin';
    senderObj.userId = chat.userId;
    senderObj.senderId = sender.id;

    r.server.publish(`/admin/chats`, {
      chatID: chat.id,
      sender: senderObj,
      message: message,
      timestamp: newChatLine.timestamp,
      attachments: newChatLine.attachments,
    });
    //send message and files to backend service
    await axios.post(
      config.chat.BackendURL + 'user/chats/send-ws',
      {
        chatLineId: newChatLine.id,
        chatId: newChatLine.chatID,
        message: newChatLine.message,
        files: attachmentsToSendArray,
      },
      {
        headers: {
          'content-type': 'application/json',
          Authorization: 'Basic ' + btoa(config.chat.BackendUsername + ':' + config.chat.BackendPassword),
        },
      }
    );

    return output({ message: 'Message was sent', id: chat.id, chatLineId: newChatLine.id });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to send a message to the chat', {});
  }
};

const getChatsPreview = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const chats = await Chat.findAll({
      include: [
        {
          model: ChatLine,
          as: 'chatLines',
        },
        {
          model: User,
          as: 'user',
          attributes: ['username', 'firstName', 'lastName'],
        },
      ],
      order: [
        [{ model: ChatLine, as: 'chatLines' }, 'updatedAt', 'DESC'],
        //['createdAt', 'DESC'],
      ],
    });

    if (!chats) return error(404000, 'No active chats', {});
    let lastMessages: Array<IChatPreview> = [];
    for (let chat of chats) {
      let chatline = chat.chatLines[0];
      let lastMessage: IChatPreview = {
        chatID: chat.id,
        username: chat.user.username ? chat.user.username : chat.user.firstName + ' ' + chat.user.lastName,
        active: chat.active,
        lastMessage: chatline ? (chatline.message ? chatline.message : 'file') : 'no messages',
        lastSender: chatline ? chatline.sender : 'no senders',
      };
      if (chatline) lastMessages.push(lastMessage);
    }

    return output({ data: lastMessages });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get chats preview', {});
  }
};

const closeChat = async (r) => {
  await accessCheck(r, AdminRole.ADMIN);

  const chat: Chat = await Chat.findByPk(r.payload.id);
  if (!chat) return error(404000, 'Chat with given ID was not found', {});
  await chat.update({ active: false });

  return output({ message: 'chat was closed' });
};

const getMessages = async (r, type) => {
  const chatID = r.params.id;

  const chat = await Chat.findByPk(chatID);
  if (!chat) return error(404000, 'Chat was not found', {});

  const chatLines = await ChatLine.findAndCountAll({
    where: { chatID: chat.id },
    include: [
      {
        model: ChatLineAttachment,
        as: 'attachments',
      },
    ],
    order: [['id', 'DESC']],
  });

  return output({ chatID: chat.id, messagesCount: chatLines.count, data: chatLines.rows });
};

const checkFileAccess = async (r) => {
  if (!r.params.chatID || !r.params.file) return error(400000, 'Incorrect file or chatID params', {});
  const chat: Chat = await Chat.findByPk(r.params.chatID);
  if (!r.auth.credentials.role) {
    if (chat.userId != r.auth.credentials.id) return error(403000, 'No access to view this content', {});
    return true;
  }
  return true;
};

const getFilePath = (r) => {
  const path = config.files.filesDir;
  return path;
};

const sendWS = async (r) => {
  const newChatLine: ChatLine = await ChatLine.findByPk(r.payload.chatLineId, {
    include: [
      {
        model: ChatLineAttachment,
        as: 'attachments',
      },
    ],
  });
  if (!newChatLine) return error(404000, 'No chat line was found', null);
  await r.server.publish('/admin/chats', {
    chatID: newChatLine.chatID,
    sender: newChatLine.sender,
    message: newChatLine.message,
    timestamp: newChatLine.timestamp,
    attachments: newChatLine.attachments,
  });

  return output({ message: 'Message was sent via WS' });
};

export { sendMessage, startChat, getMessages, getChatsPreview, closeChat, getFilePath, checkFileAccess, startChatByAdmin, sendWS };
