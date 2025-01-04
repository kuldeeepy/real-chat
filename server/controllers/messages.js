import ChatMessage from "../models/chatModel.js";

async function getSessions(req, res) {
  const contexts = await ChatMessage.aggregate([
    {
      $group: {
        _id: "$sessionId",
        chats: { $push: "$$ROOT" },
      },
    },
  ]);
  res.status(200).send(contexts);
}

async function getAllChats(req, res) {
  const sid = req.query.sessionID;

  const conversation = await ChatMessage.find({ sessionId: sid });
  if (!conversation) return res.status(400).json({ Error: "No chats found!" });

  return res.status(200).send(conversation);
}

export { getSessions, getAllChats };
