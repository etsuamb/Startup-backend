import 'package:flutter/material.dart';
import '../../services/chat_service.dart';

class ChatDetailPage extends StatefulWidget {
  final int conversationId;
  final String name;
  const ChatDetailPage({super.key, required this.conversationId, required this.name});

  @override
  State<ChatDetailPage> createState() => _ChatDetailPageState();
}

class _ChatDetailPageState extends State<ChatDetailPage> {
  final TextEditingController _msgController = TextEditingController();
  List<dynamic>? messages;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await ChatService.getMessages(widget.conversationId);
    setState(() { messages = r['messages']; loading = false; });
  }

  Future<void> _send() async {
    if (_msgController.text.trim().isEmpty) return;
    final r = await ChatService.sendMessage(widget.conversationId, _msgController.text.trim());
    if (r['error'] == null) {
      _msgController.clear();
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: Text(widget.name, style: const TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      body: Column(children: [
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator())
              : (messages == null || messages!.isEmpty)
                  ? const Center(child: Text("No messages yet", style: TextStyle(color: Colors.grey)))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: messages!.length,
                      itemBuilder: (ctx, i) {
                        final m = messages![i];
                        final isMe = m['sender_id'] == null;
                        return Align(
                          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isMe ? const Color(0xff0D5C46) : Colors.white,
                              borderRadius: BorderRadius.only(
                                topLeft: const Radius.circular(18),
                                topRight: const Radius.circular(18),
                                bottomLeft: isMe ? const Radius.circular(18) : Radius.zero,
                                bottomRight: isMe ? Radius.zero : const Radius.circular(18),
                              ),
                            ),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                            child: Text(m['body'] ?? m['message'] ?? '', style: TextStyle(color: isMe ? Colors.white : Colors.black87)),
                          ),
                        );
                      },
                    ),
        ),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Color(0xffE5E7EB)))),
          child: SafeArea(
            child: Row(children: [
              Expanded(child: TextField(
                controller: _msgController,
                decoration: InputDecoration(
                  hintText: "Type a message...",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                  filled: true, fillColor: const Color(0xffF3F4F6),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                ),
              )),
              const SizedBox(width: 8),
              CircleAvatar(
                backgroundColor: const Color(0xff0D5C46),
                child: IconButton(icon: const Icon(Icons.send, color: Colors.white, size: 20), onPressed: _send),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}
