import { Role, RoleBit } from '../model/auth.model';

export class RoleUtils {
  static bitsFromRoles(roles: Role[]): number {
    let bits = RoleBit.None;
    if (!roles) {
      return bits;
    }
    if (roles.includes(Role.Admin)) {
      bits += RoleBit.Admin;
    }
    if (roles.includes(Role.User)) {
      bits += RoleBit.User;
    }
    return bits;
  }

  static inRoleBits(role: RoleBit, roleBits: number): boolean {
    return (roleBits & role) > 0;
  }

  static rolesContain(srcRoles: Role[], role: Role) {
    return srcRoles.includes(role);
  }

  static rolesContainAnyOf(srcRoles: Role[], targetRoles: Role[]) {
    if (srcRoles.length > 0 && targetRoles.length == 0) {
      return false;
    }
    for (let n = 0; n < targetRoles.length; n++) {
      if (srcRoles.includes(targetRoles[n])) {
        return true;
      }
    }
    return false;
  }

  static rolesContainAllOf(srcRoles: Role[], targetRoles: Role[]) {
    if (srcRoles.length > 0 && targetRoles.length == 0) {
      return false;
    }
    for (let n = 0; n < targetRoles.length; n++) {
      if (!srcRoles.includes(targetRoles[n])) {
        return false;
      }
    }
    return true;
  }
}
