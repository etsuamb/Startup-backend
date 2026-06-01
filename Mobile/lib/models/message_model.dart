class MessageModel {
  final int? id;
  final int? conversationId;
  final int? senderId;
  final String? senderName;
  final String? body;
  final String? createdAt;
  final bool? isRead;

  MessageModel({
    this.id,
    this.conversationId,
    this.senderId,
    this.senderName,
    this.body,
    this.createdAt,
    this.isRead,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'],
      conversationId: json['conversation_id'],
      senderId: json['sender_id'],
      senderName: json['sender_name'],
      body: json['body'] ?? json['message'],
      createdAt: json['created_at'],
      isRead: json['is_read'],
    );
  }
}

class ConversationModel {
  final int? id;
  final String? name;
  final String? lastMessage;
  final String? lastMessageTime;
  final int? unreadCount;
  final String? avatar;

  ConversationModel({
    this.id,
    this.name,
    this.lastMessage,
    this.lastMessageTime,
    this.unreadCount,
    this.avatar,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['id'],
      name: json['name'] ?? json['with_name'],
      lastMessage: json['last_message'],
      lastMessageTime: json['last_message_time'],
      unreadCount: json['unread_count'],
      avatar: json['avatar'],
    );
  }
}
