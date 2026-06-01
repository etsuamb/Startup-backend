class InvestorModel {
  final int? id;
  final String? organizationName;
  final String? investorType;
  final String? bio;
  final String? website;
  final String? preferredStage;
  final String? investmentRange;
  final String? location;
  final List<String>? preferredSectors;

  InvestorModel({
    this.id,
    this.organizationName,
    this.investorType,
    this.bio,
    this.website,
    this.preferredStage,
    this.investmentRange,
    this.location,
    this.preferredSectors,
  });

  factory InvestorModel.fromJson(Map<String, dynamic> json) {
    return InvestorModel(
      id: json['id'],
      organizationName: json['organization_name'],
      investorType: json['investor_type'],
      bio: json['bio'],
      website: json['website'],
      preferredStage: json['preferred_stage'],
      investmentRange: json['investment_range'],
      location: json['location'],
      preferredSectors: json['preferred_sectors'] != null ? List<String>.from(json['preferred_sectors']) : null,
    );
  }
}
