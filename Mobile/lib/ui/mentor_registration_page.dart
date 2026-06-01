import 'package:file_picker/file_picker.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:startup_connect/ui/mentor_professional_page.dart';
import 'login_page.dart';

// import 'login_page.dart';

class MentorRegistrationPage extends StatefulWidget {
  final Map<String, String>? accountData;
  const MentorRegistrationPage({super.key, this.accountData});

  @override
  State<MentorRegistrationPage> createState() =>
      _MentorRegistrationPageState();
}

class _MentorRegistrationPageState
    extends State<MentorRegistrationPage> {

  final TextEditingController phoneController =
      TextEditingController();

  final TextEditingController titleController =
      TextEditingController();

  final TextEditingController languageController =
      TextEditingController();

  final TextEditingController expertiseController =
      TextEditingController();

  final TextEditingController bioController =
      TextEditingController();

  final TextEditingController linkedinController =
      TextEditingController();

  final TextEditingController pricingController =
      TextEditingController();

  List<String> languages = [
    "Amharic",
    "English",
  ];

  List<String> expertiseAreas = [
    "Fintech Strategy",
    "Scaling Teams",
  ];

  String selectedExperience = "5 - 10 years";

  String selectedAvailability =
      "1-2 hours / week";

  bool acceptedTerms = false;

  String? selectedFileName;

  Future<void> pickFile() async {

    FilePickerResult? result =
        await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'png'],
    );

    if (result != null) {
      setState(() {
        selectedFileName =
            result.files.single.name;
      });
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 40,
          ),

          child: Center(
            child: ConstrainedBox(
              constraints:
                  const BoxConstraints(maxWidth: 900),

              child: Column(
                children: [

                  // ===================================================
                  // STEP INDICATOR
                  // ===================================================

                  Row(
                    mainAxisAlignment:
                        MainAxisAlignment.center,
                    children: [

                      stepItem("1", true,
                          "Account Info"),

                      stepLine(),

                      stepItem("2", false,
                          "Professional"),

                      stepLine(),

                      stepItem(
                          "3", false, "Review"),

                      stepLine(),

                      stepItem("4", false,
                          "Verification"),
                    ],
                  ),

                  const SizedBox(height: 40),

                  // ===================================================
                  // MAIN CARD
                  // ===================================================

                  Container(
                    width: double.infinity,
                    padding:
                        const EdgeInsets.all(40),

                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius:
                          BorderRadius.circular(28),
                    ),

                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [

                        const Center(
                          child: Column(
                            children: [

                              Text(
                                "Create Mentor Profile",
                                style: TextStyle(
                                  fontSize: 44,
                                  fontWeight:
                                      FontWeight.bold,
                                  color:
                                      Color(0xff063D33),
                                ),
                              ),

                              SizedBox(height: 10),

                              Text(
                                "Share your expertise and help drive innovation in Ethiopia",
                                textAlign:
                                    TextAlign.center,
                                style: TextStyle(
                                  color:
                                      Color(0xff667085),
                                  fontSize: 18,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 50),

                        // ===================================================
                        // PHONE
                        // ===================================================

                        const Text(
                          "Phone Number",
                          style: TextStyle(
                            fontWeight:
                                FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 10),

                        buildInputField(
                          controller:
                              phoneController,
                          hint:
                              "+251 911...",
                        ),

                        const SizedBox(height: 30),

                        // ===================================================
                        // TITLE
                        // ===================================================

                        const Text(
                          "Professional Title",
                          style: TextStyle(
                            fontWeight:
                                FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 10),

                        buildInputField(
                          controller:
                              titleController,
                          hint:
                              "e.g. Senior Software Engineer",
                        ),

                        const SizedBox(height: 30),

                        // ===================================================
                        // EXPERIENCE + LANGUAGES
                        // ===================================================

                        LayoutBuilder(
                          builder:
                              (context, constraints) {

                            bool mobile =
                                constraints.maxWidth <
                                    700;

                            return Wrap(
                              spacing: 20,
                              runSpacing: 20,
                              children: [

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints
                                                  .maxWidth /
                                              2) -
                                          10,

                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment
                                            .start,
                                    children: [

                                      const Text(
                                        "Years of Experience",
                                        style:
                                            TextStyle(
                                          fontWeight:
                                              FontWeight
                                                  .bold,
                                        ),
                                      ),

                                      const SizedBox(
                                          height:
                                              10),

                                      buildDropdown(
                                        value:
                                            selectedExperience,
                                        items: const [
                                          "5 - 10 years",
                                          "1 - 4 years",
                                          "10+ years",
                                        ],
                                        onChanged:
                                            (value) {
                                          setState(
                                              () {
                                            selectedExperience =
                                                value!;
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                ),

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints
                                                  .maxWidth /
                                              2) -
                                          10,

                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment
                                            .start,
                                    children: [

                                      const Text(
                                        "Languages",
                                        style:
                                            TextStyle(
                                          fontWeight:
                                              FontWeight
                                                  .bold,
                                        ),
                                      ),

                                      const SizedBox(
                                          height:
                                              10),

                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        children: [
                                          ...languages
                                              .map(
                                                (lang) =>
                                                    buildChip(
                                                  lang,
                                                  () {
                                                    setState(
                                                        () {
                                                      languages.remove(
                                                          lang);
                                                    });
                                                  },
                                                ),
                                              ),

                                          SizedBox(
                                            width:
                                                200,
                                            child:
                                                buildInputField(
                                              controller:
                                                  languageController,
                                              hint:
                                                  "Add another...",
                                              onSubmitted:
                                                  (
                                                value,
                                              ) {
                                                if (value
                                                    .trim()
                                                    .isNotEmpty) {
                                                  setState(
                                                      () {
                                                    languages.add(
                                                        value);
                                                    languageController.clear();
                                                  });
                                                }
                                              },
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            );
                          },
                        ),

                        const SizedBox(height: 30),

                        // ===================================================
                        // EXPERTISE
                        // ===================================================

                        const Text(
                          "Expertise Areas",
                          style: TextStyle(
                            fontWeight:
                                FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 10),

                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [

                            ...expertiseAreas.map(
                              (area) => buildChip(
                                area,
                                () {
                                  setState(() {
                                    expertiseAreas
                                        .remove(area);
                                  });
                                },
                              ),
                            ),

                            SizedBox(
                              width: 180,
                              child: OutlinedButton(
                                onPressed: () {

                                  showDialog(
                                    context: context,
                                    builder:
                                        (context) {

                                      return AlertDialog(
                                        title: const Text(
                                            "Add Expertise"),

                                        content:
                                            TextField(
                                          controller:
                                              expertiseController,
                                          decoration:
                                              const InputDecoration(
                                            hintText:
                                                "Enter expertise",
                                          ),
                                        ),

                                        actions: [

                                          TextButton(
                                            onPressed:
                                                () {
                                              Navigator.pop(
                                                  context);
                                            },
                                            child:
                                                const Text(
                                              "Cancel",
                                            ),
                                          ),

                                          ElevatedButton(
                                            onPressed:
                                                () {

                                              if (expertiseController
                                                  .text
                                                  .trim()
                                                  .isNotEmpty) {

                                                setState(
                                                    () {
                                                  expertiseAreas.add(
                                                      expertiseController.text);
                                                  expertiseController.clear();
                                                });
                                              }

                                              Navigator.pop(
                                                  context);
                                            },

                                            child:
                                                const Text(
                                              "Add",
                                            ),
                                          ),
                                        ],
                                      );
                                    },
                                  );
                                },

                                style:
                                    OutlinedButton
                                        .styleFrom(
                                  side:
                                      const BorderSide(
                                    color: Color(
                                        0xff0D5C46),
                                  ),

                                  padding:
                                      const EdgeInsets.symmetric(
                                    vertical: 20,
                                  ),

                                  shape:
                                      RoundedRectangleBorder(
                                    borderRadius:
                                        BorderRadius.circular(
                                            14),
                                  ),
                                ),

                                child: const Text(
                                  "+ Add Expertise",
                                  style: TextStyle(
                                    color: Color(
                                        0xff0D5C46),
                                    fontWeight:
                                        FontWeight
                                            .bold,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 30),

                        // ===================================================
                        // BIO
                        // ===================================================

                        const Text(
                          "Professional Bio",
                          style: TextStyle(
                            fontWeight:
                                FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 10),

                        buildInputField(
                          controller:
                              bioController,
                          hint:
                              "Briefly describe your journey and how you can help startups...",
                          maxLines: 6,
                        ),

                        const SizedBox(height: 30),

                        // ===================================================
                        // LINKEDIN
                        // ===================================================

                        const Text(
                          "LinkedIn/Portfolio URL",
                          style: TextStyle(
                            fontWeight:
                                FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 10),

                        buildInputField(
                          controller:
                              linkedinController,
                          hint:
                              "https://linkedin.com/in/...",
                        ),

                        const SizedBox(height: 30),

                        // ===================================================
                        // FILE PICKER
                        // ===================================================

                        const Text(
                          "Certifications & Credentials",
                          style: TextStyle(
                            fontWeight:
                                FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 10),

                        GestureDetector(
                          onTap: pickFile,

                          child: Container(
                            width: double.infinity,
                            padding:
                                const EdgeInsets.symmetric(
                              vertical: 50,
                            ),

                            decoration: BoxDecoration(
                              borderRadius:
                                  BorderRadius.circular(
                                      20),

                              border: Border.all(
                                color: Colors
                                    .grey.shade300,
                                style:
                                    BorderStyle.solid,
                              ),
                            ),

                            child: Column(
                              children: [

                                Icon(
                                  Icons.upload_file,
                                  color:
                                      Colors.grey.shade500,
                                  size: 34,
                                ),

                                const SizedBox(
                                    height: 16),

                                const Text(
                                  "Drag and drop files here",
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),

                                const SizedBox(
                                    height: 6),

                                Text(
                                  selectedFileName ??
                                      "PDF, JPG up to 10MB",
                                  style: const TextStyle(
                                    color:
                                        Color(0xff98A2B3),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 30),

                        // ===================================================
                        // AVAILABILITY + PRICING
                        // ===================================================

                        LayoutBuilder(
                          builder:
                              (context, constraints) {

                            bool mobile =
                                constraints.maxWidth <
                                    700;

                            return Wrap(
                              spacing: 20,
                              runSpacing: 20,
                              children: [

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints
                                                  .maxWidth /
                                              2) -
                                          10,

                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment
                                            .start,
                                    children: [

                                      const Text(
                                        "Availability Preference",
                                        style:
                                            TextStyle(
                                          fontWeight:
                                              FontWeight
                                                  .bold,
                                        ),
                                      ),

                                      const SizedBox(
                                          height:
                                              10),

                                      buildDropdown(
                                        value:
                                            selectedAvailability,
                                        items: const [
                                          "1-2 hours / week",
                                          "3-5 hours / week",
                                          "5+ hours / week",
                                        ],
                                        onChanged:
                                            (value) {
                                          setState(
                                              () {
                                            selectedAvailability =
                                                value!;
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                ),

                                SizedBox(
                                  width: mobile
                                      ? double.infinity
                                      : (constraints
                                                  .maxWidth /
                                              2) -
                                          10,

                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment
                                            .start,
                                    children: [

                                      const Text(
                                        "Optional Session Pricing (ETB)",
                                        style:
                                            TextStyle(
                                          fontWeight:
                                              FontWeight
                                                  .bold,
                                        ),
                                      ),

                                      const SizedBox(
                                          height:
                                              10),

                                      Row(
                                        children: [

                                          Container(
                                            padding:
                                                const EdgeInsets.symmetric(
                                              horizontal:
                                                  20,
                                              vertical:
                                                  18,
                                            ),

                                            decoration:
                                                BoxDecoration(
                                              color: const Color(
                                                  0xffF2F4F7),

                                              borderRadius:
                                                  const BorderRadius.only(
                                                topLeft:
                                                    Radius.circular(
                                                        14),
                                                bottomLeft:
                                                    Radius.circular(
                                                        14),
                                              ),
                                            ),

                                            child:
                                                const Text(
                                              "ETB",
                                              style:
                                                  TextStyle(
                                                fontWeight:
                                                    FontWeight.bold,
                                              ),
                                            ),
                                          ),

                                          Expanded(
                                            child:
                                                TextField(
                                              controller:
                                                  pricingController,

                                              decoration:
                                                  InputDecoration(
                                                hintText:
                                                    "0.00",

                                                filled:
                                                    true,

                                                fillColor:
                                                    const Color(
                                                        0xffF2F4F7),

                                                border:
                                                    const OutlineInputBorder(
                                                  borderSide:
                                                      BorderSide.none,

                                                  borderRadius:
                                                      BorderRadius.only(
                                                    topRight:
                                                        Radius.circular(
                                                            14),
                                                    bottomRight:
                                                        Radius.circular(
                                                            14),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            );
                          },
                        ),

                        const SizedBox(height: 30),

                        // ===================================================
                        // TERMS
                        // ===================================================

                        Container(
                          padding:
                              const EdgeInsets.all(20),

                          decoration: BoxDecoration(
                            color:
                                const Color(0xffF9FAFB),
                            borderRadius:
                                BorderRadius.circular(
                                    18),
                          ),

                          child: Row(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [

                              Checkbox(
                                value: acceptedTerms,
                                onChanged: (value) {
                                  setState(() {
                                    acceptedTerms =
                                        value!;
                                  });
                                },
                              ),

                              const Expanded(
                                child: Padding(
                                  padding:
                                      EdgeInsets.only(
                                    top: 12,
                                  ),

                                  child: Text(
                                    "I agree to the Terms of Service and Privacy Policy. I certify that all professional information provided is accurate and verifiable.",
                                    style: TextStyle(
                                      color:
                                          Color(0xff667085),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 40),

                        // ===================================================
                        // BUTTON
                        // ===================================================

                        SizedBox(
                          width: double.infinity,
                          height: 60,

                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      const MentorProfessionalPage(),
                                ),
                              );
                            },

                            style:
                                ElevatedButton
                                    .styleFrom(
                              backgroundColor:
                                  const Color(
                                      0xff063D33),

                              shape:
                                  RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(
                                        16),
                              ),
                            ),

                            child: const Text(
                              "Continue to Professional",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight:
                                    FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 30),

                        Center(
                          child: GestureDetector(
                            onTap: () {

                              // Navigator.push(
                              //   context,
                              //   MaterialPageRoute(
                              //     builder: (_) =>
                              //         const LoginPage(),
                              //   ),
                              // );
                            },

                            child: RichText(
                              text: TextSpan(
                                style: TextStyle(
                                  color:
                                      Color(0xff98A2B3),
                                ),
                                children: [

                                  TextSpan(
                                    text:
                                        "Already have an account? ",
                                  ),

                                  TextSpan(
                                    text: "Sign in",
                                    style: TextStyle(
                                      color: Color(
                                          0xff063D33),
                                      fontWeight:
                                          FontWeight
                                              .bold,
                                    ),
                                    recognizer: TapGestureRecognizer()
                                    ..onTap = () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => const LoginPage(),
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 40),

                  // ===================================================
                  // FOOTER
                  // ===================================================

                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 30,
                    runSpacing: 20,
                    children: [

                      footerButton("MentorPortal"),

                      footerButton(
                          "PRIVACY POLICY"),

                      footerButton(
                          "INSTITUTIONAL TERMS"),

                      footerButton(
                          "ACCESSIBILITY"),

                      footerButton(
                          "CONTACT REGISTRY"),

                      const Text(
                        "© 2024 Mentor Portal",
                        style: TextStyle(
                          color: Color(0xff667085),
                          fontWeight:
                              FontWeight.w600,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // =========================================================
  // REUSABLES
  // =========================================================

  Widget buildInputField({
    required TextEditingController controller,
    required String hint,
    int maxLines = 1,
    Function(String)? onSubmitted,
  }) {

    return TextField(
      controller: controller,
      maxLines: maxLines,
      onSubmitted: onSubmitted,

      decoration: InputDecoration(
        hintText: hint,

        filled: true,
        fillColor: const Color(0xffF2F4F7),

        contentPadding:
            const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 18,
        ),

        border: OutlineInputBorder(
          borderSide: BorderSide.none,
          borderRadius:
              BorderRadius.circular(14),
        ),
      ),
    );
  }

  Widget buildDropdown({
    required String value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {

    return DropdownButtonFormField<String>(
      value: value,
      onChanged: onChanged,

      decoration: InputDecoration(
        filled: true,
        fillColor: const Color(0xffF2F4F7),

        border: OutlineInputBorder(
          borderSide: BorderSide.none,
          borderRadius:
              BorderRadius.circular(14),
        ),
      ),

      items: items.map((item) {
        return DropdownMenuItem(
          value: item,
          child: Text(item),
        );
      }).toList(),
    );
  }

  Widget buildChip(
    String text,
    VoidCallback onRemove,
  ) {

    return Container(
      padding:
          const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 10,
      ),

      decoration: BoxDecoration(
        color: const Color(0xffB8E6D0),
        borderRadius:
            BorderRadius.circular(12),
      ),

      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [

          Text(
            text,
            style: const TextStyle(
              color: Color(0xff063D33),
              fontWeight: FontWeight.w600,
            ),
          ),

          const SizedBox(width: 8),

          GestureDetector(
            onTap: onRemove,

            child: const Icon(
              Icons.close,
              size: 18,
              color: Color(0xff063D33),
            ),
          ),
        ],
      ),
    );
  }

  Widget stepItem(
    String number,
    bool active,
    String label,
  ) {

    return Column(
      children: [

        Container(
          width: 42,
          height: 42,

          decoration: BoxDecoration(
            color: active
                ? const Color(0xff063D33)
                : const Color(0xffEAECF0),

            shape: BoxShape.circle,
          ),

          child: Center(
            child: Text(
              number,
              style: TextStyle(
                color: active
                    ? Colors.white
                    : const Color(0xff667085),

                fontWeight:
                    FontWeight.bold,
              ),
            ),
          ),
        ),

        const SizedBox(height: 10),

        Text(
          label,
          style: TextStyle(
            color: active
                ? const Color(0xff063D33)
                : const Color(0xff98A2B3),

            fontWeight:
                FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget stepLine() {

    return Container(
      width: 60,
      height: 2,
      margin:
          const EdgeInsets.only(bottom: 26),
      color: const Color(0xffEAECF0),
    );
  }

  Widget footerButton(String text) {

    return GestureDetector(
      onTap: () {},

      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xff667085),
          fontWeight: FontWeight.w700,
          letterSpacing: 1,
          fontSize: 12,
        ),
      ),
    );
  }
}