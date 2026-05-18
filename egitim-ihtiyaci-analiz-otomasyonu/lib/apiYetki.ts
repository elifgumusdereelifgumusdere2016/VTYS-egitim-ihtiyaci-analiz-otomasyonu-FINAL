import { NextResponse } from "next/server";
import {
  getCurrentAppUser,
  roleCanAccess,
  type KullaniciRolu,
} from "@/lib/yetki";

export async function requireApiRole(allowedRoles: KullaniciRolu[]) {
  const appUser = await getCurrentAppUser();

  if (!appUser.id) {
    return {
      user: appUser,
      denied: NextResponse.json(
        { message: "Oturum açmanız gerekiyor." },
        { status: 401 }
      ),
    };
  }

  if (!appUser.active) {
    return {
      user: appUser,
      denied: NextResponse.json(
        { message: "Kullanıcı hesabı aktif değil." },
        { status: 403 }
      ),
    };
  }

  if (!roleCanAccess(appUser.role, allowedRoles)) {
    return {
      user: appUser,
      denied: NextResponse.json(
        { message: "Bu işlem için yetkiniz yok." },
        { status: 403 }
      ),
    };
  }

  return {
    user: appUser,
    denied: null,
  };
}
