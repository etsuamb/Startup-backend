import 'package:flutter/material.dart';
import '../../services/startup_service.dart';
import 'discover_detail_page.dart';

class DiscoverPage extends StatefulWidget {
  const DiscoverPage({super.key});

  @override
  State<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends State<DiscoverPage> {
  List<dynamic>? investors;
  List<dynamic>? mentors;
  int tab = 0;
  bool loading = true;
  final TextEditingController _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({String? query}) async {
    setState(() => loading = true);
    final i = await StartupService.discoverInvestors(search: query);
    final m = await StartupService.discoverMentors(search: query);
    setState(() {
      investors = i['investors'];
      mentors = m['mentors'];
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("Discover", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      body: Column(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: Colors.white,
          child: TextField(
            controller: _search,
            decoration: InputDecoration(
              hintText: "Search...",
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
              filled: true, fillColor: const Color(0xffF3F4F6),
            ),
            onSubmitted: (v) => _load(query: v),
          ),
        ),
        Row(children: [
          Expanded(child: _tabBtn("Investors", 0)),
          Expanded(child: _tabBtn("Mentors", 1)),
        ]),
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: (tab == 0 ? investors : mentors)?.length ?? 0,
                  itemBuilder: (ctx, i) {
                    final item = (tab == 0 ? investors : mentors)![i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                      child: ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(backgroundColor: const Color(0xffECFDF3), child: Icon(tab == 0 ? Icons.account_balance : Icons.school, color: const Color(0xff0D5C46))),
                        title: Text(item['name'] ?? item['organization_name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(item['industry'] ?? item['bio'] ?? ''),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => DiscoverDetailPage(item: item, type: tab == 0 ? 'investor' : 'mentor'))),
                      ),
                    );
                  },
                ),
        ),
      ]),
    );
  }

  Widget _tabBtn(String label, int idx) {
    return GestureDetector(
      onTap: () => setState(() => tab = idx),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: tab == idx ? const Color(0xff0D5C46) : Colors.white,
          border: Border(bottom: BorderSide(color: tab == idx ? const Color(0xff0D5C46) : Colors.grey.shade300)),
        ),
        child: Center(child: Text(label, style: TextStyle(color: tab == idx ? Colors.white : Colors.grey, fontWeight: FontWeight.bold))),
      ),
    );
  }
}
