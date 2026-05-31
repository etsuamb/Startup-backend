import 'package:file_picker/file_picker.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:startup_connect/ui/mentor_verification_success_page.dart';

import 'mentor_professional_page.dart';
import 'mentor_registration_page.dart';

class MentorReviewPage extends StatefulWidget {
  const MentorReviewPage({super.key});

  @override
  State<MentorReviewPage> createState() =>
      _MentorReviewPageState();
}

class _MentorReviewPageState
    extends State<MentorReviewPage> {

  PlatformFile? governmentId;
  PlatformFile? certificates;
  PlatformFile? employmentProof;
  PlatformFile? profilePhoto;

  bool verifyInfo = false;
  bool agreeConduct = false;
  bool agreePrivacy = false;

  final TextEditingController commentController =
      TextEditingController();

  Future<void> pickFile(
    Function(PlatformFile file) onPicked,
  ) async {

    FilePickerResult? result =
        await FilePicker.pickFiles();

    if (result != null) {
      onPicked(result.files.first);
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: const Color(0xffF5F7F9),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 30,
          ),

          child: Center(
            child: ConstrainedBox(
              constraints:
                  const BoxConstraints(maxWidth: 1100),

              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,

                children: [

                  // =====================================================
                  // TOP PROGRESS BAR
                  // =====================================================

                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,

                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minWidth:
                            MediaQuery.of(context)
                                    .size
                                    .width -
                                40,
                      ),

                      child: Row(
                        children: [

                          stepCircle("✓", true),

                          const SizedBox(width: 10),

                          const Text(
                            "ACCOUNT INFO",
                            style: TextStyle(
                              color: Color(0xff063D33),
                              fontWeight:
                                  FontWeight.bold,
                              letterSpacing: 1.5,
                              fontSize: 12,
                            ),
                          ),

                          Container(
                            margin:
                                const EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                            width: 60,
                            height: 1,
                            color: Colors.grey.shade300,
                          ),

                          stepCircle("✓", true),

                          const SizedBox(width: 10),

                          const Text(
                            "PROFESSIONAL",
                            style: TextStyle(
                              color: Color(0xff063D33),
                              fontWeight:
                                  FontWeight.bold,
                              letterSpacing: 1.5,
                              fontSize: 12,
                            ),
                          ),

                          Container(
                            margin:
                                const EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                            width: 60,
                            height: 1,
                            color: Colors.grey.shade300,
                          ),

                          stepCircle("3", true),

                          const SizedBox(width: 10),

                          const Text(
                            "REVIEW",
                            style: TextStyle(
                              color: Color(0xff063D33),
                              fontWeight:
                                  FontWeight.bold,
                              letterSpacing: 1.5,
                              fontSize: 12,
                            ),
                          ),

                          Container(
                            margin:
                                const EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                            width: 60,
                            height: 1,
                            color: Colors.grey.shade300,
                          ),

                          stepCircle("4", false),

                          const SizedBox(width: 10),

                          Text(
                            "VERIFICATION",
                            style: TextStyle(
                              color: Colors.grey.shade400,
                              fontWeight:
                                  FontWeight.bold,
                              letterSpacing: 1.5,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 40),

                  // =====================================================
                  // TITLE
                  // =====================================================

                  const Text(
                    "Verification & Review",
                    style: TextStyle(
                      fontSize: 42,
                      fontWeight: FontWeight.bold,
                      color: Color(0xff063D33),
                    ),
                  ),

                  const SizedBox(height: 12),

                  const Text(
                    "Review your details and complete identity and expertise verification before submission.",
                    style: TextStyle(
                      fontSize: 18,
                      color: Color(0xff667085),
                    ),
                  ),

                  const SizedBox(height: 40),

                  // =====================================================
                  // ACCOUNT INFO CARD
                  // =====================================================

                  reviewCard(
                    title: "ACCOUNT INFO",
                    onEdit: () {

                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              const MentorRegistrationPage(),
                        ),
                      );
                    },
                    child: LayoutBuilder(
                      builder:
                          (context, constraints) {

                        bool mobile =
                            constraints.maxWidth <
                                700;

                        return Wrap(
                          spacing: 40,
                          runSpacing: 30,
                          children: [

                            infoItem(
                              "FULL NAME",
                              "Dawit Abraham",
                              mobile
                                  ? constraints.maxWidth
                                  : (constraints.maxWidth -
                                          40) /
                                      2,
                            ),

                            infoItem(
                              "EMAIL ADDRESS",
                              "dawit@startupconnect.com",
                              mobile
                                  ? constraints.maxWidth
                                  : (constraints.maxWidth -
                                          40) /
                                      2,
                            ),

                            infoItem(
                              "PROFESSIONAL TITLE",
                              "Senior Strategy Consultant",
                              mobile
                                  ? constraints.maxWidth
                                  : (constraints.maxWidth -
                                          40) /
                                      2,
                            ),

                            infoItem(
                              "YEARS OF EXPERIENCE",
                              "10+ Years",
                              mobile
                                  ? constraints.maxWidth
                                  : (constraints.maxWidth -
                                          40) /
                                      2,
                            ),
                          ],
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 30),

                  // =====================================================
                  // PROFESSIONAL SUMMARY
                  // =====================================================

                  reviewCard(
                    title: "PROFESSIONAL SUMMARY",
                    onEdit: () {

                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              const MentorProfessionalPage(),
                        ),
                      );
                    },
                    child: LayoutBuilder(
                      builder:
                          (context, constraints) {

                        bool mobile =
                            constraints.maxWidth <
                                700;

                        return Wrap(
                          spacing: 40,
                          runSpacing: 30,
                          children: [

                            SizedBox(
                              width: mobile
                                  ? constraints.maxWidth
                                  : (constraints.maxWidth -
                                          40) /
                                      2,

                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment
                                        .start,

                                children: [

                                  sectionTitle(
                                    "CORE EXPERTISE",
                                  ),

                                  const SizedBox(
                                      height: 14),

                                  Wrap(
                                    spacing: 10,
                                    runSpacing: 10,
                                    children: [

                                      expertiseChip(
                                          "Scaling Ops"),

                                      expertiseChip(
                                          "Venture Capital"),

                                      expertiseChip(
                                          "Fintech"),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            SizedBox(
                              width: mobile
                                  ? constraints.maxWidth
                                  : (constraints.maxWidth -
                                          40) /
                                      2,

                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment
                                        .start,

                                children: [

                                  sectionTitle(
                                    "SESSION FORMAT",
                                  ),

                                  const SizedBox(
                                      height: 10),

                                  const Text(
                                    "Virtual & In-Person (Addis)",
                                    style: TextStyle(
                                      fontWeight:
                                          FontWeight.bold,
                                      fontSize: 18,
                                      color: Color(
                                          0xff101828),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            SizedBox(
                              width: mobile
                                  ? constraints.maxWidth
                                  : (constraints.maxWidth -
                                          40) /
                                      2,

                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment
                                        .start,

                                children: [

                                  sectionTitle(
                                    "TARGET STAGES",
                                  ),

                                  const SizedBox(
                                      height: 10),

                                  const Text(
                                    "Seed, Series A",
                                    style: TextStyle(
                                      fontWeight:
                                          FontWeight.bold,
                                      fontSize: 18,
                                      color: Color(
                                          0xff101828),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 40),

                  // =====================================================
                  // VERIFICATION DOCUMENTS
                  // =====================================================

                  const Text(
                    "Verification Documents",
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xff101828),
                    ),
                  ),

                  const SizedBox(height: 24),

                  LayoutBuilder(
                    builder: (context, constraints) {

                      bool mobile =
                          constraints.maxWidth < 700;

                      return Wrap(
                        spacing: 20,
                        runSpacing: 20,
                        children: [

                          uploadCard(
                            title: "Government ID",
                            subtitle:
                                "Passport or National ID (PDF, JPG)",
                            icon: Icons.badge_outlined,
                            file: governmentId,
                            width: mobile
                                ? constraints.maxWidth
                                : (constraints.maxWidth -
                                        20) /
                                    2,
                            onTap: () {

                              pickFile((file) {
                                setState(() {
                                  governmentId = file;
                                });
                              });
                            },
                          ),

                          uploadCard(
                            title: "Certificates",
                            subtitle:
                                "Degrees or Professional Certs",
                            icon: Icons.verified_user_outlined,
                            file: certificates,
                            width: mobile
                                ? constraints.maxWidth
                                : (constraints.maxWidth -
                                        20) /
                                    2,
                            onTap: () {

                              pickFile((file) {
                                setState(() {
                                  certificates = file;
                                });
                              });
                            },
                          ),

                          uploadCard(
                            title: "Employment Proof",
                            subtitle:
                                "Reference letter or LinkedIn URL",
                            icon: Icons.description_outlined,
                            file: employmentProof,
                            width: mobile
                                ? constraints.maxWidth
                                : (constraints.maxWidth -
                                        20) /
                                    2,
                            onTap: () {

                              pickFile((file) {
                                setState(() {
                                  employmentProof = file;
                                });
                              });
                            },
                          ),

                          uploadCard(
                            title: "Profile Photo",
                            subtitle:
                                "High-quality professional headshot",
                            icon: Icons.account_circle_outlined,
                            file: profilePhoto,
                            width: mobile
                                ? constraints.maxWidth
                                : (constraints.maxWidth -
                                        20) /
                                    2,
                            onTap: () {

                              pickFile((file) {
                                setState(() {
                                  profilePhoto = file;
                                });
                              });
                            },
                          ),
                        ],
                      );
                    },
                  ),

                  const SizedBox(height: 40),

                  // =====================================================
                  // COMMENT FIELD
                  // =====================================================

                  sectionTitle(
                    "COMMENT DETAILS (OPTIONAL)",
                  ),

                  const SizedBox(height: 14),

                  TextField(
                    controller: commentController,
                    maxLines: 5,

                    decoration: InputDecoration(
                      hintText:
                          "Any additional context for the verification team...",
                      filled: true,
                      fillColor:
                          const Color(0xffF5F7F9),

                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),

                      contentPadding:
                          const EdgeInsets.all(22),
                    ),
                  ),

                  const SizedBox(height: 34),

                  // =====================================================
                  // CHECKBOXES
                  // =====================================================

                  checkBoxTile(
                    value: verifyInfo,
                    onChanged: (value) {

                      setState(() {
                        verifyInfo = value!;
                      });
                    },
                    child: const Text.rich(
                      TextSpan(
                        text:
                            "I verify that all information and documents provided are authentic and accurate.",
                      ),
                      style: TextStyle(
                        color: Color(0xff475467),
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  checkBoxTile(
                    value: agreeConduct,
                    onChanged: (value) {

                      setState(() {
                        agreeConduct = value!;
                      });
                    },
                    child: Text.rich(
                      TextSpan(
                        text:
                            "I agree to abide by the StartupConnect ",
                        children: [

                          TextSpan(
                            text:
                                "Mentor Code of Conduct",
                            style: const TextStyle(
                              color:
                                  Color(0xff063D33),
                              fontWeight:
                                  FontWeight.bold,
                            ),

                            recognizer:
                                TapGestureRecognizer()
                                  ..onTap = () {},
                          ),

                          const TextSpan(text: "."),
                        ],
                      ),
                      style: const TextStyle(
                        color: Color(0xff475467),
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  checkBoxTile(
                    value: agreePrivacy,
                    onChanged: (value) {

                      setState(() {
                        agreePrivacy = value!;
                      });
                    },
                    child: Text.rich(
                      TextSpan(
                        text:
                            "I acknowledge the ",
                        children: [

                          TextSpan(
                            text: "Privacy Policy",
                            style: const TextStyle(
                              color:
                                  Color(0xff063D33),
                              fontWeight:
                                  FontWeight.bold,
                            ),

                            recognizer:
                                TapGestureRecognizer()
                                  ..onTap = () {},
                          ),

                          const TextSpan(
                            text:
                                " regarding my personal data.",
                          ),
                        ],
                      ),
                      style: const TextStyle(
                        color: Color(0xff475467),
                      ),
                    ),
                  ),

                  const SizedBox(height: 60),

                  // =====================================================
                  // BUTTONS
                  // =====================================================

                  LayoutBuilder(
                    builder:
                        (context, constraints) {

                      bool mobile =
                          constraints.maxWidth < 700;

                      return Wrap(
                        alignment:
                            WrapAlignment.spaceBetween,
                        runSpacing: 20,
                        spacing: 20,

                        children: [

                          TextButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                            },

                            icon: const Icon(
                              Icons.arrow_back,
                            ),

                            label: const Text(
                              "Back",
                            ),
                          ),

                          SizedBox(
                            width: mobile
                                ? double.infinity
                                : 280,

                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const MentorVerificationSuccessPage(),
                                  ),
                                );
                              },

                              style:
                                  ElevatedButton.styleFrom(
                                backgroundColor:
                                    const Color(
                                        0xff063D33),

                                padding:
                                    const EdgeInsets.symmetric(
                                  vertical: 22,
                                ),

                                shape:
                                    RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius
                                          .circular(
                                              40),
                                ),

                                elevation: 8,
                              ),

                              child: const Text(
                                "Continue to Verification",
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight:
                                      FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),

                  const SizedBox(height: 60),

                  Divider(
                    color: Colors.grey.shade300,
                  ),

                  const SizedBox(height: 30),

                  // =====================================================
                  // FOOTER
                  // =====================================================

                  LayoutBuilder(
                    builder:
                        (context, constraints) {

                      bool mobile =
                          constraints.maxWidth < 700;

                      return Wrap(
                        alignment:
                            WrapAlignment.spaceBetween,
                        runSpacing: 20,
                        spacing: 20,

                        children: [

                          Wrap(
                            spacing: 20,
                            runSpacing: 12,
                            children: [

                              footerButton(
                                  "MENTORPORTAL"),

                              footerButton(
                                  "INSTITUTIONAL DASHBOARD"),
                            ],
                          ),

                          Wrap(
                            spacing: 20,
                            runSpacing: 12,
                            children: [

                              footerButton("SUPPORT"),

                              footerButton("TERMS"),

                              footerButton(
                                  "ACCESSIBILITY"),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // =========================================================
  // WIDGETS
  // =========================================================

  Widget stepCircle(
    String text,
    bool active,
  ) {
    return Container(
      width: 42,
      height: 42,

      decoration: BoxDecoration(
        color: active
            ? const Color(0xff063D33)
            : Colors.grey.shade200,

        shape: BoxShape.circle,
      ),

      child: Center(
        child: Text(
          text,
          style: TextStyle(
            color:
                active ? Colors.white : Colors.grey,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget sectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xff667085),
        fontWeight: FontWeight.bold,
        letterSpacing: 2,
        fontSize: 12,
      ),
    );
  }

  Widget expertiseChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 10,
      ),

      decoration: BoxDecoration(
        color: const Color(0xffDDF5E8),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: const Color(0xffB7E4C7),
        ),
      ),

      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xff063D33),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget infoItem(
    String title,
    String value,
    double width,
  ) {
    return SizedBox(
      width: width,

      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,

        children: [

          sectionTitle(title),

          const SizedBox(height: 10),

          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xff101828),
            ),
          ),
        ],
      ),
    );
  }

  Widget reviewCard({
    required String title,
    required Widget child,
    required VoidCallback onEdit,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),

      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius:
            BorderRadius.circular(24),
      ),

      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,

        children: [

          Row(
            mainAxisAlignment:
                MainAxisAlignment.spaceBetween,

            children: [

              Row(
                children: [

                  const Icon(
                    Icons.person_outline,
                    color: Color(0xff063D33),
                  ),

                  const SizedBox(width: 10),

                  Text(
                    title,
                    style: const TextStyle(
                      color: Color(0xff063D33),
                      fontWeight:
                          FontWeight.bold,
                      letterSpacing: 2,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),

              GestureDetector(
                onTap: onEdit,

                child: const Row(
                  children: [

                    Icon(
                      Icons.edit_outlined,
                      size: 18,
                      color: Color(0xff063D33),
                    ),

                    SizedBox(width: 6),

                    Text(
                      "EDIT",
                      style: TextStyle(
                        color: Color(0xff063D33),
                        fontWeight:
                            FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 34),

          child,
        ],
      ),
    );
  }

  Widget uploadCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required PlatformFile? file,
    required double width,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,

      child: Container(
        width: width,
        padding: const EdgeInsets.symmetric(
          vertical: 40,
          horizontal: 20,
        ),

        decoration: BoxDecoration(
          borderRadius:
              BorderRadius.circular(20),

          border: Border.all(
            color: const Color(0xffD0D5DD),
            style: BorderStyle.solid,
          ),
        ),

        child: Column(
          children: [

            Icon(
              icon,
              color: const Color(0xff063D33),
              size: 32,
            ),

            const SizedBox(height: 18),

            Text(
              file == null ? title : file.name,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xff101828),
              ),
            ),

            const SizedBox(height: 10),

            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xff98A2B3),
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget checkBoxTile({
    required bool value,
    required Widget child,
    required Function(bool?) onChanged,
  }) {
    return Row(
      crossAxisAlignment:
          CrossAxisAlignment.start,

      children: [

        Checkbox(
          value: value,
          onChanged: onChanged,
        ),

        Expanded(
          child: Padding(
            padding:
                const EdgeInsets.only(top: 12),

            child: child,
          ),
        ),
      ],
    );
  }

  Widget footerButton(String text) {
    return GestureDetector(
      onTap: () {},

      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xff667085),
          fontWeight: FontWeight.bold,
          letterSpacing: 1.5,
          fontSize: 11,
        ),
      ),
    );
  }
}