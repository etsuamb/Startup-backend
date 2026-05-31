class StartupModel {
  final int? id;
  final String name;
  final String? category;
  final String? stage;
  final String description;
  final bool locked;
  final String? logo;
  final String? industry;
  final String? businessType;
  final String? yearFounded;
  final String? region;
  final String? city;
  final int? teamSize;
  final String? founderRole;
  final String? tagline;
  final String? website;
  final String? status;

  StartupModel({
    this.id,
    required this.name,
    this.category,
    this.stage,
    required this.description,
    this.locked = true,
    this.logo,
    this.industry,
    this.businessType,
    this.yearFounded,
    this.region,
    this.city,
    this.teamSize,
    this.founderRole,
    this.tagline,
    this.website,
    this.status,
  });

  factory StartupModel.fromJson(Map<String, dynamic> json) {
    return StartupModel(
      id: json['id'],
      name: json['name'] ?? json['startup_name'] ?? '',
      category: json['category'] ?? json['industry'],
      stage: json['stage'],
      description: json['description'] ?? json['tagline'] ?? '',
      locked: json['locked'] ?? true,
      logo: json['logo'] ?? json['startup_logo'],
      industry: json['industry'],
      businessType: json['business_type'] ?? json['startup_type'],
      yearFounded: json['year_founded'],
      region: json['region'],
      city: json['city'],
      teamSize: json['team_size'],
      founderRole: json['founder_role'],
      tagline: json['tagline'],
      website: json['website'],
      status: json['status'],
    );
  }
}
