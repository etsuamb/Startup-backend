import 'package:flutter/material.dart';
import '../../services/chat_service.dart';
import 'chat_detail_page.dart';

class ChatListPage extends StatefulWidget {
  const ChatListPage({super.key});

  @override
  State<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends State<ChatListPage> {
  List<dynamic>? conversations;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await ChatService.getConversations();
    setState(() { conversations = r['conversations']; loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("Messages", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : conversations == null || conversations!.isEmpty
              ? const Center(child: Text("No conversations yet", style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: conversations!.length,
                  itemBuilder: (ctx, i) {
                    final c = conversations![i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        tileColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        leading: CircleAvatar(backgroundColor: const Color(0xffECFDF3), child: Text((c['name'] ?? '?')[0], style: const TextStyle(color: Color(0xff0D5C46)))),
                        title: Text(c['name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(c['last_message'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                        trailing: c['unread_count'] != null && c['unread_count'] > 0
                            ? Container(padding: const EdgeInsets.all(8), decoration: const BoxDecoration(color: Color(0xff0D5C46), shape: BoxShape.circle), child: Text('${c['unread_count']}', style: const TextStyle(color: Colors.white, fontSize: 12)))
                            : null,
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ChatDetailPage(conversationId: c['id'], name: c['name'] ?? 'Chat'))),
                      ),
                    );
                  },
                ),
    );
  }
}
