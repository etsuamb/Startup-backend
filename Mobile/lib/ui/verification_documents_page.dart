import 'dart:math';

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'review_submit_page.dart';

class VerificationDocumentsPage extends StatefulWidget {
  const VerificationDocumentsPage({super.key});

  @override
  State<VerificationDocumentsPage> createState() =>
      _VerificationDocumentsPageState();
}

class _VerificationDocumentsPageState
    extends State<VerificationDocumentsPage> {

  PlatformFile? founderIdFile;
  PlatformFile? businessProofFile;
  PlatformFile? SupportLetterFile;
  PlatformFile? TinCertificateFile;
  PlatformFile? LogoFile;
  PlatformFile? AddressProofFile;

  


  Future<void> pickFile(Function(PlatformFile) onPicked,
      {List<String>? allowedExtensions}) async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: allowedExtensions ?? ['pdf', 'jpg', 'png', 'svg'],
    );

    if (result != null && result.files.isNotEmpty) {
      onPicked(result.files.first);
    }
  }

  Future<void> pickFile2(Function(PlatformFile) onPicked,
      {List<String>? allowedExtensions}) async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: allowedExtensions ?? ['png', 'svg', 'jpg'],
    );

    if (result != null && result.files.isNotEmpty) {
      onPicked(result.files.first);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F9),

      // ✅ FIXED BUTTON (always visible)
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
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
                  builder: (_) => const ReviewSubmitPage(),
                ),
              );
            },
            child: const Text("Continue to Review ->"),
          ),
        ),
      ),

      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Verification Documents",
          style: TextStyle(
              fontWeight: FontWeight.bold, color: Color(0xff0D3B36)),
        ),
      ),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 90), // space for button
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              Row(
                children: [
                  const Text(
                    "STEP 3 OF 4",
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xff98A2B3),
                    ),
                  ),
                  const Spacer(),
                  buildProgress(false),
                  buildProgress(false),
                  buildProgress(true),
                  buildProgress(false),
                ],
              ),

              const SizedBox(height: 30),

              // INFO BOX
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFE6F4EF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Icon(Icons.warning, size: 18, color: Color(0xff0B7A5B)),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        "Important: These files are only for verification. Pitch deck, business plan, financial summary, and demo video are uploaded later when creating a project.",
                        style: TextStyle(fontSize: 13,
                        color: Color(0xff0D3B36)),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // REQUIRED
              // const Text("Required Documents",
              //     style:
              //         TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xff0D3B36))),

            Row(
                children: [
                  const Expanded(
                    child: Text(
                      "Required Documents",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xff0D3B36),
                      ),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xffECFDF3),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      "3 Items Needed",
                      style: TextStyle(fontSize: 11),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              uploadCard(
                title: "Founder or representative ID",
                subtitle:
                    "A clear scan of your National ID, Passport, or Kebele ID.",
                file: founderIdFile,
                formatText: "PDF, JPG, PNG (Max. 5MB)", // ✅ NEW
                onUpload: () => pickFile(
                  (file) => setState(() => founderIdFile = file),
                ),
              ),

              const SizedBox(height: 16),

              uploadCard(
                title: "Business registration proof",
                subtitle:
                    "Valid investment permit or business license from MoTI.",
                file: businessProofFile,
                formatText: "PDF, JPG, PNG (Max. 5MB)", // ✅ NEW
                onUpload: () => pickFile(
                  (file) => setState(() => businessProofFile = file),
                ),
              ),

              const SizedBox(height: 20),

              // OPTIONAL HEADER
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      "Optional Documents",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xff0D3B36),
                      ),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xffECFDF3),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      "ENHANCED PROFILE",
                      style: TextStyle(fontSize: 11),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // ✅ GRID LAYOUT
              responsiveGrid([
                uploadCard(
                title: "Support or affiliation letter",
                subtitle:
                    "Letter from an incubator, hub, or relevant government body.",
                file: SupportLetterFile,
                formatText: "PDF, JPG, PNG (Max. 5MB)", // ✅ NEW
                onUpload: () => pickFile(
                  (file) => setState(() => SupportLetterFile = file),
                ),
              ),
                uploadCard(
                title: "TIN Certificate",
                subtitle:
                    "Tax ID Proof.",
                file: TinCertificateFile,
                formatText: "PDF, JPG, PNG (Max. 5MB)", // ✅ NEW
                onUpload: () => pickFile(
                  (file) => setState(() => TinCertificateFile = file),
                ),
              ),
                uploadCard(
                title: "Startup Logo",
                subtitle:
                    "",
                file: LogoFile,
                formatText: "JPG, PNG, SVG (Max. 5MB)", // ✅ NEW
                onUpload: () => pickFile2(
                  (file) => setState(() => LogoFile = file),
                ),
              ),
                uploadCard(
                title: "Proof of Address",
                subtitle:
                    "Utility bill or lease agreement.",
                file: AddressProofFile,
                formatText: "PDF, JPG, PNG (Max. 5MB)", // ✅ NEW
                onUpload: () => pickFile(
                  (file) => setState(() => AddressProofFile = file),
                ),
              ),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  // ================= COMPONENTS =================

  Widget uploadCard({
    required String title,
    required String subtitle,
    required PlatformFile? file,
    required VoidCallback onUpload,
    required String formatText, // ✅ NEW
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEFEFF1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 12),

          file == null
              ? GestureDetector(
                  onTap: onUpload,
                  child: Container(
                    height: 100,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: Colors.grey.shade400,
                        style: BorderStyle.solid,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Column(
                        children: [
                          SizedBox(height: 15),
                          Icon(
                            Icons.file_upload_outlined,
                            color: Color(0xff0D3B36),
                          ),
                          const Text(
                            "Click to upload or drag & drop",
                            style: TextStyle(
                              color: Color(0xff0D3B36),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            formatText, // ✅ SHOW TEXT HERE
                            style: const TextStyle(
                              fontSize: 11,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              : Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,

                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.green),
                      const SizedBox(width: 10),
                      Expanded(child: Text(file.name)),
                      IconButton(
                        icon: const Icon(Icons.refresh),
                        onPressed: onUpload,
                      ),
                    ],
                  ),
                ),
        ],
      ),
    );
  }

  // ✅ GRID RESPONSIVE
  Widget responsiveGrid(List<Widget> children) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 600) {
          return Wrap(
            spacing: 12,
            runSpacing: 12,
            children: children
                .map((e) => SizedBox(
                      width: (constraints.maxWidth / 2) - 10,
                      child: e,
                    ))
                .toList(),
          );
        } else {
          return Column(
            children: children
                .map((e) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: e,
                    ))
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
        color:
            active ? const Color(0xff0B7A5B) : const Color(0xffD9DDE3),
        borderRadius: BorderRadius.circular(100),
      ),
    );
  }
}