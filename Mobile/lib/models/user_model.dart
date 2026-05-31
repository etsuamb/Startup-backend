class UserModel {
  final int? id;
  final String? email;
  final String? firstName;
  final String? lastName;
  final String? role;
  final String? phone;
  final String? profilePicture;
  final bool? emailVerified;
  final bool? approved;
  final String? status;

  UserModel({
    this.id,
    this.email,
    this.firstName,
    this.lastName,
    this.role,
    this.phone,
    this.profilePicture,
    this.emailVerified,
    this.approved,
    this.status,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      firstName: json['first_name'],
      lastName: json['last_name'],
      role: json['role'],
      phone: json['phone'],
      profilePicture: json['profile_picture'],
      emailVerified: json['email_verified'],
      approved: json['approved'],
      status: json['status'],
    );
  }

  String get fullName => '${firstName ?? ''} ${lastName ?? ''}'.trim();
}
