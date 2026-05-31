import 'package:flutter/material.dart';
import 'verification_documents_page.dart';


class CompanyDetailsPage extends StatefulWidget {
  const CompanyDetailsPage({super.key});

  @override
  State<CompanyDetailsPage> createState() => _CompanyDetailsPageState();
}

class _CompanyDetailsPageState extends State<CompanyDetailsPage> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final TextEditingController startupNameController = TextEditingController();
  final TextEditingController taglineController = TextEditingController();
  final TextEditingController yearController = TextEditingController();
  final TextEditingController regionController = TextEditingController();
  final TextEditingController cityController = TextEditingController();
  final TextEditingController teamController = TextEditingController();
  final TextEditingController roleController = TextEditingController();

  String? selectedSector;
  String? selectedStage;
  String? selectedType;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F9),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Company Details",
          
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xff0D3B36)),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        "STEP 2 OF 4",
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight:
                              FontWeight.bold,
                          color:
                              Color(0xff98A2B3),
                          letterSpacing: 1,
                        ),
                      ),

                      const Spacer(),

                      buildProgress(false),
                      buildProgress(true),
                      buildProgress(false),
                      buildProgress(false),
                    ],
                  ),
                  const SizedBox(height: 50),

                    // ================= IDENTITY =================
                    sectionTitle("Identity"),
                    sectionCard(
                      child: Column(
                        children: [
                          responsiveRow(
                            children: [
                              textField(
                                controller: startupNameController,
                                label: "Startup name",
                                hint: "e.g. Axum Pay",
                              ),
                              dropdownField(
                                label: "Sector / Industry",
                                value: selectedSector,
                                items: const [
                                  "AgriTech",
                                  "FinTech",
                                  "HealthTech",
                                  "EdTech"
                                ],
                                onChanged: (val) {
                                  setState(() => selectedSector = val);
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          textField(
                            controller: taglineController,
                            label: "Startup tagline",
                            hint:
                                "The digital future of Ethiopia in one sentence",
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ================= STATUS =================
                    sectionTitle("Status"),
                    sectionCard(
                      child: responsiveRow(
                        children: [
                          dropdownField(
                            label: "Startup stage",
                            value: selectedStage,
                            items: const [
                              "Idea Stage",
                              "Pre-Seed",
                              "Seed",
                              "Early Growth"
                            ],
                            onChanged: (val) {
                              setState(() => selectedStage = val);
                            },
                          ),
                          dropdownField(
                            label: "Startup type",
                            value: selectedType,
                            items: const [
                              "B2B",
                              "B2C",
                              "B2G",
                              "Marketplace"
                            ],
                            onChanged: (val) {
                              setState(() => selectedType = val);
                            },
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ================= DETAILS =================
                    sectionTitle("Details"),
                    sectionCard(
                      child: Column(
                        children: [
                          responsiveRow(
                            children: [
                              textField(
                                controller: yearController,
                                label: "Year founded",
                                hint: "2024",
                              ),
                              textField(
                                controller: regionController,
                                label: "Region",
                                hint: "Addis Ababa",
                              ),
                              textField(
                                controller: cityController,
                                label: "City",
                                hint: "Bole",
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          responsiveRow(
                            children: [
                              textField(
                                controller: teamController,
                                label: "Number of team members",
                                hint: "1-5",
                              ),
                              textField(
                                controller: roleController,
                                label: "Founder role",
                                hint: "CEO, CTO, Lead Engineer...",
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 30),

                    SizedBox(
                      width: double.infinity,
                      height: 55,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F5D4E),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const VerificationDocumentsPage(),
                            ),
                          );
                        },
                        child: const Text(
                          "Continue to Step 3",
                          style: TextStyle(fontSize: 16),
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),

                    const Text(
                      "Note: You will be asked to upload project files like your pitch deck and business plan in Step 4.",
                      style: TextStyle(color: Colors.grey),
                    ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ================= UI COMPONENTS =================

  Widget sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget sectionCard({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEFEFF1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: child,
    );
  }

  Widget responsiveRow({required List<Widget> children}) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 600) {
          return Row(
            children: children
                .map(
                  (e) => Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: e,
                    ),
                  ),
                )
                .toList(),
          );
        } else {
          return Column(
            children: children
                .map(
                  (e) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: e,
                  ),
                )
                .toList(),
          );
        }
      },
    );
  }

  Widget buildProgress(bool active) {
    return Container(
      margin: const EdgeInsets.only(left: 8),
      width: 28,
      height: 6,
      decoration: BoxDecoration(
        color: active
            ? const Color(0xff0B7A5B)
            : const Color(0xffD9DDE3),
        borderRadius:
            BorderRadius.circular(100),
      ),
    );
  }

  Widget textField({
    required TextEditingController controller,
    required String label,
    required String hint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: Colors.white,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ],
    );
  }

  // ✅ FIXED DROPDOWN (no more crash)
  Widget dropdownField({
    required String label,
    required String? value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: items.contains(value) ? value : null, // ✅ FIX
          hint: const Text("Select"),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide.none,
            ),
          ),
          items: items.map((item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(item),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
