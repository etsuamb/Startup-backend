import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';
import 'email_verification_page.dart';
import 'startup_dashboard_page.dart';

class StartupRegistrationPage extends StatefulWidget {
  final Map<String, String>? accountData;

  const StartupRegistrationPage({super.key, this.accountData});

  @override
  State<StartupRegistrationPage> createState() => _StartupRegistrationPageState();
}

class _StartupRegistrationPageState extends State<StartupRegistrationPage> {
  final founderNameController = TextEditingController();
  final phoneController = TextEditingController();
  final startupNameController = TextEditingController();
  final taglineController = TextEditingController();
  final websiteController = TextEditingController();
  final teamSizeController = TextEditingController();
  final cityController = TextEditingController();
  String selectedIndustry = "";
  String selectedStage = "";
  String selectedType = "";
  String selectedRegion = "";
  final founderRoleController = TextEditingController();
  String foundedYear = "";
  bool loading = false;
  String? error;

  final ImagePicker _picker = ImagePicker();
  XFile? _founderIdFile;
  XFile? _startupLogoFile;
  PlatformFile? _businessRegFile;

  final List<String> industries = ["Technology", "FinTech", "HealthTech", "AgriTech", "EdTech", "E-commerce", "Manufacturing", "Logistics", "Real Estate", "Tourism", "Other"];
  final List<String> stages = ["Idea Stage", "Pre-Seed", "Seed", "Early Growth"];
  final List<String> types = ["B2B", "B2C", "B2G", "Marketplace"];
  final List<String> regions = [
    "Addis Ababa", "Dire Dawa", "Harari", "Oromia", "Amhara",
    "SNNPR", "Gambela", "Benishangul-Gumuz", "Somali", "Afar", "Tigray"
  ];

  @override
  void initState() {
    super.initState();
    final acct = widget.accountData ?? {};
    founderNameController.text = acct['full_name'] ?? '${acct['first_name'] ?? ''} ${acct['last_name'] ?? ''}'.trim();
    phoneController.text = acct['phone_number'] ?? '';
  }

  Future<void> _submit() async {
    setState(() { loading = true; error = null; });

    // Client-side validation matching backend rules
    if (selectedStage.isEmpty || selectedType.isEmpty || selectedRegion.isEmpty || selectedIndustry.isEmpty || foundedYear.isEmpty) {
      setState(() { loading = false; error = "Please fill in all required fields"; });
      return;
    }
    if (founderNameController.text.trim().isEmpty || startupNameController.text.trim().isEmpty ||
        taglineController.text.trim().isEmpty || cityController.text.trim().isEmpty ||
        teamSizeController.text.trim().isEmpty || founderRoleController.text.trim().isEmpty) {
      setState(() { loading = false; error = "Please fill in all required fields"; });
      return;
    }

    final parsedYear = int.tryParse(foundedYear);
    if (parsedYear == null || parsedYear < 1900 || parsedYear > 2100) {
      setState(() { loading = false; error = "Founded year must be between 1900 and 2100"; });
      return;
    }

    final parsedTeamSize = int.tryParse(teamSizeController.text.trim());
    if (parsedTeamSize == null || parsedTeamSize < 0) {
      setState(() { loading = false; error = "Team size must be a non-negative number"; });
      return;
    }

    if (_founderIdFile == null || _startupLogoFile == null || _businessRegFile == null) {
      setState(() { loading = false; error = "Please upload all required documents (Founder ID, Startup Logo, Business Registration Proof)"; });
      return;
    }

    try {
      final acct = widget.accountData ?? {};
      final body = <String, dynamic>{
        'first_name': acct['first_name'] ?? '',
        'last_name': acct['last_name'] ?? '',
        'email': acct['email'] ?? '',
        'password': acct['password'] ?? '',
        'confirm_password': acct['password'] ?? '',
        'role': 'Startup',
        'founder_full_name': founderNameController.text.trim(),
        'phone_number': phoneController.text.trim().isEmpty ? (acct['phone_number'] ?? '') : phoneController.text.trim(),
        'startup_name': startupNameController.text.trim(),
        'industry': selectedIndustry,
        'startup_tagline': taglineController.text.trim(),
        'business_stage': selectedStage,
        'startup_type': selectedType,
        'founded_year': foundedYear,
        'region': selectedRegion,
        'city': cityController.text.trim(),
        'team_size': teamSizeController.text.trim(),
        'founder_role': founderRoleController.text.trim().isEmpty ? acct['first_name'] ?? '' : founderRoleController.text.trim(),
        'website': websiteController.text.trim(),
      };

      body.removeWhere((k, v) => v.toString().trim().isEmpty);

      final filePaths = <String, String>{
        'founder_id': _founderIdFile!.path,
        'startup_logo': _startupLogoFile!.path,
        'business_registration_proof': _businessRegFile!.path!,
      };

      final result = await ApiService.postMultipart('/auth/register', body, filePaths: filePaths);
      if (result['error'] != null || result['message'] != null && result['statusCode'] == null) {
        final msg = result['message'] ?? result['error'] ?? 'Registration failed';
        final debugInfo = result['debug'];
        setState(() => error = debugInfo != null ? '$msg ($debugInfo)' : msg);
        return;
      }
      if (result['token'] != null) {
        await ApiService.setTokens(result['token'], result['refreshToken'] ?? '');
      }
      if (mounted) {
        if (result['emailVerificationSent'] == true) {
          Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => EmailVerificationPage(
            email: acct['email'] ?? '',
            role: 'Startup',
            accountData: result,
          )));
        } else {
          Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StartupDashboardPage()));
        }
      }
    } catch (e) {
      setState(() => error = 'Error: $e');
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isMobile = size.width < 700;

    return Scaffold(
      backgroundColor: const Color(0xffF7F8FA),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Color(0xff344054)), onPressed: () => Navigator.pop(context)),
        title: Text("Startup Registration", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xff0D3B36))),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(isMobile ? 16 : 40),
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 700),
              padding: EdgeInsets.all(isMobile ? 20 : 40),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15)]),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (widget.accountData != null) ...[
                  Container(
                    width: double.infinity, padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: const Color(0xffF0FDF6), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xffB8E7D2))),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text("Account: ${widget.accountData!['email']}", style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xff065F46), fontSize: 14)),
                      const SizedBox(height: 4),
                      Text("${widget.accountData!['first_name']} ${widget.accountData!['last_name']}  |  ${widget.accountData!['phone_number']}", style: const TextStyle(color: Color(0xff344054), fontSize: 13)),
                    ]),
                  ),
                  const SizedBox(height: 20),
                ],
                Text("Startup Details", style: TextStyle(fontSize: isMobile ? 28 : 36, fontWeight: FontWeight.bold, color: const Color(0xff0D1833))),
                const SizedBox(height: 6),
                Text("Fill in your startup information to complete registration", style: TextStyle(fontSize: isMobile ? 14 : 16, color: const Color(0xff7B8494))),
                const SizedBox(height: 30),
                if (error != null) Container(width: double.infinity, padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12)), child: Text(error!, style: TextStyle(color: Colors.red.shade800))),
                if (error != null) const SizedBox(height: 16),

                buildField("Founder Full Name", founderNameController, "e.g. Abebe Kebede"),
                const SizedBox(height: 20),
                buildField("Phone Number", phoneController, "+251 912 345 678"),
                const SizedBox(height: 20),
                buildField("Startup Name", startupNameController, "e.g. PayEasy"),
                const SizedBox(height: 20),
                buildField("Tagline", taglineController, "A short description of your startup"),
                const SizedBox(height: 20),
                buildField("Website (optional)", websiteController, "https://"),
                const SizedBox(height: 20),
                buildDropdown("Industry", selectedIndustry, industries, (v) => setState(() => selectedIndustry = v), hint: "Select Industry"),
                const SizedBox(height: 20),
                buildDropdown("Stage", selectedStage, stages, (v) => setState(() => selectedStage = v), hint: "Select Stage"),
                const SizedBox(height: 20),
                buildDropdown("Type", selectedType, types, (v) => setState(() => selectedType = v), hint: "Select Type"),
                const SizedBox(height: 20),
                buildDropdown("Region", selectedRegion, regions, (v) => setState(() => selectedRegion = v), hint: "Select Region"),
                const SizedBox(height: 20),
                buildField("City", cityController, "e.g. Addis Ababa"),
                const SizedBox(height: 20),
                buildField("Team Size", teamSizeController, "e.g. 5"),
                const SizedBox(height: 20),
                buildField("Founder Role", founderRoleController, "CEO, CTO, Lead Engineer..."),
                const SizedBox(height: 20),
                buildDropdown("Founded Year", foundedYear, List.generate(25, (i) => (2026 - i).toString()), (v) => setState(() => foundedYear = v), hint: "Select Year"),
                const SizedBox(height: 24),
                Text("Required Documents", style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xff111827), fontSize: 16)),
                const SizedBox(height: 12),
                _fileField("Founder ID (PNG/JPG)", _founderIdFile, () async { final f = await _picker.pickImage(source: ImageSource.gallery); if (f != null) setState(() => _founderIdFile = f); }, () => setState(() => _founderIdFile = null)),
                const SizedBox(height: 12),
                _fileField("Startup Logo (PNG/JPG)", _startupLogoFile, () async { final f = await _picker.pickImage(source: ImageSource.gallery); if (f != null) setState(() => _startupLogoFile = f); }, () => setState(() => _startupLogoFile = null)),
                const SizedBox(height: 12),
                _pdfFileField("Business Registration Proof (PDF)", _businessRegFile, () async {
                  final f = await FilePicker.pickFiles(type: FileType.custom, allowedExtensions: ['pdf']);
                  if (f != null && f.files.isNotEmpty) setState(() => _businessRegFile = f.files.first);
                }, () => setState(() => _businessRegFile = null)),
                const SizedBox(height: 34),
                SizedBox(
                  width: double.infinity, height: 56,
                  child: ElevatedButton(
                    onPressed: loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xff065F46), foregroundColor: Colors.white, elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: loading
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text("Submit Registration", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  ),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  Widget _fileField(String label, XFile? file, VoidCallback onPick, VoidCallback onClear) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Icon(file != null ? Icons.check_circle : Icons.upload_file, color: file != null ? const Color(0xff065F46) : const Color(0xff98A2B3), size: 22),
        const SizedBox(width: 12),
        Expanded(child: Text(file != null ? file.name : label, overflow: TextOverflow.ellipsis, style: TextStyle(color: file != null ? const Color(0xff065F46) : const Color(0xff667085), fontWeight: FontWeight.w500))),
        if (file != null)
          IconButton(icon: const Icon(Icons.close, size: 18), onPressed: onClear, padding: EdgeInsets.zero, constraints: const BoxConstraints())
        else
          TextButton(onPressed: onPick, child: const Text("Choose", style: TextStyle(color: Color(0xff065F46)))),
      ]),
    );
  }

  Widget _pdfFileField(String label, PlatformFile? file, VoidCallback onPick, VoidCallback onClear) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Icon(file != null ? Icons.check_circle : Icons.upload_file, color: file != null ? const Color(0xff065F46) : const Color(0xff98A2B3), size: 22),
        const SizedBox(width: 12),
        Expanded(child: Text(file != null ? file.name : label, overflow: TextOverflow.ellipsis, style: TextStyle(color: file != null ? const Color(0xff065F46) : const Color(0xff667085), fontWeight: FontWeight.w500))),
        if (file != null)
          IconButton(icon: const Icon(Icons.close, size: 18), onPressed: onClear, padding: EdgeInsets.zero, constraints: const BoxConstraints())
        else
          TextButton(onPressed: onPick, child: const Text("Choose", style: TextStyle(color: Color(0xff065F46)))),
      ]),
    );
  }

  Widget buildField(String label, TextEditingController ctrl, String hint) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xff111827), fontSize: 14)),
      const SizedBox(height: 8),
      TextField(controller: ctrl, decoration: InputDecoration(
        hintText: hint, hintStyle: const TextStyle(color: Color(0xffA0A8B5)),
        filled: true, fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xff065F46), width: 1.5)),
      )),
    ]);
  }

  Widget buildDropdown(String label, String value, List<String> items, void Function(String) onChanged, {String? hint}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xff111827), fontSize: 14)),
      const SizedBox(height: 8),
      Container(
        width: double.infinity, padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(12)),
        child: DropdownButtonHideUnderline(child: DropdownButton<String>(
          value: value.isEmpty ? null : value,
          isExpanded: true,
          hint: hint != null ? Text(hint, style: const TextStyle(color: Color(0xffA0A8B5))) : null,
          style: const TextStyle(color: Color(0xff111827), fontSize: 16),
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (v) { if (v != null) onChanged(v); },
        )),
      ),
    ]);
  }

  @override
  void dispose() {
    founderNameController.dispose();
    phoneController.dispose();
    startupNameController.dispose();
    taglineController.dispose();
    websiteController.dispose();
    teamSizeController.dispose();
    cityController.dispose();
    founderRoleController.dispose();
    super.dispose();
  }
}
