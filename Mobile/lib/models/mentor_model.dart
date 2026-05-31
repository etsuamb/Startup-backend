class MentorModel {
  final int? id;
  final String? professionalTitle;
  final String? bio;
  final String? linkedinUrl;
  final String? yearsOfExperience;
  final String? availability;
  final String? pricing;
  final List<String>? expertiseAreas;
  final List<String>? languages;
  final String? organization;
  final String? primaryIndustry;
  final String? sessionFrequency;
  final String? mentorPlatform;
  final String? city;

  MentorModel({
    this.id,
    this.professionalTitle,
    this.bio,
    this.linkedinUrl,
    this.yearsOfExperience,
    this.availability,
    this.pricing,
    this.expertiseAreas,
    this.languages,
    this.organization,
    this.primaryIndustry,
    this.sessionFrequency,
    this.mentorPlatform,
    this.city,
  });

  factory MentorModel.fromJson(Map<String, dynamic> json) {
    return MentorModel(
      id: json['id'],
      professionalTitle: json['professional_title'] ?? json['title'],
      bio: json['bio'],
      linkedinUrl: json['linkedin_url'] ?? json['linkedin'],
      yearsOfExperience: json['years_of_experience'],
      availability: json['availability'],
      pricing: json['pricing'],
      expertiseAreas: json['expertise_areas'] != null ? List<String>.from(json['expertise_areas']) : null,
      languages: json['languages'] != null ? List<String>.from(json['languages']) : null,
      organization: json['organization'],
      primaryIndustry: json['primary_industry'],
      sessionFrequency: json['session_frequency'],
      mentorPlatform: json['mentor_platform'],
      city: json['city'],
    );
  }
}
