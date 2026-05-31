import 'package:flutter/material.dart';
import 'investor_verification_page.dart';

class InvestorProfilePage extends StatefulWidget {
  const InvestorProfilePage({super.key});

  @override
  State<InvestorProfilePage> createState() =>
      _InvestorProfilePageState();
}

class _InvestorProfilePageState
    extends State<InvestorProfilePage> {

  String selectedInvestorType = "Individual";

  List<String> selectedSectors = ["Fintech"];

  String? selectedStage = "Series A";
  String? selectedInvestmentRange = "\$250k - \$1M";
  String? selectedLocation = "Addis Ababa";

  final TextEditingController websiteController =
      TextEditingController();

  final TextEditingController bioController =
      TextEditingController();

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: const Color(0xffF7F9FB),

      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,

        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back,
            color: Color(0xff0D3B36),
          ),
          onPressed: () {
            Navigator.pop(context);
          },
        ),

        title: const Text(
          "Investor Profile",
          style: TextStyle(
            color: Color(0xff0D3B36),
            fontWeight: FontWeight.bold,
          ),
        ),
      ),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),

          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // ===================================================
              // TITLE
              // ===================================================

              const Text(
                "Investor Type and Profile",
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.bold,
                  color: Color(0xff0D3B36),
                ),
              ),

              const SizedBox(height: 14),

              const Text(
                "Tell us about your investment background and preferences to match you with relevant Ethiopian startups.",
                style: TextStyle(
                  fontSize: 16,
                  color: Color(0xff667085),
                  height: 1.5,
                ),
              ),

              const SizedBox(height: 34),

              // ===================================================
              // STEP INDICATOR
              // ===================================================

              Row(
                children: [

                  const Text(
                    "STEP 2 OF 5",
                    style: TextStyle(
                      color: Color(0xff98A2B3),
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),

                  const Spacer(),

                  buildProgress(true),
                  buildProgress(true),
                  buildProgress(false),
                  buildProgress(false),
                  buildProgress(false),
                ],
              ),

              const SizedBox(height: 40),

              // ===================================================
              // INVESTOR TYPE
              // ===================================================

              const Text(
                "Investor Type",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xff0D1C2E),
                ),
              ),

              const SizedBox(height: 24),

              GridView.count(
                shrinkWrap: true,
                physics:
                    const NeverScrollableScrollPhysics(),
                crossAxisCount: 3,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.85,

                children: [

                  investorTypeCard(
                    "Individual",
                    Icons.person_outline,
                  ),

                  investorTypeCard(
                    "Angel",
                    Icons.bolt_outlined,
                  ),

                  investorTypeCard(
                    "Venture Capital",
                    Icons.groups_outlined,
                  ),

                  investorTypeCard(
                    "Investment Co.",
                    Icons.business_outlined,
                  ),

                  investorTypeCard(
                    "Corporate",
                    Icons.apartment_outlined,
                  ),

                  investorTypeCard(
                    "Diaspora",
                    Icons.public,
                  ),
                ],
              ),

              const SizedBox(height: 50),

              // ===================================================
              // INVESTMENT PREFERENCES
              // ===================================================

              const Text(
                "Investment Preferences",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xff0D1C2E),
                ),
              ),

              const SizedBox(height: 30),

              const Text(
                "PREFERRED SECTORS",
                style: TextStyle(
                  color: Color(0xff98A2B3),
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),

              const SizedBox(height: 20),

              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [

                  sectorChip("Fintech"),
                  sectorChip("AgriTech"),
                  sectorChip("Logistics"),
                  sectorChip("HealthTech"),
                  sectorChip("EdTech"),
                  sectorChip("Energy"),
                ],
              ),

              const SizedBox(height: 40),

              // ===================================================
              // DROPDOWNS
              // ===================================================

              Row(
                children: [

                  Expanded(
                    child: buildDropdown(
                      label: "STARTUP STAGE",
                      value: selectedStage,
                      items: const [
                        "Series A",
                        "Seed",
                        "Pre-Seed",
                      ],
                      onChanged: (value) {
                        setState(() {
                          selectedStage = value!;
                        });
                      },
                    ),
                  ),

                  const SizedBox(width: 20),

                  Expanded(
                    child: buildDropdown(
                      label: "INVESTMENT RANGE (USD)",
                      value: selectedInvestmentRange,
                      items: const [
                        "\$250k - \$1M",
                        "Under \$250k",
                        "Over \$1M",
                      ],
                      onChanged: (value) {
                        setState(() {
                          selectedInvestmentRange =
                              value!;
                        });
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 26),

              Row(
                children: [

                  Expanded(
                    child: buildDropdown(
                      label: "LOCATION PREFERENCE",
                      value: selectedLocation,
                      items: const [
                        "Addis Ababa",
                        "Regional Ethiopia",
                        "Anywhere",
                      ],
                      onChanged: (value) {
                        setState(() {
                          selectedLocation = value!;
                        });
                      },
                    ),
                  ),

                  const SizedBox(width: 20),

                  Expanded(
                    child: buildInputField(
                      label: "LINKEDIN OR WEBSITE",
                      controller: websiteController,
                      hint:
                          "https://linkedin.com/in/...",
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 26),

              // ===================================================
              // BIO
              // ===================================================

              const Text(
                "SHORT PROFESSIONAL BIO",
                style: TextStyle(
                  color: Color(0xff98A2B3),
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),

              const SizedBox(height: 12),

              TextField(
                controller: bioController,
                maxLines: 6,

                decoration: InputDecoration(
                  hintText:
                      "Briefly describe your investment philosophy and previous experience...",
                  filled: true,
                  fillColor: Colors.white,

                  border: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: Colors.grey.shade300,
                    ),
                  ),

                  enabledBorder: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: Colors.grey.shade300,
                    ),
                  ),

                  focusedBorder: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(14),
                    borderSide: const BorderSide(
                      color: Color(0xff0D5C46),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 50),

              const Divider(),

              const SizedBox(height: 30),

              // ===================================================
              // BUTTONS
              // ===================================================

              Row(
                mainAxisAlignment:
                    MainAxisAlignment.spaceBetween,
                children: [

                  TextButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                    },

                    icon: const Icon(
                      Icons.arrow_back,
                      color: Color(0xff344054),
                    ),

                    label: const Text(
                      "Back",
                      style: TextStyle(
                        color: Color(0xff344054),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),

                  SizedBox(
                    height: 56,

                    child: ElevatedButton(
                      style:
                          ElevatedButton.styleFrom(
                        backgroundColor:
                            const Color(0xff0D5C46),
                        padding:
                            const EdgeInsets.symmetric(
                          horizontal: 32,
                        ),

                        shape:
                            RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(
                                  12),
                        ),
                      ),

                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const InvestorVerificationPage(),
                          ),
                        );
                      },

                      child: const Row(
                        children: [

                          Text(
                            "Continue to Profile",
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight:
                                  FontWeight.bold,
                            ),
                          ),

                          SizedBox(width: 10),

                          Icon(
                            Icons.arrow_forward,
                            color: Colors.white,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 60),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // INVESTOR TYPE CARD
  // ==========================================================

  Widget investorTypeCard(
    String title,
    IconData icon,
  ) {

    final bool selected =
        selectedInvestorType == title;

    return GestureDetector(
      onTap: () {
        setState(() {
          selectedInvestorType = title;
        });
      },

      child: Container(
        padding: const EdgeInsets.all(20),

        decoration: BoxDecoration(
          color: selected
              ? const Color(0xffECFDF3)
              : Colors.white,

          borderRadius:
              BorderRadius.circular(18),

          border: Border.all(
            color: selected
                ? const Color(0xff0D5C46)
                : Colors.grey.shade300,
          ),
        ),

        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          mainAxisAlignment:
              MainAxisAlignment.center,
          children: [

            Icon(
              icon,
              color: const Color(0xff0D5C46),
              size: 30,
            ),

            const SizedBox(height: 20),

            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: Color(0xff0D1C2E),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================================
  // SECTOR CHIP
  // ==========================================================

  Widget sectorChip(String sector) {

    final bool selected =
        selectedSectors.contains(sector);

    return GestureDetector(
      onTap: () {
        setState(() {

          if (selected) {
            selectedSectors.remove(sector);
          } else {
            selectedSectors.add(sector);
          }
        });
      },

      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 12,
        ),

        decoration: BoxDecoration(
          color: selected
              ? const Color(0xff0D5C46)
              : const Color(0xffE8F4EE),

          borderRadius:
              BorderRadius.circular(30),
        ),

        child: Text(
          sector,
          style: TextStyle(
            color: selected
                ? Colors.white
                : const Color(0xff0D5C46),

            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // DROPDOWN
  // ==========================================================

  Widget buildDropdown({
    required String label,
    required String? value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {

    return Column(
      crossAxisAlignment:
          CrossAxisAlignment.start,
      children: [

        Text(
          label,
          style: const TextStyle(
            color: Color(0xff98A2B3),
            fontWeight: FontWeight.bold,
            letterSpacing: 2,
          ),
        ),

        const SizedBox(height: 12),

        DropdownButtonFormField<String>(
          value: value,

          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,

            border: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(14),
              borderSide: BorderSide(
                color: Colors.grey.shade300,
              ),
            ),

            enabledBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(14),
              borderSide: BorderSide(
                color: Colors.grey.shade300,
              ),
            ),

            focusedBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(14),
              borderSide: const BorderSide(
                color: Color(0xff0D5C46),
              ),
            ),
          ),

          items: items.map((item) {
            return DropdownMenuItem(
              value: item,
              child: Text(item),
            );
          }).toList(),

          onChanged: onChanged,
        ),
      ],
    );
  }

  // ==========================================================
  // INPUT FIELD
  // ==========================================================

  Widget buildInputField({
    required String label,
    required TextEditingController controller,
    required String hint,
  }) {

    return Column(
      crossAxisAlignment:
          CrossAxisAlignment.start,
      children: [

        Text(
          label,
          style: const TextStyle(
            color: Color(0xff98A2B3),
            fontWeight: FontWeight.bold,
            letterSpacing: 2,
          ),
        ),

        const SizedBox(height: 12),

        TextField(
          controller: controller,

          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: Colors.white,

            border: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(14),
              borderSide: BorderSide(
                color: Colors.grey.shade300,
              ),
            ),

            enabledBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(14),
              borderSide: BorderSide(
                color: Colors.grey.shade300,
              ),
            ),

            focusedBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(14),
              borderSide: const BorderSide(
                color: Color(0xff0D5C46),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ==========================================================
  // PROGRESS
  // ==========================================================

  Widget buildProgress(bool active) {

    return Container(
      margin: const EdgeInsets.only(left: 8),
      width: 28,
      height: 6,

      decoration: BoxDecoration(
        color: active
            ? const Color(0xff0D5C46)
            : const Color(0xffD0D5DD),

        borderRadius:
            BorderRadius.circular(20),
      ),
    );
  }
}