import 'package:flutter/material.dart';
import 'investor_profile_page.dart';

class InvestorRegistrationPage extends StatefulWidget {
  final Map<String, String>? accountData;
  const InvestorRegistrationPage({super.key, this.accountData});

  @override
  State<InvestorRegistrationPage> createState() =>
      _InvestorRegistrationPageState();
}

class _InvestorRegistrationPageState
    extends State<InvestorRegistrationPage> {

  final TextEditingController nameController =
      TextEditingController();

  final TextEditingController phoneController =
      TextEditingController();

  String selectedLanguage = "English";

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 30,
          ),

          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // =========================================================
              // TITLE
              // =========================================================

              const Text(
                "Account Information",
                style: TextStyle(
                  fontSize: 38,
                  fontWeight: FontWeight.bold,
                  color: Color(0xff0D5C46),
                ),
              ),

              const SizedBox(height: 12),

              const Text(
                "Begin your journey as a verified investor in Ethiopia's growing tech ecosystem.",
                style: TextStyle(
                  fontSize: 16,
                  color: Color(0xff667085),
                ),
              ),

              const SizedBox(height: 50),

              // =========================================================
              // STEP INDICATOR
              // =========================================================

              Row(
                children: [

                  const Text(
                    "STEP 1 OF 5",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Color(0xff98A2B3),
                      letterSpacing: 1,
                    ),
                  ),

                  const Spacer(),

                  buildProgress(true),
                  buildProgress(false),
                  buildProgress(false),
                  buildProgress(false),
                  buildProgress(false),
                ],
              ),

              const SizedBox(height: 50),

              // =========================================================
              // FULL NAME
              // =========================================================

              const Text(
                "FULL LEGAL NAME",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Color(0xff667085),
                  letterSpacing: 1,
                ),
              ),

              const SizedBox(height: 12),

              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  hintText: "Enter your full legal name",
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 18,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),

              const SizedBox(height: 35),

              // =========================================================
              // PHONE + LANGUAGE
              // =========================================================

              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  // PHONE
                  Expanded(
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [

                        const Text(
                          "PHONE NUMBER",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Color(0xff667085),
                            letterSpacing: 1,
                          ),
                        ),

                        const SizedBox(height: 12),

                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius:
                                BorderRadius.circular(12),
                          ),

                          child: Row(
                            children: [

                              Container(
                                padding:
                                    const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 18,
                                ),
                                decoration: const BoxDecoration(
                                  border: Border(
                                    right: BorderSide(
                                      color: Color(0xffEAECF0),
                                    ),
                                  ),
                                ),
                                child: const Text(
                                  "+251",
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                              ),

                              Expanded(
                                child: TextField(
                                  controller:
                                      phoneController,
                                  keyboardType:
                                      TextInputType.phone,
                                  decoration:
                                      const InputDecoration(
                                    hintText:
                                        "911 234 567",
                                    border:
                                        InputBorder.none,
                                    contentPadding:
                                        EdgeInsets.symmetric(
                                      horizontal: 14,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 24),

                  // LANGUAGE
                  Expanded(
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [

                        const Text(
                          "PREFERRED LANGUAGE",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Color(0xff667085),
                            letterSpacing: 1,
                          ),
                        ),

                        const SizedBox(height: 12),

                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius:
                                BorderRadius.circular(12),
                          ),

                          child: Row(
                            children: [

                              Expanded(
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      selectedLanguage =
                                          "English";
                                    });
                                  },

                                  child: Container(
                                    padding:
                                        const EdgeInsets.symmetric(
                                      vertical: 16,
                                    ),
                                    decoration: BoxDecoration(
                                      color:
                                          selectedLanguage ==
                                                  "English"
                                              ? Colors.white
                                              : Colors.transparent,
                                      borderRadius:
                                          BorderRadius.circular(
                                              10),
                                      boxShadow:
                                          selectedLanguage ==
                                                  "English"
                                              ? [
                                                  BoxShadow(
                                                    color: Colors
                                                        .black
                                                        .withOpacity(
                                                            0.05),
                                                    blurRadius: 5,
                                                  ),
                                                ]
                                              : [],
                                    ),

                                    child: Center(
                                      child: Text(
                                        "English",
                                        style: TextStyle(
                                          fontWeight:
                                              FontWeight.bold,
                                          color:
                                              selectedLanguage ==
                                                      "English"
                                                  ? const Color(
                                                      0xff0D5C46)
                                                  : Colors.grey,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),

                              Expanded(
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      selectedLanguage =
                                          "Amharic";
                                    });
                                  },

                                  child: Container(
                                    padding:
                                        const EdgeInsets.symmetric(
                                      vertical: 16,
                                    ),
                                    decoration: BoxDecoration(
                                      color:
                                          selectedLanguage ==
                                                  "Amharic"
                                              ? Colors.white
                                              : Colors.transparent,
                                      borderRadius:
                                          BorderRadius.circular(
                                              10),
                                      boxShadow:
                                          selectedLanguage ==
                                                  "Amharic"
                                              ? [
                                                  BoxShadow(
                                                    color: Colors
                                                        .black
                                                        .withOpacity(
                                                            0.05),
                                                    blurRadius: 5,
                                                  ),
                                                ]
                                              : [],
                                    ),

                                    child: Center(
                                      child: Text(
                                        "Amharic",
                                        style: TextStyle(
                                          fontWeight:
                                              FontWeight.bold,
                                          color:
                                              selectedLanguage ==
                                                      "Amharic"
                                                  ? const Color(
                                                      0xff0D5C46)
                                                  : Colors.grey,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 60),

              // =========================================================
              // CONTINUE BUTTON
              // =========================================================

              SizedBox(
                height: 56,
                width: 220,

                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        const Color(0xff0D5C46),
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(12),
                    ),
                  ),

                  onPressed: () {

                    // NEXT STEP PAGE
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            const InvestorProfilePage(),
                      ),
                    );

                  },

                  child: const Text(
                    "Continue to Profile",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // =========================================================
  // PROGRESS BAR
  // =========================================================

  Widget buildProgress(bool active) {
    return Container(
      margin: const EdgeInsets.only(left: 8),
      width: 28,
      height: 6,
      decoration: BoxDecoration(
        color: active
            ? const Color(0xff0D5C46)
            : const Color(0xffD9DDE3),
        borderRadius: BorderRadius.circular(100),
      ),
    );
  }
}