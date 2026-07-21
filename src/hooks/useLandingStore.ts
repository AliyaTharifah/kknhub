import { create } from "zustand";
import { supabase, isSandboxMode } from "@/lib/supabase";
import { toast } from "sonner";

export interface Proker {
  id: string;
  name: string;
  pic: string;
  deadline: string;
  status: "Belum Mulai" | "Sedang Berjalan" | "Selesai";
  progress: number; // 0 to 100
  location?: string;
  description?: string;
  members?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  category: "Umum" | "Program Kerja" | "Kesehatan" | "Pendidikan" | "Lingkungan";
  location?: string;
  pic?: string;
  program_id?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface LogbookEntry {
  id: string;
  user_id: string;
  user_name: string;
  timeline_id: string;
  timeline_title: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  location: string;
  status: "Draft" | "Selesai";
  photos: string[];
  created_at: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  size: string;
  uploadDate: string;
  fileUrl: string;
  uploadedBy: string;
}

export interface NotulenItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: string;
  agenda: string;
  results: string;
  decisions: string;
  actions: string;
}

interface LandingStore {
  prokers: Proker[];
  timelineEvents: TimelineEvent[];
  galleryItems: GalleryItem[];
  logbooks: LogbookEntry[];
  documents: DocumentItem[];
  notulen: NotulenItem[];
  totalMembers: number;
  totalLogbooks: number;
  totalDocs: number;
  targetStartDate: string; // ISO String
  targetEndDate: string; // ISO String
  getAverageProgress: () => number;
  fetchLandingData: () => Promise<void>;
  addTimelineEvent: (event: Omit<TimelineEvent, "id">) => Promise<void>;
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => Promise<void>;
  deleteTimelineEvent: (id: string) => Promise<void>;
  updateProker: (
    id: string,
    progress: number,
    status: Proker["status"],
    name?: string,
    pic?: string,
    deadline?: string,
    location?: string,
    description?: string,
    members?: string
  ) => Promise<void>;
  addProker: (proker: Omit<Proker, "id">) => Promise<void>;
  deleteProker: (id: string) => Promise<void>;
  addLogbook: (entry: Omit<LogbookEntry, "id" | "created_at">) => Promise<void>;
  updateLogbook: (id: string, updates: Partial<LogbookEntry>) => Promise<void>;
  deleteLogbook: (id: string) => Promise<void>;
  addDocument: (doc: Omit<DocumentItem, "id" | "uploadDate">) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  renameDocument: (id: string, newName: string) => Promise<void>;
  addNotulen: (note: Omit<NotulenItem, "id">) => Promise<void>;
  updateNotulen: (id: string, updates: Partial<NotulenItem>) => Promise<void>;
  deleteNotulen: (id: string) => Promise<void>;
  initializeStats: () => Promise<void>;
}

// Supabase helper functions
const getOrCreateGroupId = async () => {
  const { data: groups } = await supabase.from("groups").select("id").limit(1);
  if (groups && groups.length > 0) {
    return groups[0].id;
  }
  const { data: newGroup, error } = await supabase
    .from("groups")
    .insert({ group_name: "Kelompok 211", village: "Sukaluyu", district: "Cianjur", year: 2026 })
    .select("id")
    .single();
  if (error) throw error;
  return newGroup.id;
};

const getOrCreateDefaultProgramId = async () => {
  const { data: existing } = await supabase
    .from("programs")
    .select("id")
    .eq("title", "Kegiatan Umum Posko KKN")
    .limit(1);
  if (existing && existing.length > 0) {
    return existing[0].id;
  }
  const groupId = await getOrCreateGroupId();
  const { data: created, error } = await supabase
    .from("programs")
    .insert({
      group_id: groupId,
      title: "Kegiatan Umum Posko KKN",
      status: "Berjalan",
      progress: 100,
      description: "Program kerja default untuk menampung timeline agenda umum."
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
};

const linkAllUsersToGroup = async (groupId: string) => {
  try {
    const { data: users } = await supabase.from("users").select("id");
    const { data: existing } = await supabase.from("group_members").select("user_id").eq("group_id", groupId);
    const existingUserIds = new Set(existing?.map(e => e.user_id) || []);
    
    if (users) {
      const toInsert = users.filter(u => !existingUserIds.has(u.id)).map(u => ({
        group_id: groupId,
        user_id: u.id
      }));
      if (toInsert.length > 0) {
        await supabase.from("group_members").insert(toInsert);
      }
    }
  } catch (e) {
    console.error("Gagal menautkan anggota ke grup:", e);
  }
};

const formatTimeForDb = (timeStr: string) => {
  if (!timeStr) return "08:00:00";
  const cleaned = timeStr.replace(/[^0-9:]/g, "").trim();
  const parts = cleaned.split(":");
  if (parts.length >= 2) {
    const hh = parts[0].padStart(2, "0");
    const mm = parts[1].padStart(2, "0");
    const ss = parts[2] ? parts[2].padStart(2, "0") : "00";
    return `${hh}:${mm}:${ss}`;
  }
  return "08:00:00";
};

const encodeDescription = (category: string, description: string) => {
  return `[Category: ${category}] ${description}`;
};

const decodeDescription = (dbDescription: string | null) => {
  if (!dbDescription) return { category: "Umum" as const, description: "" };
  const match = dbDescription.match(/^\[Category: (Umum|Program Kerja|Kesehatan|Pendidikan|Lingkungan)\] ([\s\S]*)$/);
  if (match) {
    return {
      category: match[1] as "Umum" | "Program Kerja" | "Kesehatan" | "Pendidikan" | "Lingkungan",
      description: match[2]
    };
  }
  return { category: "Umum" as const, description: dbDescription };
};

const encodeProkerDescription = (description: string, members: string) => {
  return `[Members: ${members || ""}] ${description || ""}`;
};

const decodeProkerDescription = (dbDescription: string | null) => {
  if (!dbDescription) return { description: "", members: "" };
  const match = dbDescription.match(/^\[Members: ([\s\S]*?)\] ([\s\S]*)$/);
  if (match) {
    return {
      members: match[1],
      description: match[2]
    };
  }
  return { description: dbDescription, members: "" };
};

const loadLocalData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveLocalData = <T>(key: string, data: T) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save local data:", e);
  }
};

export const DEFAULT_PROKERS: Proker[] = [
  {
    id: "default-proker-1",
    name: "Pembuatan Digitalisasi Website Desa & Portal KKNHub",
    pic: "Aliya Tharifah",
    deadline: "2026-08-15",
    status: "Sedang Berjalan",
    progress: 75,
    location: "Posko KKN Sukaluyu",
    description: "Mengembangkan portal sistem informasi desa dan manajemen logbook digital anggota KKN 211 Sukaluyu.",
    members: "Aliya Tharifah, Rizky Ramadan, Sarah Az-Zahra"
  },
  {
    id: "default-proker-2",
    name: "Penyuluhan Kesehatan & Stunting Balita Posyandu",
    pic: "Sarah Az-Zahra",
    deadline: "2026-08-05",
    status: "Selesai",
    progress: 100,
    location: "Posyandu Melati Desa Sukaluyu",
    description: "Pemberian edukasi gizi seimbang serta pemeriksaan tumbuh kembang balita bersama kader Posyandu.",
    members: "Sarah Az-Zahra, Budi Pratama, Maya Indah"
  },
  {
    id: "default-proker-3",
    name: "Bimbingan Belajar & Pelatihan Komputer SD",
    pic: "Ahmad Fauzi",
    deadline: "2026-08-10",
    status: "Sedang Berjalan",
    progress: 50,
    location: "SDN 1 Sukaluyu",
    description: "Pelatihan dasar penggunaan komputer dan bimbingan membaca/berhitung untuk siswa SD Desa Sukaluyu.",
    members: "Ahmad Fauzi, Dini Lestari, Budi Pratama"
  },
  {
    id: "default-proker-4",
    name: "Kerja Bakti & Penghijauan Lingkungan Desa",
    pic: "Rian Perdana",
    deadline: "2026-08-20",
    status: "Belum Mulai",
    progress: 20,
    location: "RW 03 Desa Sukaluyu",
    description: "Penanaman 200 bibit pohon buah dan pembenahan fasilitas tempat sampah pemilahan organik/anorganik.",
    members: "Rian Perdana, Farhan Kurniadi, Dewi Anggraini"
  }
];

export const DEFAULT_TIMELINES: TimelineEvent[] = [
  {
    id: "default-timeline-1",
    title: "Sosialisasi Program Kerja ke Perangkat Desa",
    date: "2026-07-25",
    time: "09:00 - 11:30",
    description: "Paparan seluruh rencana kegiatan KKN 211 di hadapan Kepala Desa, BPD, dan Tokoh Masyarakat Sukaluyu.",
    category: "Umum",
    location: "Balai Desa Sukaluyu",
    pic: "Aliya Tharifah",
    program_id: "default-proker-1"
  },
  {
    id: "default-timeline-2",
    title: "Pelaksanaan Posyandu & Edukasi Stunting",
    date: "2026-08-05",
    time: "08:00 - 12:00",
    description: "Pemeriksaan berat & tinggi badan balita dan penyuluhan gizi seimbang balita.",
    category: "Kesehatan",
    location: "Posyandu Melati RW 02",
    pic: "Sarah Az-Zahra",
    program_id: "default-proker-2"
  },
  {
    id: "default-timeline-3",
    title: "Pelatihan Literasi Digital & Komputer Dasar",
    date: "2026-08-10",
    time: "13:00 - 15:30",
    description: "Mengajarkan pengenalan komputer dasar dan pemanfaatan internet sehat untuk murid SD.",
    category: "Pendidikan",
    location: "Labkom SDN 1 Sukaluyu",
    pic: "Ahmad Fauzi",
    program_id: "default-proker-3"
  },
  {
    id: "default-timeline-4",
    title: "Penanaman Bibit Pohon & Kerja Bakti",
    date: "2026-08-20",
    time: "07:00 - 11:00",
    description: "Aksi hijau bersama pemuda Karang Taruna penanaman 200 bibit tanaman produktif.",
    category: "Lingkungan",
    location: "Area Resapan RW 03",
    pic: "Rian Perdana",
    program_id: "default-proker-4"
  }
];

export const DEFAULT_LOGBOOKS: LogbookEntry[] = [
  {
    id: "default-log-1",
    user_id: "user-1",
    user_name: "Aliya Tharifah",
    timeline_id: "default-timeline-1",
    timeline_title: "Sosialisasi Program Kerja ke Perangkat Desa",
    date: "2026-07-22",
    start_time: "09:00",
    end_time: "11:30",
    description: "Rapat koordinasi perdana dengan Kepala Desa dan jajaran sekretariat desa mengenai teknis pelaksanaan KKN 211 Sukaluyu.",
    location: "Balai Desa Sukaluyu",
    status: "Selesai",
    photos: [
      "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80"
    ],
    created_at: "2026-07-22T12:00:00Z"
  },
  {
    id: "default-log-2",
    user_id: "user-2",
    user_name: "Sarah Az-Zahra",
    timeline_id: "default-timeline-2",
    timeline_title: "Pelaksanaan Posyandu & Edukasi Stunting",
    date: "2026-07-24",
    start_time: "08:00",
    end_time: "12:00",
    description: "Pendataan dan penimbangan balita serta pembagian makanan tambahan bergizi di Posyandu Melati.",
    location: "Posyandu Melati RW 02",
    status: "Selesai",
    photos: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
    ],
    created_at: "2026-07-24T13:00:00Z"
  },
  {
    id: "default-log-3",
    user_id: "user-3",
    user_name: "Ahmad Fauzi",
    timeline_id: "default-timeline-3",
    timeline_title: "Pelatihan Literasi Digital & Komputer Dasar",
    date: "2026-07-26",
    start_time: "13:00",
    end_time: "15:30",
    description: "Sesi kelas komputer dasar dan bimbingan belajar gratis untuk siswa SDN 1 Sukaluyu.",
    location: "SDN 1 Sukaluyu",
    status: "Selesai",
    photos: [
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80"
    ],
    created_at: "2026-07-26T16:00:00Z"
  }
];

export const DEFAULT_DOCUMENTS: DocumentItem[] = [
  {
    id: "default-doc-1",
    name: "Proposal Kegiatan KKN 211 Sukaluyu.pdf",
    category: "Proposal",
    size: "2.4 MB",
    uploadDate: "2026-07-21",
    fileUrl: "#",
    uploadedBy: "Sekretaris"
  },
  {
    id: "default-doc-2",
    name: "Struktur Organisasi & Tata Tertib Posko.pdf",
    category: "Administrasi",
    size: "1.1 MB",
    uploadDate: "2026-07-21",
    fileUrl: "#",
    uploadedBy: "Sekretaris"
  },
  {
    id: "default-doc-3",
    name: "Laporan Mingguan KKN Minggu I.pdf",
    category: "Laporan",
    size: "3.5 MB",
    uploadDate: "2026-07-25",
    fileUrl: "#",
    uploadedBy: "Sekretaris"
  }
];

export const DEFAULT_NOTULEN: NotulenItem[] = [
  {
    id: "default-note-1",
    title: "Rapat Perdana Pembagian Tugas Proker",
    date: "2026-07-21",
    time: "19:30 - 21:00",
    location: "Posko KKN Sukaluyu",
    attendees: "Aliya, Sarah, Ahmad, Rian, Dini, Budi",
    agenda: "Pembagian PIC masing-masing program kerja dan penyusunan anggaran awal",
    results: "Disepakati Aliya PIC Website, Sarah PIC Posyandu, Ahmad PIC Bimbel SD, Rian PIC Penghijauan",
    decisions: "Setiap PIC wajib menyerahkan proposal & jadwal teknis H-2 sebelum pelaksanaan",
    actions: "Sekretaris menyiapkan surat izin lokasi dan permohonan fasilitas ke Balai Desa"
  }
];

export const useLandingStore = create<LandingStore>((set, get) => ({
  prokers: DEFAULT_PROKERS,
  timelineEvents: DEFAULT_TIMELINES,
  galleryItems: [],
  logbooks: DEFAULT_LOGBOOKS,
  documents: DEFAULT_DOCUMENTS,
  notulen: DEFAULT_NOTULEN,
  totalMembers: 15,
  totalLogbooks: DEFAULT_LOGBOOKS.length,
  totalDocs: DEFAULT_LOGBOOKS.reduce((sum, l) => sum + (l.photos?.length || 0), 0) + DEFAULT_DOCUMENTS.length,
  targetStartDate: "2026-07-21T00:00:00+07:00",
  targetEndDate: "2026-08-24T23:59:59+07:00",
  
  getAverageProgress: () => {
    const prokers = get().prokers;
    if (prokers.length === 0) return 0;
    const sum = prokers.reduce((acc, curr) => acc + curr.progress, 0);
    return Math.round(sum / prokers.length);
  },

  fetchLandingData: async () => {
    if (isSandboxMode) {
      const prokers = loadLocalData<Proker[]>("kkn_prokers_store", DEFAULT_PROKERS);
      const timelineEvents = loadLocalData<TimelineEvent[]>("kkn_timeline_store", DEFAULT_TIMELINES);
      const logbooks = loadLocalData<LogbookEntry[]>("kkn_logbooks_store", DEFAULT_LOGBOOKS);
      const documents = loadLocalData<DocumentItem[]>("kkn_documents_store", DEFAULT_DOCUMENTS);
      const notulen = loadLocalData<NotulenItem[]>("kkn_notulen_store", DEFAULT_NOTULEN);

      const resolvedProkers = prokers.length > 0 ? prokers : DEFAULT_PROKERS;
      const resolvedTimelines = timelineEvents.length > 0 ? timelineEvents : DEFAULT_TIMELINES;
      const resolvedLogbooks = logbooks.length > 0 ? logbooks : DEFAULT_LOGBOOKS;
      const resolvedDocs = documents.length > 0 ? documents : DEFAULT_DOCUMENTS;
      const resolvedNotulen = notulen.length > 0 ? notulen : DEFAULT_NOTULEN;

      const allLogbookPhotos = resolvedLogbooks.reduce((sum, l) => sum + (l.photos?.length || 0), 0);

      const registeredUsers = loadLocalData<string[]>("kkn_users_registered", []);
      const uniqueLogbookUsers = new Set(resolvedLogbooks.map(l => l.user_id));
      const calculatedMembers = new Set([...registeredUsers, ...Array.from(uniqueLogbookUsers)]).size;

      set({
        prokers: resolvedProkers,
        timelineEvents: resolvedTimelines,
        logbooks: resolvedLogbooks,
        documents: resolvedDocs,
        notulen: resolvedNotulen,
        totalMembers: calculatedMembers > 0 ? calculatedMembers : 15,
        totalLogbooks: resolvedLogbooks.length,
        totalDocs: allLogbookPhotos + resolvedDocs.length,
      });
      return;
    }
    try {
      // 1. Fetch users for dynamic full name mappings
      const userMap = new Map<string, string>();
      try {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, full_name");
        usersData?.forEach((u) => {
          userMap.set(u.id, u.full_name);
        });
      } catch (e) {
        console.warn("Could not fetch users profile map:", e);
      }

      // 2. Fetch programs
      let finalProkers = DEFAULT_PROKERS;
      try {
        const { data: programsData, error: progError } = await supabase
          .from("programs")
          .select("*");
        if (!progError && programsData && programsData.length > 0) {
          finalProkers = programsData.map((p) => {
            const picName = userMap.get(p.pic_user_id || "") || p.pic_user_id || "Belum Ditentukan";
            const frontendStatus = p.status === "Berjalan" ? "Sedang Berjalan" : (p.status === "Belum Dimulai" ? "Belum Mulai" : "Selesai");
            const descDec = decodeProkerDescription(p.description);
            return {
              id: p.id,
              name: p.title,
              pic: picName,
              deadline: p.deadline,
              status: frontendStatus as any,
              progress: p.progress || 0,
              location: p.location || "",
              description: descDec.description,
              members: descDec.members
            };
          });
        }
      } catch (e) {
        console.warn("Programs fetch failed, using default prokers:", e);
      }

      // 3. Fetch timelines
      let finalTimelines = DEFAULT_TIMELINES;
      try {
        const { data: timelinesData, error: timeError } = await supabase
          .from("timelines")
          .select("*");
        if (!timeError && timelinesData && timelinesData.length > 0) {
          finalTimelines = timelinesData.map((t) => {
            const dec = decodeDescription(t.description);
            const picName = userMap.get(t.created_by || "") || "";
            const timeStr = `${t.start_time.slice(0, 5)} - ${t.end_time.slice(0, 5)}`;
            return {
              id: t.id,
              title: t.title,
              date: t.date,
              time: timeStr,
              description: dec.description,
              category: dec.category,
              location: t.location || "",
              pic: picName,
              program_id: t.program_id || undefined
            };
          });
        }
      } catch (e) {
        console.warn("Timelines fetch failed, using default timelines:", e);
      }

      // 4. Fetch logbooks with nested photos
      let finalLogbooks = DEFAULT_LOGBOOKS;
      try {
        const { data: logbooksData, error: logError } = await supabase
          .from("logbooks")
          .select("*, photos(image_url)");
        if (!logError && logbooksData && logbooksData.length > 0) {
          finalLogbooks = logbooksData.map((l) => {
            const timelineItem = finalTimelines.find((t) => t.id === l.timeline_id);
            const timelineTitle = timelineItem ? timelineItem.title : "Kegiatan Mandiri";
            const uploaderName = userMap.get(l.user_id) || "Anggota KKN";
            const photoUrls = (l.photos || []).map((p: any) => p.image_url);

            return {
              id: l.id,
              user_id: l.user_id,
              user_name: uploaderName,
              timeline_id: l.timeline_id || "",
              timeline_title: timelineTitle,
              date: l.date,
              start_time: l.start_time.slice(0, 5),
              end_time: l.end_time.slice(0, 5),
              description: l.description || "",
              location: l.location || "",
              status: l.status as any,
              photos: photoUrls,
              created_at: l.created_at
            };
          });
        }
      } catch (e) {
        console.warn("Logbooks fetch failed, using default logbooks:", e);
      }

      // 5. Fetch documents
      let finalDocs = DEFAULT_DOCUMENTS;
      try {
        const { data: documentsData, error: docError } = await supabase
          .from("documents")
          .select("*");
        if (!docError && documentsData && documentsData.length > 0) {
          finalDocs = documentsData.map((d) => {
            const uploaderName = userMap.get(d.uploaded_by || "") || "Sekretaris";
            const catParts = d.category ? d.category.split("||") : ["Umum", "1.5 MB"];
            const category = catParts[0];
            const size = catParts[1] || "1.5 MB";
            
            return {
              id: d.id,
              name: d.title,
              category: category,
              size: size,
              uploadDate: d.created_at.split("T")[0],
              fileUrl: d.file_url,
              uploadedBy: uploaderName
            };
          });
        }
      } catch (e) {
        console.warn("Documents fetch failed, using default documents:", e);
      }

      // 6. Fetch meeting notes
      let finalNotulen = DEFAULT_NOTULEN;
      try {
        const { data: meetingNotesData, error: noteError } = await supabase
          .from("meeting_notes")
          .select("*");
        if (!noteError && meetingNotesData && meetingNotesData.length > 0) {
          finalNotulen = meetingNotesData.map((m) => {
            const locParts = m.location ? m.location.split("|||") : ["Posko KKN", "13:30 - 15:00"];
            const location = locParts[0];
            const time = locParts[1] || "13:30 - 15:00";
            
            const discParts = m.discussion ? m.discussion.split("|||") : ["", ""];
            const agenda = discParts[0];
            const results = discParts[1] || "";
            const attendeesStr = m.participants ? m.participants.join(", ") : "";

            return {
              id: m.id,
              title: m.title,
              date: m.meeting_date,
              time: time,
              location: location,
              attendees: attendeesStr,
              agenda: agenda,
              results: results,
              decisions: m.decision || "",
              actions: m.follow_up || ""
            };
          });
        }
      } catch (e) {
        console.warn("Meeting notes fetch failed, using default notulen:", e);
      }

      // 7. Total members count
      let memberCount = 15;
      try {
        const { count, error } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });
        if (!error && count && count > 0) {
          memberCount = count;
        }
      } catch (e) {
        console.warn("User count failed:", e);
      }

      const totalPhotos = finalLogbooks.reduce((s, l) => s + (l.photos?.length || 0), 0);

      set({
        prokers: finalProkers,
        timelineEvents: finalTimelines,
        logbooks: finalLogbooks,
        documents: finalDocs,
        notulen: finalNotulen,
        totalMembers: memberCount,
        totalLogbooks: finalLogbooks.length,
        totalDocs: totalPhotos + finalDocs.length
      });

      // Ensure auto group linkage so all members can view group prokers and timelines
      try {
        const groupId = await getOrCreateGroupId();
        await linkAllUsersToGroup(groupId);
      } catch (e) {
        console.warn("Auto group link skipped:", e);
      }

    } catch (e) {
      console.error("Gagal sinkronisasi data dari database:", e);
    }
  },

  addTimelineEvent: async (event) => {
    if (isSandboxMode) {
      const newEvent = { ...event, id: `event-${Date.now()}` };
      set((state) => {
        const next = [...state.timelineEvents, newEvent];
        saveLocalData("kkn_timeline_store", next);
        return { timelineEvents: next };
      });
      return;
    }
    try {
      let progId: string | null = event.program_id || null;
      if (!progId && event.category === "Program Kerja") {
        const prog = get().prokers.find(p => p.name === event.title || event.title.includes(p.name));
        if (prog) progId = prog.id;
      }
      if (!progId) {
        progId = await getOrCreateDefaultProgramId();
      }

      const { data: userSession } = await supabase.auth.getSession();
      const userId = userSession?.session?.user?.id || null;

      const timeParts = event.time.split("-");
      const startTime = formatTimeForDb(timeParts[0] || "08:00");
      const endTime = formatTimeForDb(timeParts[1] || "10:00");
      const dbDesc = encodeDescription(event.category, event.description);

      const { data, error } = await supabase
        .from("timelines")
        .insert({
          program_id: progId,
          title: event.title,
          date: event.date,
          start_time: startTime,
          end_time: endTime,
          location: event.location || "Desa Sukaluyu",
          description: dbDesc,
          created_by: userId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newEvent = {
        ...event,
        id: data.id,
        pic: event.pic || get().prokers.find(p => p.id === progId)?.pic || "",
        program_id: progId || undefined
      };
      set((state) => ({ timelineEvents: [...state.timelineEvents, newEvent] }));
      toast.success("Agenda baru berhasil ditambahkan!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan agenda baru ke database.");
    }
  },

  updateTimelineEvent: async (id, updates) => {
    if (isSandboxMode) {
      set((state) => {
        const next = state.timelineEvents.map((evt) =>
          evt.id === id ? { ...evt, ...updates } : evt
        );
        saveLocalData("kkn_timeline_store", next);
        return { timelineEvents: next };
      });
      return;
    }
    try {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.date) dbUpdates.date = updates.date;
      if (updates.location) dbUpdates.location = updates.location;
      if (updates.program_id) dbUpdates.program_id = updates.program_id;
      if (updates.time) {
        const timeParts = updates.time.split("-");
        dbUpdates.start_time = formatTimeForDb(timeParts[0] || "08:00");
        dbUpdates.end_time = formatTimeForDb(timeParts[1] || "10:00");
      }
      if (updates.description || updates.category) {
        const current = get().timelineEvents.find(t => t.id === id);
        const cat = updates.category || current?.category || "Umum";
        const desc = updates.description || current?.description || "";
        dbUpdates.description = encodeDescription(cat, desc);
      }

      const { error } = await supabase
        .from("timelines")
        .update(dbUpdates)
        .eq("id", id);
      if (error) throw error;

      set((state) => ({
        timelineEvents: state.timelineEvents.map((evt) =>
          evt.id === id ? { ...evt, ...updates } : evt
        ),
      }));
      toast.success("Agenda berhasil diperbarui!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui agenda di database.");
    }
  },

  deleteTimelineEvent: async (id) => {
    if (isSandboxMode) {
      set((state) => {
        const next = state.timelineEvents.filter((evt) => evt.id !== id);
        saveLocalData("kkn_timeline_store", next);
        return { timelineEvents: next };
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("timelines")
        .delete()
        .eq("id", id);
      if (error) throw error;
      set((state) => ({
        timelineEvents: state.timelineEvents.filter((evt) => evt.id !== id),
      }));
      toast.success("Agenda berhasil dihapus!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus agenda dari database.");
    }
  },

  updateProker: async (id, progress, status, name, pic, deadline, location, description, members) => {
    if (isSandboxMode) {
      set((state) => {
        const next = state.prokers.map((p) =>
          p.id === id
            ? {
                ...p,
                progress,
                status,
                name: name !== undefined ? name : p.name,
                pic: pic !== undefined ? pic : p.pic,
                deadline: deadline !== undefined ? deadline : p.deadline,
                location: location !== undefined ? location : p.location,
                description: description !== undefined ? description : p.description,
                members: members !== undefined ? members : p.members,
              }
            : p
        );
        saveLocalData("kkn_prokers_store", next);
        return { prokers: next };
      });
      return;
    }
    try {
      const dbStatus = status === "Sedang Berjalan" ? "Berjalan" : (status === "Belum Mulai" ? "Belum Dimulai" : "Selesai");
      
      const updatePayload: any = { progress, status: dbStatus };
      if (name !== undefined) updatePayload.title = name;
      if (deadline !== undefined) updatePayload.deadline = deadline;
      if (location !== undefined) updatePayload.location = location;
      
      let picUserId = null;
      if (pic !== undefined) {
        const { data: users } = await supabase.from("users").select("id, full_name");
        const matchedUser = users?.find(u => u.full_name.toLowerCase().includes(pic.toLowerCase()));
        picUserId = matchedUser ? matchedUser.id : null;
        updatePayload.pic_user_id = picUserId;
      }

      if (description !== undefined || members !== undefined) {
        const current = get().prokers.find(p => p.id === id);
        const desc = description !== undefined ? description : (current?.description || "");
        const mems = members !== undefined ? members : (current?.members || "");
        updatePayload.description = encodeProkerDescription(desc, mems);
      }

      const { error } = await supabase
        .from("programs")
        .update(updatePayload)
        .eq("id", id);
      if (error) throw error;

      // Also update any default timelines linked to this program
      const { data: relatedTimelines } = await supabase
        .from("timelines")
        .select("id, description")
        .eq("program_id", id);
      
      if (relatedTimelines) {
        for (const t of relatedTimelines) {
          const dec = decodeDescription(t.description);
          if (dec.category === "Program Kerja") {
            const dbTimelineUpdates: any = {};
            if (name !== undefined) {
              dbTimelineUpdates.title = name;
              dbTimelineUpdates.description = `[Category: Program Kerja] Kegiatan Utama: ${name}`;
            }
            if (deadline !== undefined) dbTimelineUpdates.date = deadline;
            if (location !== undefined) dbTimelineUpdates.location = location;
            if (picUserId !== null) dbTimelineUpdates.created_by = picUserId;
            
            await supabase
              .from("timelines")
              .update(dbTimelineUpdates)
              .eq("id", t.id);
          }
        }
      }

      set((state) => ({
        prokers: state.prokers.map((p) =>
          p.id === id
            ? {
                ...p,
                progress,
                status,
                name: name !== undefined ? name : p.name,
                pic: pic !== undefined ? pic : p.pic,
                deadline: deadline !== undefined ? deadline : p.deadline,
                location: location !== undefined ? location : p.location,
                description: description !== undefined ? description : p.description,
                members: members !== undefined ? members : p.members,
              }
            : p
        ),
        timelineEvents: state.timelineEvents.map((t) => {
          if (t.program_id === id && t.category === "Program Kerja") {
            return {
              ...t,
              title: name !== undefined ? name : t.title,
              date: deadline !== undefined ? deadline : t.date,
              location: location !== undefined ? location : t.location,
              description: name !== undefined ? `Kegiatan Utama: ${name}` : t.description,
              pic: pic !== undefined ? pic : t.pic
            };
          }
          return t;
        })
      }));
      toast.success("Program Kerja berhasil diperbarui!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui program kerja di database.");
    }
  },

  addProker: async (proker) => {
    if (isSandboxMode) {
      const newProker = { ...proker, id: `proker-${Date.now()}` };
      set((state) => {
        const nextProkers = [...state.prokers, newProker];
        saveLocalData("kkn_prokers_store", nextProkers);
        return { prokers: nextProkers };
      });
      return;
    }
    try {
      const groupId = await getOrCreateGroupId();
      
      const { data: users } = await supabase.from("users").select("id, full_name");
      const matchedUser = users?.find(u => u.full_name.toLowerCase().includes(proker.pic.toLowerCase()));
      const picUserId = matchedUser ? matchedUser.id : null;

      const dbStatus = proker.status === "Sedang Berjalan" ? "Berjalan" : (proker.status === "Belum Mulai" ? "Belum Dimulai" : "Selesai");
      const dbDesc = encodeProkerDescription(proker.description || "", proker.members || "");

      const { data, error } = await supabase
        .from("programs")
        .insert({
          group_id: groupId,
          title: proker.name,
          pic_user_id: picUserId,
          deadline: proker.deadline,
          status: dbStatus,
          progress: proker.progress,
          location: proker.location || "",
          description: dbDesc
        })
        .select()
        .single();
      if (error) throw error;

      await linkAllUsersToGroup(groupId);

      const newProker = {
        ...proker,
        id: data.id,
        location: proker.location || "",
        description: proker.description || "",
        members: proker.members || ""
      };

      // Also create a default timeline event for this proker to ensure dropdown is populated
      const dbTimelineDesc = `[Category: Program Kerja] Kegiatan Utama: ${proker.name}`;
      const { data: timelineData, error: timelineError } = await supabase
        .from("timelines")
        .insert({
          program_id: data.id,
          title: proker.name,
          date: proker.deadline,
          start_time: '08:00:00',
          end_time: '17:00:00',
          location: proker.location || "Desa Sukaluyu",
          description: dbTimelineDesc,
          created_by: picUserId
        })
        .select()
        .single();

      let newTimelineList = get().timelineEvents;
      if (!timelineError && timelineData) {
        const timeStr = "08:00 - 17:00";
        const newTimelineEvt: TimelineEvent = {
          id: timelineData.id,
          title: proker.name,
          date: proker.deadline,
          time: timeStr,
          description: `Kegiatan Utama: ${proker.name}`,
          category: "Program Kerja" as const,
          location: proker.location || "Desa Sukaluyu",
          pic: proker.pic,
          program_id: data.id
        };
        newTimelineList = [...newTimelineList, newTimelineEvt];
      }

      set((state) => ({ 
        prokers: [...state.prokers, newProker],
        timelineEvents: newTimelineList
      }));
      toast.success("Program Kerja baru berhasil ditambahkan!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan program kerja baru ke database.");
    }
  },

  deleteProker: async (id) => {
    if (isSandboxMode) {
      set((state) => {
        const nextProkers = state.prokers.filter((p) => p.id !== id);
        saveLocalData("kkn_prokers_store", nextProkers);
        return { prokers: nextProkers };
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", id);
      if (error) throw error;
      set((state) => ({
        prokers: state.prokers.filter((p) => p.id !== id)
      }));
      toast.success("Program Kerja berhasil dihapus.");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus program kerja dari database.");
    }
  },

  addLogbook: async (entry) => {
    if (isSandboxMode) {
      const newLog = { ...entry, id: `log-${Date.now()}`, created_at: new Date().toISOString() };
      set((state) => {
        const nextLogbooks = [...state.logbooks, newLog];
        saveLocalData("kkn_logbooks_store", nextLogbooks);
        const allPhotos = nextLogbooks.reduce((sum, l) => sum + (l.photos?.length || 0), 0);
        return {
          logbooks: nextLogbooks,
          totalLogbooks: nextLogbooks.length,
          totalDocs: allPhotos + state.documents.length,
        };
      });
      return;
    }
    try {
      const { data: userSession } = await supabase.auth.getSession();
      const userId = userSession?.session?.user?.id || entry.user_id;

      const startTime = formatTimeForDb(entry.start_time);
      const endTime = formatTimeForDb(entry.end_time);
      const timelineId = entry.timeline_id || null;

      const { data, error } = await supabase
        .from("logbooks")
        .insert({
          user_id: userId,
          timeline_id: timelineId,
          date: entry.date,
          start_time: startTime,
          end_time: endTime,
          description: entry.description,
          location: entry.location,
          status: entry.status
        })
        .select()
        .single();
      if (error) throw error;

      if (entry.photos && entry.photos.length > 0) {
        const photoInserts = entry.photos.map(url => ({
          logbook_id: data.id,
          image_url: url
        }));
        await supabase.from("photos").insert(photoInserts);
      }

      const { data: uInfo } = await supabase.from("users").select("full_name").eq("id", userId).single();
      const { data: tInfo } = timelineId ? await supabase.from("timelines").select("title").eq("id", timelineId).single() : { data: null };

      const newLog = {
        ...entry,
        id: data.id,
        user_id: userId,
        user_name: uInfo?.full_name || "Anggota KKN",
        timeline_title: tInfo?.title || "Kegiatan Mandiri",
        created_at: data.created_at
      };

      set((state) => {
        const nextLogs = [...state.logbooks, newLog];
        const allPhotos = nextLogs.reduce((sum, l) => sum + (l.photos?.length || 0), 0);
        return {
          logbooks: nextLogs,
          totalLogbooks: nextLogs.length,
          totalDocs: allPhotos + state.documents.length,
        };
      });
      toast.success("Logbook harian berhasil ditambahkan!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan logbook ke database.");
    }
  },

  updateLogbook: async (id, updates) => {
    if (isSandboxMode) {
      set((state) => {
        const nextLogbooks = state.logbooks.map((l) => (l.id === id ? { ...l, ...updates } : l));
        saveLocalData("kkn_logbooks_store", nextLogbooks);
        const allPhotos = nextLogbooks.reduce((sum, l) => sum + (l.photos?.length || 0), 0);
        return {
          logbooks: nextLogbooks,
          totalDocs: allPhotos + state.documents.length,
        };
      });
      return;
    }
    try {
      const dbUpdates: any = {};
      if (updates.date) dbUpdates.date = updates.date;
      if (updates.start_time) dbUpdates.start_time = formatTimeForDb(updates.start_time);
      if (updates.end_time) dbUpdates.end_time = formatTimeForDb(updates.end_time);
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.location) dbUpdates.location = updates.location;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.timeline_id) dbUpdates.timeline_id = updates.timeline_id;

      const { error } = await supabase
        .from("logbooks")
        .update(dbUpdates)
        .eq("id", id);
      if (error) throw error;

      if (updates.photos) {
        await supabase.from("photos").delete().eq("logbook_id", id);
        if (updates.photos.length > 0) {
          const photoInserts = updates.photos.map(url => ({
            logbook_id: id,
            image_url: url
          }));
          await supabase.from("photos").insert(photoInserts);
        }
      }

      set((state) => {
        const nextLogs = state.logbooks.map((l) => (l.id === id ? { ...l, ...updates } : l));
        const allPhotos = nextLogs.reduce((sum, l) => sum + (l.photos?.length || 0), 0);
        return {
          logbooks: nextLogs,
          totalDocs: allPhotos + state.documents.length,
        };
      });
      toast.success("Logbook berhasil diperbarui!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui logbook di database.");
    }
  },

  deleteLogbook: async (id) => {
    if (isSandboxMode) {
      set((state) => {
        const nextLogbooks = state.logbooks.filter((l) => l.id !== id);
        saveLocalData("kkn_logbooks_store", nextLogbooks);
        const allPhotos = nextLogbooks.reduce((sum, l) => sum + (l.photos?.length || 0), 0);
        return {
          logbooks: nextLogbooks,
          totalLogbooks: nextLogbooks.length,
          totalDocs: allPhotos + state.documents.length,
        };
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("logbooks")
        .delete()
        .eq("id", id);
      if (error) throw error;

      set((state) => {
        const nextLogs = state.logbooks.filter((l) => l.id !== id);
        const allPhotos = nextLogs.reduce((sum, l) => sum + (l.photos?.length || 0), 0);
        return {
          logbooks: nextLogs,
          totalLogbooks: nextLogs.length,
          totalDocs: allPhotos + state.documents.length,
        };
      });
      toast.success("Logbook berhasil dihapus!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus logbook dari database.");
    }
  },

  addDocument: async (doc) => {
    if (isSandboxMode) {
      const newDoc = {
        ...doc,
        id: `doc-${Date.now()}`,
        uploadDate: new Date().toISOString().split("T")[0]
      };
      set((state) => {
        const nextDocs = [...state.documents, newDoc];
        saveLocalData("kkn_documents_store", nextDocs);
        const finishedPhotos = state.logbooks
          .filter((l) => l.status === "Selesai")
          .reduce((sum, l) => sum + (l.photos?.length || 0), 0);
        return { documents: nextDocs, totalDocs: finishedPhotos + nextDocs.length };
      });
      return;
    }
    try {
      const { data: userSession } = await supabase.auth.getSession();
      const userId = userSession?.session?.user?.id || null;
      const dbCategory = `${doc.category}||${doc.size}`;

      const { data, error } = await supabase
        .from("documents")
        .insert({
          title: doc.name,
          category: dbCategory,
          file_url: doc.fileUrl,
          uploaded_by: userId
        })
        .select()
        .single();
      if (error) throw error;

      const newDoc = {
        ...doc,
        id: data.id,
        uploadDate: data.created_at.split("T")[0]
      };
      set((state) => ({ documents: [...state.documents, newDoc] }));
      toast.success("Dokumen berhasil ditambahkan!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengunggah dokumen ke database.");
    }
  },

  deleteDocument: async (id) => {
    if (isSandboxMode) {
      set((state) => {
        const nextDocs = state.documents.filter((d) => d.id !== id);
        saveLocalData("kkn_documents_store", nextDocs);
        const finishedPhotos = state.logbooks
          .filter((l) => l.status === "Selesai")
          .reduce((sum, l) => sum + (l.photos?.length || 0), 0);
        return { documents: nextDocs, totalDocs: finishedPhotos + nextDocs.length };
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);
      if (error) throw error;

      set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
      toast.success("Dokumen berhasil dihapus!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus dokumen dari database.");
    }
  },

  renameDocument: async (id, newName) => {
    if (isSandboxMode) {
      set((state) => {
        const nextDocs = state.documents.map((d) => (d.id === id ? { ...d, name: newName } : d));
        saveLocalData("kkn_documents_store", nextDocs);
        return { documents: nextDocs };
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("documents")
        .update({ title: newName })
        .eq("id", id);
      if (error) throw error;

      set((state) => ({
        documents: state.documents.map((d) => (d.id === id ? { ...d, name: newName } : d))
      }));
      toast.success("Nama dokumen berhasil diubah!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengubah nama dokumen di database.");
    }
  },

  addNotulen: async (note) => {
    if (isSandboxMode) {
      const newNote = { ...note, id: `note-${Date.now()}` };
      set((state) => {
        const nextNotes = [...state.notulen, newNote];
        saveLocalData("kkn_notulen_store", nextNotes);
        return { notulen: nextNotes };
      });
      return;
    }
    try {
      const { data: userSession } = await supabase.auth.getSession();
      const userId = userSession?.session?.user?.id || null;

      const dbLocation = `${note.location}|||${note.time}`;
      const dbDiscussion = `${note.agenda}|||${note.results}`;
      const dbParticipants = note.attendees.split(",").map(s => s.trim()).filter(Boolean);

      const { data, error } = await supabase
        .from("meeting_notes")
        .insert({
          title: note.title,
          meeting_date: note.date,
          location: dbLocation,
          participants: dbParticipants,
          discussion: dbDiscussion,
          decision: note.decisions,
          follow_up: note.actions,
          created_by: userId
        })
        .select()
        .single();
      if (error) throw error;

      const newNote = {
        ...note,
        id: data.id
      };
      set((state) => ({ notulen: [...state.notulen, newNote] }));
      toast.success("Notulen rapat baru berhasil disimpan!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan notulen rapat ke database.");
    }
  },

  updateNotulen: async (id, updates) => {
    if (isSandboxMode) {
      set((state) => {
        const nextNotes = state.notulen.map((n) => (n.id === id ? { ...n, ...updates } : n));
        saveLocalData("kkn_notulen_store", nextNotes);
        return { notulen: nextNotes };
      });
      return;
    }
    try {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.date) dbUpdates.meeting_date = updates.date;
      if (updates.decisions) dbUpdates.decision = updates.decisions;
      if (updates.actions) dbUpdates.follow_up = updates.actions;
      
      if (updates.location || updates.time) {
        const current = get().notulen.find(n => n.id === id);
        const loc = updates.location || current?.location || "";
        const time = updates.time || current?.time || "";
        dbUpdates.location = `${loc}|||${time}`;
      }

      if (updates.agenda || updates.results) {
        const current = get().notulen.find(n => n.id === id);
        const agenda = updates.agenda || current?.agenda || "";
        const results = updates.results || current?.results || "";
        dbUpdates.discussion = `${agenda}|||${results}`;
      }

      if (updates.attendees) {
        dbUpdates.participants = updates.attendees.split(",").map(s => s.trim()).filter(Boolean);
      }

      const { error } = await supabase
        .from("meeting_notes")
        .update(dbUpdates)
        .eq("id", id);
      if (error) throw error;

      set((state) => ({
        notulen: state.notulen.map((n) => (n.id === id ? { ...n, ...updates } : n))
      }));
      toast.success("Notulen rapat berhasil diperbarui!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui notulen rapat di database.");
    }
  },

  deleteNotulen: async (id) => {
    if (isSandboxMode) {
      set((state) => {
        const nextNotes = state.notulen.filter((n) => n.id !== id);
        saveLocalData("kkn_notulen_store", nextNotes);
        return { notulen: nextNotes };
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("meeting_notes")
        .delete()
        .eq("id", id);
      if (error) throw error;

      set((state) => ({ notulen: state.notulen.filter((n) => n.id !== id) }));
      toast.success("Notulen rapat berhasil dihapus!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus notulen rapat dari database.");
    }
  },

  initializeStats: async () => {
    if (isSandboxMode) {
      const registeredUsers = loadLocalData<string[]>("kkn_users_registered", []);
      const uniqueLogbookUsers = new Set(get().logbooks.map(l => l.user_id));
      const totalCount = new Set([...registeredUsers, ...Array.from(uniqueLogbookUsers)]).size;
      set({ totalMembers: totalCount });
      return;
    }
    try {
      const { count, error } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });
      if (!error && count !== null) {
        set({ totalMembers: count });
      }
    } catch (e) {
      console.error("Gagal inisialisasi stats anggota:", e);
    }
  },
}));
