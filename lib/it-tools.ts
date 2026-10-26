import {
  si7zip,
  siAnydesk,
  siBitwarden,
  siKeepassxc,
  siMalwarebytes,
  siNotepadplusplus,
  siRustdesk,
  siTeamviewer,
  siWireshark,
  type SimpleIcon,
} from "simple-icons";

export type Availability = "open" | "free" | "paid";

export type ItTool = {
  name: string;
  category: ItCategory;
  description: string;
  availability: Availability;
  /** Licence or pricing shown on the card. */
  note: string;
  url: string;
  icon?: SimpleIcon;
};

export type ItCategory = "remote" | "hardware" | "network" | "recovery" | "security" | "utilities";

export const IT_CATEGORIES: { id: ItCategory; label: string; text: string }[] = [
  { id: "remote", label: "Remote support", text: "Help a colleague by seeing and controlling their screen." },
  { id: "hardware", label: "Hardware diagnostics", text: "Check temperatures, disks and memory when a machine misbehaves." },
  { id: "network", label: "Network", text: "Find devices, test connections and look at traffic." },
  { id: "recovery", label: "Boot & recovery", text: "Make install USBs, clone disks and get lost files back." },
  { id: "security", label: "Security", text: "Clean infections and keep passwords safe." },
  { id: "utilities", label: "System utilities", text: "Everyday tools for looking inside Windows and editing files." },
];

export const AVAILABILITY: Record<Availability, { label: string; tone: "green" | "amber" | "blue" }> = {
  open: { label: "Open source", tone: "green" },
  free: { label: "Free", tone: "amber" },
  paid: { label: "Paid", tone: "blue" },
};

export const IT_TOOLS: ItTool[] = [
  { name: "RustDesk", category: "remote", availability: "open", note: "AGPL-3.0", description: "Open source remote desktop. Can run on our own relay server.", url: "https://rustdesk.com", icon: siRustdesk },
  { name: "AnyDesk", category: "remote", availability: "paid", note: "Paid for business use", description: "Fast remote desktop for quick support sessions.", url: "https://anydesk.com", icon: siAnydesk },
  { name: "TeamViewer", category: "remote", availability: "paid", note: "Paid for business use", description: "Remote access and support with device management.", url: "https://www.teamviewer.com", icon: siTeamviewer },
  { name: "Quick Assist", category: "remote", availability: "free", note: "Built into Windows", description: "Microsoft's built-in screen sharing for Windows 10 and 11.", url: "https://learn.microsoft.com/windows/client-management/client-tools/quick-assist" },

  { name: "HWiNFO", category: "hardware", availability: "free", note: "Free for personal and business use", description: "Detailed hardware information with live sensor readings.", url: "https://www.hwinfo.com" },
  { name: "CrystalDiskInfo", category: "hardware", availability: "open", note: "MIT", description: "Reads SMART data to warn about failing drives early.", url: "https://crystalmark.info/en/software/crystaldiskinfo/" },
  { name: "Memtest86+", category: "hardware", availability: "open", note: "GPL-2.0", description: "Boots from USB and tests RAM for errors behind random crashes.", url: "https://www.memtest.org" },

  { name: "Wireshark", category: "network", availability: "open", note: "GPL-2.0", description: "Captures and inspects network traffic packet by packet.", url: "https://www.wireshark.org", icon: siWireshark },
  { name: "Nmap", category: "network", availability: "free", note: "Free · source available", description: "Scans networks to find hosts, open ports and services.", url: "https://nmap.org" },
  { name: "Angry IP Scanner", category: "network", availability: "open", note: "GPL-2.0", description: "Quick scan of a subnet to see what is online.", url: "https://angryip.org" },
  { name: "PuTTY", category: "network", availability: "open", note: "MIT", description: "SSH and serial client for servers and network gear.", url: "https://www.chiark.greenend.org.uk/~sgtatham/putty/" },

  { name: "Ventoy", category: "recovery", availability: "open", note: "GPL-3.0", description: "One USB stick that boots many ISO files, no re-flashing.", url: "https://www.ventoy.net" },
  { name: "Rufus", category: "recovery", availability: "open", note: "GPL-3.0", description: "Creates bootable Windows and Linux USB drives.", url: "https://rufus.ie" },
  { name: "Clonezilla", category: "recovery", availability: "open", note: "GPL-2.0", description: "Clones and images whole disks for backup or replacement.", url: "https://clonezilla.org" },
  { name: "TestDisk & PhotoRec", category: "recovery", availability: "open", note: "GPL-2.0+", description: "Repairs partition tables and recovers deleted files.", url: "https://www.cgsecurity.org" },

  { name: "Malwarebytes", category: "security", availability: "paid", note: "Free scanner + paid plans", description: "Finds and removes malware that other tools miss.", url: "https://www.malwarebytes.com", icon: siMalwarebytes },
  { name: "KeePassXC", category: "security", availability: "open", note: "GPL-3.0", description: "Offline password manager with an encrypted database.", url: "https://keepassxc.org", icon: siKeepassxc },
  { name: "Bitwarden", category: "security", availability: "open", note: "Open source · paid plans", description: "Password manager with shared vaults for teams.", url: "https://bitwarden.com", icon: siBitwarden },

  { name: "Sysinternals Suite", category: "utilities", availability: "free", note: "Free from Microsoft", description: "Process Explorer, Autoruns and more for deep Windows troubleshooting.", url: "https://learn.microsoft.com/sysinternals/" },
  { name: "7-Zip", category: "utilities", availability: "open", note: "LGPL-2.1", description: "Opens and creates zip, 7z, rar and most other archives.", url: "https://www.7-zip.org", icon: si7zip },
  { name: "Notepad++", category: "utilities", availability: "open", note: "GPL-3.0", description: "Lightweight editor for logs, configs and scripts.", url: "https://notepad-plus-plus.org", icon: siNotepadplusplus },
  { name: "Everything", category: "utilities", availability: "free", note: "Free", description: "Finds any file on a Windows machine instantly by name.", url: "https://www.voidtools.com" },
];
