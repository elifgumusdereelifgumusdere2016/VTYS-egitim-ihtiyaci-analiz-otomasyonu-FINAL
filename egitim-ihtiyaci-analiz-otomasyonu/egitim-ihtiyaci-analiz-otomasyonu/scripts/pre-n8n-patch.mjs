import fs from "fs";

function patchFile(filePath, patches) {
  if (!fs.existsSync(filePath)) {
    console.log("Skipped missing file:", filePath);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  for (const patch of patches) {
    if (content.includes(patch.check)) {
      continue;
    }

    if (!content.includes(patch.find)) {
      console.log("Could not find target in:", filePath);
      console.log("Target:", patch.find.slice(0, 120));
      continue;
    }

    content = content.replace(patch.find, patch.replace);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Patched:", filePath);
  } else {
    console.log("No changes:", filePath);
  }
}

patchFile("app/api/degerlendirmeler/route.ts", [
  {
    check: '"n8n Status"?: string;',
    find: '"Updated By User ID"?: string;\n};',
    replace: '"Updated By User ID"?: string;\n  "n8n Status"?: string;\n  "AI Status"?: string;\n  "Automation Lock"?: boolean;\n  "Automation Error"?: string;\n  "AI Summary"?: string;\n  "AI Recommendation Reason"?: string;\n  "AI Recommendation Count"?: number;\n};'
  },
  {
    check: '"Source"?: string;',
    find: '"Frontend Visible"?: boolean;\n};',
    replace: '"Frontend Visible"?: boolean;\n  "Source"?: string;\n  "AI Confidence Score"?: number;\n  "n8n Status"?: string;\n  "Automation Error"?: string;\n  "AI Recommendation Reason"?: string;\n};'
  },
  {
    check: '"n8n Status": "Pending"',
    find: '"Updated By User ID": user?.id || "anonymous",',
    replace: '"Updated By User ID": user?.id || "anonymous",\n          "n8n Status": "Pending",\n          "AI Status": "Queued",\n          "Automation Lock": false,\n          "Automation Error": "",\n          "AI Summary": "",\n          "AI Recommendation Reason": "Kural tabanlı değerlendirme oluşturuldu.",'
  },
  {
    check: '"Source": "Rule-Based"',
    find: '"Frontend Visible": true,\n        }',
    replace: '"Frontend Visible": true,\n          "Source": "Rule-Based",\n          "AI Confidence Score": 0.7,\n          "n8n Status": "Skipped",\n          "Automation Error": "",\n          "AI Recommendation Reason": `${kriterName} kriterinde düşük puan tespit edildi.`,\n        }'
  }
]);

patchFile("app/api/egitim-onerileri/[id]/route.ts", [
  {
    check: '"Approved By User ID"?: string;',
    find: '"Frontend Visible"?: boolean;\n};',
    replace: '"Frontend Visible"?: boolean;\n  "Approved By User ID"?: string;\n  "Approved At"?: string;\n  "n8n Status"?: string;\n};'
  },
  {
    check: '"Approved At": new Date().toISOString()',
    find: '"Frontend Visible": true,\n      };',
    replace: '"Frontend Visible": true,\n        "Approved By User ID": access.user.id,\n        "Approved At": new Date().toISOString(),\n        "n8n Status": "Pending",\n      };'
  }
]);

patchFile("app/api/egitim-onerileri/[id]/plan/route.ts", [
  {
    check: '"Source"?: string;',
    find: '"Frontend Visible"?: boolean;\n};',
    replace: '"Frontend Visible"?: boolean;\n  "Source"?: string;\n  "n8n Status"?: string;\n  "Automation Error"?: string;\n  "Notification Status"?: string;\n  "Reminder Count"?: number;\n};'
  },
  {
    check: '"Participant Response Source"?: string;',
    find: '"Sertifika Verildi Mi"?: boolean;\n};',
    replace: '"Sertifika Verildi Mi"?: boolean;\n  "Notification Status"?: string;\n  "Reminder Count"?: number;\n  "Participant Response Source"?: string;\n};'
  },
  {
    check: '"Source": "Rule-Based"',
    find: '"Frontend Visible": true,\n      }',
    replace: '"Frontend Visible": true,\n        "Source": "Rule-Based",\n        "n8n Status": "Pending",\n        "Automation Error": "",\n        "Notification Status": "Pending",\n        "Reminder Count": 0,\n      }'
  },
  {
    check: '"Participant Response Source": "System"',
    find: '"Sertifika Verildi Mi": false,\n        }',
    replace: '"Sertifika Verildi Mi": false,\n          "Notification Status": "Pending",\n          "Reminder Count": 0,\n          "Participant Response Source": "System",\n        }'
  }
]);

patchFile("app/api/egitim-planlari/route.ts", [
  {
    check: '"Notification Status"?: string;',
    find: '"Frontend Visible"?: boolean;\n};',
    replace: '"Frontend Visible"?: boolean;\n  "Source"?: string;\n  "n8n Status"?: string;\n  "Automation Error"?: string;\n  "Notification Status"?: string;\n  "Reminder Count"?: number;\n};'
  },
  {
    check: '"Source": "Manual"',
    find: '"Frontend Visible": true,\n    };',
    replace: '"Frontend Visible": true,\n      "Source": "Manual",\n      "n8n Status": "Pending",\n      "Automation Error": "",\n      "Notification Status": "Pending",\n      "Reminder Count": 0,\n    };'
  }
]);

patchFile("app/api/egitim-planlari/[id]/katilimcilar/route.ts", [
  {
    check: '"Participant Response Source"?: string;',
    find: '"Sertifika Verildi Mi"?: boolean;\n};',
    replace: '"Sertifika Verildi Mi"?: boolean;\n  "Notification Status"?: string;\n  "Reminder Count"?: number;\n  "Participant Response Source"?: string;\n};'
  },
  {
    check: '"Participant Response Source": "Admin"',
    find: '"Sertifika Verildi Mi": false,\n      }',
    replace: '"Sertifika Verildi Mi": false,\n        "Notification Status": "Pending",\n        "Reminder Count": 0,\n        "Participant Response Source": "Admin",\n      }'
  }
]);

patchFile("app/api/profilim/planlar/[id]/katil/route.ts", [
  {
    check: '"Participant Response Source"?: string;',
    find: '"Sertifika Verildi Mi"?: boolean;\n};',
    replace: '"Sertifika Verildi Mi"?: boolean;\n  "Notification Status"?: string;\n  "Reminder Count"?: number;\n  "Participant Response Source"?: string;\n};'
  },
  {
    check: '"Participant Response Source": "Employee"',
    find: '"Sertifika Verildi Mi": false,\n      }',
    replace: '"Sertifika Verildi Mi": false,\n        "Notification Status": "Pending",\n        "Reminder Count": 0,\n        "Participant Response Source": "Employee",\n      }'
  }
]);

patchFile("app/api/profilim/katilim/[id]/route.ts", [
  {
    check: '"Participant Response Source"?: string;',
    find: '"Sertifika Verildi Mi"?: boolean;\n};',
    replace: '"Sertifika Verildi Mi"?: boolean;\n  "Participant Response Source"?: string;\n};'
  },
  {
    check: '"Participant Response Source": "Employee"',
    find: '"Katılım Durumu": "Katılacak",\n      };',
    replace: '"Katılım Durumu": "Katılacak",\n        "Participant Response Source": "Employee",\n      };'
  },
  {
    check: '"Katılım Durumu": "Katılamayacak",\n        "Participant Response Source": "Employee",',
    find: '"Katılım Durumu": "Katılamayacak",\n        "Tamamlama Durumu": "Tamamlanmadı",\n      };',
    replace: '"Katılım Durumu": "Katılamayacak",\n        "Tamamlama Durumu": "Tamamlanmadı",\n        "Participant Response Source": "Employee",\n      };'
  },
  {
    check: '"Katılım Durumu": "Katıldı",\n        "Participant Response Source": "Employee",',
    find: '"Katılım Durumu": "Katıldı",\n        "Tamamlama Durumu": "Tamamlandı",\n      };',
    replace: '"Katılım Durumu": "Katıldı",\n        "Tamamlama Durumu": "Tamamlandı",\n        "Participant Response Source": "Employee",\n      };'
  }
]);

patchFile("app/api/onboarding/route.ts", [
  {
    check: '"Onboarding Completed": true',
    find: '"Son Giriş Tarihi": now,',
    replace: '"Son Giriş Tarihi": now,\n          "Onboarding Completed": true,\n          "Last Sync Source": "Clerk",'
  },
  {
    check: '"Profile Source": "Onboarding"',
    find: '"Profil Görünür Mü": true,',
    replace: '"Profil Görünür Mü": true,\n          "Profile Source": "Onboarding",\n          "Last Profile Sync": now,'
  }
]);

console.log("Pre-n8n patch finished.");
