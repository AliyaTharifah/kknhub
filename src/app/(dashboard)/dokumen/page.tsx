"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  FolderDot,
  Search,
  Plus,
  Trash2,
  Edit,
  Download,
  Eye,
  FileText,
  Upload,
  X,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useLandingStore, DocumentItem } from "@/hooks/useLandingStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const categories = [
  "Surat Tugas",
  "Panduan KKN",
  "Proposal",
  "TOR",
  "LPJ",
  "Laporan Akhir",
  "Surat Perizinan",
  "Berita Acara",
  "Banner",
  "Poster",
  "Presentasi",
  "Dokumen Lain",
];

const documentSchema = zod.object({
  name: zod.string().min(1, "Nama dokumen wajib diisi"),
  category: zod.string().min(1, "Pilih kategori dokumen"),
});

type DocumentFormValues = zod.infer<typeof documentSchema>;

export default function DokumenPage() {
  const { user } = useAuthStore();
  const { documents, addDocument, deleteDocument, renameDocument } = useLandingStore();

  const isSecretary = user?.role === "Sekretaris";

  // List filter states
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [uploadedBase64, setUploadedBase64] = useState("");
  const [fileSizeStr, setFileSizeStr] = useState("0 KB");
  const [uploadError, setUploadError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: "",
      category: categories[0],
    },
  });

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.uploadedBy.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "All" || doc.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, search, activeCategory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Maksimal ukuran file dokumen adalah 10 MB.");
      return;
    }

    // Compute human-readable size
    const size = file.size;
    if (size >= 1024 * 1024) {
      setFileSizeStr(`${(size / (1024 * 1024)).toFixed(1)} MB`);
    } else {
      setFileSizeStr(`${(size / 1024).toFixed(0)} KB`);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenRename = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setRenameValue(doc.name);
    setIsRenameOpen(true);
  };

  const submitRename = () => {
    if (!selectedDoc || !renameValue.trim()) return;
    renameDocument(selectedDoc.id, renameValue);
    setIsRenameOpen(false);
  };

  const handleOpenPreview = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  const onUploadSubmit = (data: DocumentFormValues) => {
    setUploadError("");
    if (!uploadedBase64) {
      setUploadError("Pilih file dokumen terlebih dahulu.");
      return;
    }

    // Ensure it keeps its file extension
    let nameWithExt = data.name;
    if (!nameWithExt.toLowerCase().endsWith(".pdf") && !nameWithExt.toLowerCase().endsWith(".docx") && !nameWithExt.toLowerCase().endsWith(".xlsx")) {
      nameWithExt += ".pdf";
    }

    addDocument({
      name: nameWithExt,
      category: data.category,
      size: fileSizeStr,
      fileUrl: uploadedBase64,
      uploadedBy: user?.full_name || "Mhs KKN",
    });

    setIsUploadOpen(false);
    setUploadedBase64("");
    reset();
  };

  return (
    <div className="space-y-8">
      {/* Top Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-kkn-blue text-xs font-bold uppercase">
            <FolderDot className="h-3.5 w-3.5" />
            <span>Dokumen</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Pusat Berkas & Dokumen Posko
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {isSecretary
              ? "Unggah dan kelola proposal, TOR, surat tugas, perizinan, banner kegiatan, dan LPJ posko KKN."
              : "Cari, pratinjau, dan unduh seluruh berkas legalitas dan panduan kelompok KKN 211 Sukaluyu."
            }
          </p>
        </div>

        {isSecretary && (
          <Button
            onClick={() => {
              setUploadedBase64("");
              setFileSizeStr("0 KB");
              setUploadError("");
              setIsUploadOpen(true);
            }}
            className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white px-5 rounded-xl shadow-md transition-transform hover:scale-102 cursor-pointer flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Unggah Dokumen</span>
          </Button>
        )}
      </div>

      {/* Grid: Categories Sidebar + Files listing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Category selector */}
        <aside className="lg:col-span-3 space-y-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-4 rounded-3xl shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-2">
            Kategori Dokumen
          </h3>
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-3 py-2 rounded-xl text-xs font-bold text-left shrink-0 transition-colors ${
                activeCategory === "All"
                  ? "bg-kkn-blue/10 text-kkn-blue"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-850 dark:hover:text-white"
              }`}
            >
              Semua Berkas
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold text-left shrink-0 transition-colors ${
                  activeCategory === cat
                    ? "bg-kkn-blue/10 text-kkn-blue"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-850 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Files Container */}
        <div className="lg:col-span-9 space-y-4">
          {/* Search bar wrapper */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-3.5 rounded-2xl shadow-sm flex items-center">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Cari berkas berdasarkan nama atau pengunggah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs md:text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-kkn-blue"
            />
          </div>

          {/* Files List Card */}
          {filteredDocs.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-3xl text-slate-400">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="font-bold">Tidak ada dokumen ditemukan</p>
              <p className="text-xs mt-1">Belum ada berkas terunggah di kategori ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocs.map((doc) => (
                <Card
                  key={doc.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden"
                >
                  <CardContent className="p-5 flex gap-4 items-start">
                    <div className="h-10 w-10 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-xl shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="flex-grow space-y-1.5 min-w-0">
                      <h4 className="text-xs md:text-sm font-bold text-slate-800 dark:text-white truncate">
                        {doc.name}
                      </h4>
                      <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        <span className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-kkn-blue font-bold">
                          {doc.category}
                        </span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span className="truncate max-w-[80px]">By: {doc.uploadedBy}</span>
                      </div>

                      {/* Info & Dates */}
                      <p className="text-[10px] text-slate-400 pt-1">Unggah: {doc.uploadDate}</p>

                      {/* Document Actions Row */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-850 mt-3">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleOpenPreview(doc)}
                          className="text-[10px] py-1.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Pratinjau
                        </Button>
                        <a
                          href={doc.fileUrl}
                          download={doc.name}
                          className="inline-flex items-center text-[10px] bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-300 font-bold py-1.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer transition-colors"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Unduh
                        </a>

                        {isSecretary && (
                          <div className="flex items-center gap-1 ml-auto">
                            <button
                              onClick={() => handleOpenRename(doc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteDocument(doc.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              Unggah Dokumen KKN
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Dokumen akan dapat diakses oleh seluruh anggota kelompok KKN Desa Sukaluyu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onUploadSubmit)} className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-300">Nama Dokumen</label>
              <input
                type="text"
                placeholder="Contoh: Proposal KKN Rev3"
                {...register("name")}
                className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              />
              {errors.name && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.name.message}</span>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-300">Kategori</label>
              <select
                {...register("category")}
                className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Document File Uploader */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-300">File Berkas</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 dark:border-slate-800 hover:border-slate-350 rounded-2xl p-6 cursor-pointer bg-slate-50 dark:bg-slate-850 text-slate-400 transition-colors">
                <Upload className="h-6 w-6 text-slate-400" />
                {uploadedBase64 ? (
                  <div className="text-center mt-2">
                    <span className="text-xs text-slate-800 dark:text-white font-bold block">File Terpilih</span>
                    <span className="text-[10px] text-slate-400">{fileSizeStr}</span>
                  </div>
                ) : (
                  <div className="text-center mt-2">
                    <span className="text-xs text-slate-500 font-bold block">Pilih Berkas PDF/Dokumen</span>
                    <span className="text-[9px] text-slate-400">Maksimal ukuran file 10 MB</span>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.doc,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {uploadError && (
                <span className="text-[10px] text-red-400 font-bold block">{uploadError}</span>
              )}
            </div>

            <DialogFooter className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-xl font-bold border border-slate-250 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white rounded-xl shadow-md cursor-pointer"
              >
                Simpan Dokumen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog Modal */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 dark:text-white">
              Ubah Nama Dokumen
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full text-sm text-slate-805 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 rounded-xl py-2 px-3 outline-none"
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRenameOpen(false)}
                className="rounded-xl font-bold text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={submitRename}
                className="bg-kkn-blue hover:bg-blue-600 font-bold text-white rounded-xl text-xs"
              >
                Ubah
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF / File Preview Lightbox Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 dark:text-white truncate">
              Pratinjau: {selectedDoc?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Kategori: {selectedDoc?.category} | Ukuran: {selectedDoc?.size}
            </DialogDescription>
          </DialogHeader>

          {/* Document Content View Mock */}
          <div className="my-4 h-96 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden">
            {selectedDoc?.fileUrl && selectedDoc.fileUrl.startsWith("data:image/") ? (
              <img src={selectedDoc.fileUrl} alt="Pratinjau Gambar" className="max-h-full object-contain" />
            ) : (
              <>
                <FileText className="h-16 w-16 text-rose-500 animate-pulse" />
                <div className="space-y-1 z-10">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">KKNHub PDF Reader & Viewer</h4>
                  <p className="text-xs text-slate-450 max-w-sm">
                    Pratinjau konten berkas legalitas resmi KKN 211 Desa Sukaluyu.
                  </p>
                </div>
                <div className="w-11/12 h-44 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm p-4 text-xs font-mono text-slate-500 overflow-y-auto">
                  --- POSKO DOKUMEN PREVIEW ---
                  <br />
                  File name: {selectedDoc?.name}
                  <br />
                  Uploaded by: {selectedDoc?.uploadedBy}
                  <br />
                  Date: {selectedDoc?.uploadDate}
                  <br />
                  Size: {selectedDoc?.size}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
              className="rounded-xl font-bold cursor-pointer"
            >
              Tutup
            </Button>
            {selectedDoc && (
              <a
                href={selectedDoc.fileUrl}
                download={selectedDoc.name}
                className="inline-flex items-center text-sm bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 text-white font-bold py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-opacity"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Unduh Berkas
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
