import 'package:flutter/material.dart';
import '../../services/investor_service.dart';

class InvestorOffersPage extends StatefulWidget {
  const InvestorOffersPage({super.key});

  @override
  State<InvestorOffersPage> createState() => _InvestorOffersPageState();
}

class _InvestorOffersPageState extends State<InvestorOffersPage> {
  List<dynamic>? offers;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await InvestorService.getFundingOffers();
    setState(() { offers = r['offers']; loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),
      appBar: AppBar(title: const Text("Funding Offers", style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.transparent, elevation: 0),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xff0D5C46),
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () => _createOffer(context),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : offers == null || offers!.isEmpty
              ? const Center(child: Text("No offers created yet", style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: offers!.length,
                  itemBuilder: (ctx, i) {
                    final o = offers![i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('To: ${o['startup_name'] ?? 'Unknown'}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('Amount: \$${o['amount'] ?? 'N/A'}'),
                        if (o['equity'] != null) Text('Equity: ${o['equity']}%'),
                        Text('Status: ${o['status'] ?? 'pending'}', style: TextStyle(color: o['status'] == 'accepted' ? Colors.green : Colors.orange)),
                      ]),
                    );
                  },
                ),
    );
  }

  void _createOffer(BuildContext context) {
    final startupId = TextEditingController();
    final amount = TextEditingController();
    final equity = TextEditingController();
    final terms = TextEditingController();
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: const Text("New Funding Offer"),
      content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: startupId, decoration: const InputDecoration(labelText: "Startup ID")),
        TextField(controller: amount, decoration: const InputDecoration(labelText: "Amount"), keyboardType: TextInputType.number),
        TextField(controller: equity, decoration: const InputDecoration(labelText: "Equity (%)"), keyboardType: TextInputType.number),
        TextField(controller: terms, decoration: const InputDecoration(labelText: "Terms"), maxLines: 3),
      ])),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
        ElevatedButton(onPressed: () async {
          await InvestorService.createFundingOffer({
            'startup_id': int.tryParse(startupId.text),
            'amount': amount.text,
            'equity': equity.text,
            'terms': terms.text,
          });
          Navigator.pop(ctx);
          _load();
        }, child: const Text("Send Offer")),
      ],
    ));
  }
}
