import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'investor_review_page.dart';

class InvestorVerificationPage extends StatefulWidget {
  const InvestorVerificationPage({super.key});

  @override
  State<InvestorVerificationPage> createState() => _InvestorVerificationPageState();
}

class _InvestorVerificationPageState extends State<InvestorVerificationPage> {

  PlatformFile? idFile;
  PlatformFile? tradeLicenseFile;
  PlatformFile? tinFile;

  bool confirmFinancial = false;
  bool agreeTerms = false;

  // ================= FILE PICKER =================
  Future<void> pickFile(Function(PlatformFile) onPicked) async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'png'],
    );

    if (result != null && result.files.isNotEmpty) {
      onPicked(result.files.first);
    }
  }

  // ================= UI =================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F9),

      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context), // ✅ BACK
        ),
        title: const Text(
          "Verification",
          style: TextStyle(color: Color(0xff0D3B36)),
        ),
      ),

      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0F5D4E),
            minimumSize: const Size.fromHeight(55),
          ),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const InvestorReviewPage(),
              ),
            );
          },
          child: const Text("Continue to Review"),
        ),
      ),

      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            const Text(
              "Verification and Documents",
              style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xff0D3B36)),
            ),

            const SizedBox(height: 10,),

            const Text(
              "Upload the required documents to verify your identity and investor status.",
              style: TextStyle(
                  fontSize: 12,
                  // fontWeight: FontWeight.bold,
                  color: Color(0xff0D3B36)),
            ),

            const SizedBox(height: 30),

            Row(
                children: [

                  const Text(
                    "STEP 3 OF 5",
                    style: TextStyle(
                      color: Color(0xff98A2B3),
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),

                  const Spacer(),

                  buildProgress(true),
                  buildProgress(true),
                  buildProgress(true),
                  buildProgress(false),
                  buildProgress(false),
                ],
              ),

              const SizedBox(height: 30,),

            const Text(
              "PERSONAL VERIFICATION",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),

            const SizedBox(height: 10),


            // ================= ID UPLOAD =================
            uploadTile(
              title: "ID or Passport Upload",
              file: idFile,
              onUpload: () => pickFile((f) => setState(() => idFile = f)),
              onDelete: () => setState(() => idFile = null),
            ),

            const SizedBox(height: 25),

            const Text(
              "Institutional VERIFICATION",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),

            const SizedBox(height: 10),

            // ================= TRADE LICENSE =================
            uploadTile(
              title: "Trade License",
              file: tradeLicenseFile,
              onUpload: () => pickFile(
                  (f) => setState(() => tradeLicenseFile = f)),
              onDelete: () => setState(() => tradeLicenseFile = null),
            ),

            const SizedBox(height: 12),

            // ================= TIN =================
            uploadTile(
              title: "TIN Certificate",
              file: tinFile,
              onUpload: () =>
                  pickFile((f) => setState(() => tinFile = f)),
              onDelete: () => setState(() => tinFile = null),
            ),

            const SizedBox(height: 25),

            // ================= CHECKBOXES =================
            CheckboxListTile(
              value: confirmFinancial,
              onChanged: (val) =>
                  setState(() => confirmFinancial = val!),
              title: const Text(
                "I confirm that I possess the financial capacity to engage in institutional investments.",
              ),
              controlAffinity: ListTileControlAffinity.leading,
            ),

            CheckboxListTile(
              value: agreeTerms,
              onChanged: (val) =>
                  setState(() => agreeTerms = val!),
              title: const Text(
                "I agree to the Terms of Use and acknowledge that false information may lead to permanent disqualification.",
              ),
              controlAffinity: ListTileControlAffinity.leading,
            ),

            const SizedBox(height: 20),

            const Text(
              "🔒 Your documents are protected by AES-256 encryption.",
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

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

  // ================= UPLOAD TILE =================
  Widget uploadTile({
    required String title,
    required PlatformFile? file,
    required VoidCallback onUpload,
    required VoidCallback onDelete,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [

          // LEFT ICON
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFE6F4EF),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.insert_drive_file,
                color: Color(0xff0D3B36)),
          ),

          const SizedBox(width: 12),

          // TEXT
          Expanded(
            child: file == null
                ? Text(title)
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(file.name,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold)),
                      Text(
                        "Uploaded • ${(file.size / 1024 / 1024).toStringAsFixed(1)} MB",
                        style:
                            const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
          ),

          // ACTION BUTTONS
          if (file == null)
            IconButton(
              icon: const Icon(Icons.add_circle_outline,
                  color: Color(0xff0D3B36)),
              onPressed: onUpload,
            )
          else
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.refresh,
                      color: Color(0xff0D3B36)),
                  onPressed: onUpload,
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  onPressed: onDelete,
                ),
              ],
            )
        ],
      ),
    );
  }
}

