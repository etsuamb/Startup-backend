import 'package:flutter/material.dart';
import '../../services/startup_service.dart';
import '../../models/offer_model.dart';

class OffersPage extends StatefulWidget {
  const OffersPage({super.key});

  @override
  State<OffersPage> createState() => _OffersPageState();
}

class _OffersPageState extends State<OffersPage> {
  List<OfferModel>? offers;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await StartupService.getOffers();
    final list = r['offers'] ?? r['investment_offers'] ?? [];
    setState(() {
      offers = (list as List).map((e) => OfferModel.fromJson(e)).toList();
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("Offers", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : offers == null || offers!.isEmpty
              ? const Center(child: Text("No offers yet", style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: offers!.length,
                  itemBuilder: (ctx, i) {
                    final o = offers![i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text(o.type ?? 'Offer', style: TextStyle(color: o.type == 'investment' ? const Color(0xff0D5C46) : const Color(0xff063D33), fontWeight: FontWeight.bold)),
                          _statusBadge(o.status ?? 'pending'),
                        ]),
                        const SizedBox(height: 12),
                        Text('From: ${o.fromName ?? 'Unknown'}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        if (o.amount != null) Text('Amount: \$${o.amount}'),
                        if (o.equity != null) Text('Equity: ${o.equity}%'),
                        if (o.message != null) ...[const SizedBox(height: 8), Text(o.message!, style: const TextStyle(color: Colors.grey))],
                        if (o.status == 'pending') ...[
                          const SizedBox(height: 12),
                          Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                            TextButton(onPressed: () async {
                              await StartupService.updateOfferStatus(o.type ?? 'investment', o.id!, 'accepted');
                              _load();
                            }, child: const Text("Accept", style: TextStyle(color: Colors.green))),
                            TextButton(onPressed: () async {
                              await StartupService.updateOfferStatus(o.type ?? 'investment', o.id!, 'rejected');
                              _load();
                            }, child: const Text("Reject", style: TextStyle(color: Colors.red))),
                          ]),
                        ],
                      ]),
                    );
                  },
                ),
    );
  }

  Widget _statusBadge(String status) {
    Color c;
    switch (status.toLowerCase()) {
      case 'accepted': c = Colors.green; break;
      case 'rejected': c = Colors.red; break;
      default: c = Colors.orange;
    }
    return Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), decoration: BoxDecoration(color: c.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: Text(status.toUpperCase(), style: TextStyle(color: c, fontWeight: FontWeight.bold, fontSize: 11)));
  }
}
