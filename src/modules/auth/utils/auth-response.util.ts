import { Role } from "../../../common/enums";

export class AuthResponseUtil {
  static formatAuthUser(user: any) {
    const isAdmin = user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN;
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: isAdmin
        ? "Super Admin"
        : user.merchantProfile?.businessName ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.email.split("@")[0],
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: isAdmin ? "admin" : "merchant",
      status: user.status,
      merchantId: user.merchantProfile?.id,
      merchantProfile: user.merchantProfile,
    };
  }
}
