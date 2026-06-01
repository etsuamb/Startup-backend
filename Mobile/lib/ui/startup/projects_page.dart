import 'package:flutter/material.dart';
import '../../services/startup_service.dart';

class ProjectsPage extends StatefulWidget {
  const ProjectsPage({super.key});

  @override
  State<ProjectsPage> createState() => _ProjectsPageState();
}

class _ProjectsPageState extends State<ProjectsPage> {
  List<dynamic>? projects;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await StartupService.getProjects();
    setState(() { projects = r['projects']; loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("My Projects", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xff0D5C46),
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () {},
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: projects?.length ?? 0,
              itemBuilder: (ctx, i) {
                final p = projects![i];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(p['title'] ?? p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 4),
                    Text(p['description'] ?? '', style: const TextStyle(color: Colors.grey)),
                    const SizedBox(height: 8),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text(p['status'] ?? 'Draft', style: TextStyle(color: p['status'] == 'published' ? const Color(0xff0D5C46) : Colors.orange, fontWeight: FontWeight.bold)),
                      Text(p['created_at'] ?? ''),
                    ]),
                  ]),
                );
              },
            ),
    );
  }
}
