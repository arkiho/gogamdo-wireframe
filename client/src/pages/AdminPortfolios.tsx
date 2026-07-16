import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortablePortfolioCard } from "@/components/SortablePortfolioCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Trash2, Pencil, Eye, Send, Archive, Upload,
  Loader2, Image as ImageIcon, Star, Wand2, ArrowLeft,
  MoreHorizontal, Search, Filter, X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import Logo from "@/components/Logo";
import { compressImage } from "@/lib/imageCompressor";

function formatDate(d: Date | string | null) {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

const CATEGORY_OPTIONS = [
  "오피스", "산업시설", "병원", "관급공사", "커머셜",
];

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "초안", variant: "secondary" },
  review: { label: "검토중", variant: "outline" },
  published: { label: "게시됨", variant: "default" },
  archived: { label: "보관", variant: "destructive" },
};

type FormData = {
  title: string;
  projectName: string;
  category: string;
  client: string;
  area: string;
  location: string;
  duration: string;
  description: string;
  tags: string;
};

const EMPTY_FORM: FormData = {
  title: "", projectName: "", category: "", client: "",
  area: "", location: "", duration: "", description: "", tags: "",
};

export default function AdminPortfolios() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === "admin" || user?.role === "master";

  // State
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [imageUploadDraftId, setImageUploadDraftId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const [createPreviewImages, setCreatePreviewImages] = useState<{ file: File; url: string }[]>([]);
  const [areaError, setAreaError] = useState("");

  // Queries
  const drafts = trpc.portfolio.list.useQuery(
    statusFilter === "all" ? undefined : { status: statusFilter },
    { enabled: isAdmin }
  );

  // Mutations
  const utils = trpc.useUtils();
  const createDraft = trpc.portfolio.create.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success("포트폴리오가 생성되었습니다."); },
    onError: (err) => toast.error(`생성 실패: ${err.message}`),
  });
  const updateDraft = trpc.portfolio.update.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); setEditingId(null); setForm(EMPTY_FORM); toast.success("포트폴리오가 수정되었습니다."); },
    onError: (err) => toast.error(`수정 실패: ${err.message}`),
  });
  const publishDraft = trpc.portfolio.publish.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success("포트폴리오가 게시되었습니다."); },
    onError: (err) => toast.error(`게시 실패: ${err.message}`),
  });
  const archiveDraft = trpc.portfolio.archive.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success("포트폴리오가 보관 처리되었습니다."); },
    onError: (err) => toast.error(`보관 실패: ${err.message}`),
  });
  const deleteDraft = trpc.portfolio.delete.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); setDeleteConfirmId(null); toast.success("포트폴리오가 삭제되었습니다."); },
    onError: (err) => toast.error(`삭제 실패: ${err.message}`),
  });
  const uploadImage = trpc.portfolio.uploadImage.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success("이미지가 업로드되었습니다."); },
    onError: (err) => toast.error(`업로드 실패: ${err.message}`),
  });
  const deleteImage = trpc.portfolio.deleteImage.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success("이미지가 삭제되었습니다."); },
    onError: (err) => toast.error(`이미지 삭제 실패: ${err.message}`),
  });
  const generateDesc = trpc.portfolio.generateDescription.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success("설명이 자동 생성되었습니다."); },
    onError: (err) => toast.error(`설명 생성 실패: ${err.message}`),
  });
  const reorderDrafts = trpc.portfolio.reorder.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success("순서가 변경되었습니다."); },
    onError: (err) => toast.error(`순서 변경 실패: ${err.message}`),
  });

  // DnD state
  const [orderedItems, setOrderedItems] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Handlers
  const handleCreate = () => {
    if (!form.title.trim()) return;
    createDraft.mutate({
      title: form.title,
      projectName: form.projectName || undefined,
      category: form.category || undefined,
      client: form.client || undefined,
      area: form.area || undefined,
      location: form.location || undefined,
      duration: form.duration || undefined,
      description: form.description || undefined,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    }, {
      onSuccess: (data: any) => {
        const newId = data?.id;
        // 생성 후 미리보기 이미지들을 업로드
        if (createPreviewImages.length > 0 && newId) {
          createPreviewImages.forEach((img, i) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(",")[1];
              uploadImage.mutate({
                draftId: newId,
                fileName: img.file.name,
                fileBase64: base64,
                fileType: img.file.type,
                sortOrder: i,
              });
            };
            reader.readAsDataURL(img.file);
          });
          // cleanup preview URLs
          createPreviewImages.forEach(img => URL.revokeObjectURL(img.url));
          setCreatePreviewImages([]);
        }
        // 생성 완료 후 상세 페이지로 이동
        setShowCreateDialog(false);
        setForm(EMPTY_FORM);
        if (newId) {
          navigate(`/admin/portfolio/${newId}`);
        }
      },
    });
  };

  const handleUpdate = () => {
    if (!editingId || !form.title.trim()) return;
    updateDraft.mutate({
      id: editingId,
      title: form.title,
      projectName: form.projectName || undefined,
      category: form.category || undefined,
      client: form.client || undefined,
      area: form.area || undefined,
      location: form.location || undefined,
      duration: form.duration || undefined,
      description: form.description || undefined,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    });
  };

  const startEdit = (draft: any) => {
    setEditingId(draft.id);
    setForm({
      title: draft.title || "",
      projectName: draft.projectName || "",
      category: draft.category || "",
      client: draft.client || "",
      area: draft.area || "",
      location: draft.location || "",
      duration: draft.duration || "",
      description: draft.description || "",
      tags: (draft.tags || []).join(", "),
    });
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !imageUploadDraftId) return;

    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      // 10MB 초과 시 자동 압축
      if (file.size > 10 * 1024 * 1024) {
        toast.info(`${file.name}: 파일이 10MB를 초과하여 자동 압축 중...`);
        try {
          file = await compressImage(file);
          toast.success(`${file.name}: 압축 완료`);
        } catch (err) {
          toast.error(`${file.name}: 이미지 압축에 실패했습니다.`);
          continue;
        }
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadImage.mutate({
          draftId: imageUploadDraftId,
          fileName: file.name,
          fileBase64: base64,
          fileType: file.type,
          sortOrder: i,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }, [imageUploadDraftId, uploadImage]);

  const handleCreatePreviewUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPreviews: { file: File; url: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      // 10MB 초과 시 자동 압축
      if (file.size > 10 * 1024 * 1024) {
        toast.info(`${file.name}: 파일이 10MB를 초과하여 자동 압축 중...`);
        try {
          file = await compressImage(file);
          toast.success(`${file.name}: 압축 완료`);
        } catch (err) {
          toast.error(`${file.name}: 이미지 압축에 실패했습니다.`);
          continue;
        }
      }
      newPreviews.push({ file, url: URL.createObjectURL(file) });
    }
    setCreatePreviewImages(prev => [...prev, ...newPreviews]);
    e.target.value = "";
  }, []);

  const removeCreatePreview = useCallback((index: number) => {
    setCreatePreviewImages(prev => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Filter
  const filteredDrafts = useMemo(() => (drafts.data || []).filter(d => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        (d.client || "").toLowerCase().includes(q) ||
        (d.category || "").toLowerCase().includes(q) ||
        (d.location || "").toLowerCase().includes(q)
      );
    }
    return true;
  }), [drafts.data, searchQuery]);

  // Sync orderedItems with filteredDrafts
  useEffect(() => {
    setOrderedItems(filteredDrafts);
  }, [filteredDrafts]);

  const sortableIds = useMemo(() => orderedItems.map(d => d.id), [orderedItems]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedItems.findIndex(d => d.id === active.id);
    const newIndex = orderedItems.findIndex(d => d.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(newOrder);

    // Save new order to backend
    const items = newOrder.map((d, i) => ({ id: d.id, sortOrder: i }));
    reorderDrafts.mutate({ items });
  }, [orderedItems, reorderDrafts]);

  // Auth guard
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }
  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">관리자 권한이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                  관리자
                </span>
              </Link>
              <div className="h-4 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold text-foreground">포트폴리오 관리</h1>
                <p className="text-sm text-muted-foreground">프로젝트 포트폴리오 추가, 수정, 삭제</p>
              </div>
            </div>
            <Button onClick={() => { setForm(EMPTY_FORM); setShowCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              새 포트폴리오
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="프로젝트명, 고객사, 카테고리 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="draft">초안</SelectItem>
              <SelectItem value="review">검토중</SelectItem>
              <SelectItem value="published">게시됨</SelectItem>
              <SelectItem value="archived">보관</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Portfolio List */}
      <div className="container pb-12">
        {drafts.isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : orderedItems.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">포트폴리오가 없습니다.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setForm(EMPTY_FORM); setShowCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              첫 포트폴리오 만들기
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className="grid gap-4">
                {reorderDrafts.isPending && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    순서 저장 중...
                  </div>
                )}
                {orderedItems.map((draft) => {
                  const status = STATUS_MAP[draft.status] || STATUS_MAP.draft;
                  const isEditing = editingId === draft.id;

                  return (
                    <SortablePortfolioCard key={draft.id} id={draft.id} isEditing={isEditing}>
                      <CardContent className="p-5">
                        {isEditing ? (
                          /* ===== Edit Mode ===== */
                          <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">포트폴리오 수정</h3>
                          <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>프로젝트 제목 *</Label>
                            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="프로젝트 제목" />
                          </div>
                          <div className="space-y-2">
                            <Label>프로젝트명</Label>
                            <Input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} placeholder="프로젝트명" />
                          </div>
                          <div className="space-y-2">
                            <Label>카테고리</Label>
                            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                              <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                              <SelectContent>
                                {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>고객사</Label>
                            <Input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="고객사명" />
                          </div>
                          <div className="space-y-2">
                            <Label>면적 (평 입력)</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={form.area ? (form.area.match(/(\d+)평/) ? form.area.match(/(\d+)평/)![1] : form.area.replace(/[^0-9.]/g, '')) : ''}
                                onChange={e => {
                                  const raw = e.target.value;
                                  if (raw === '') {
                                    setForm(f => ({ ...f, area: '' }));
                                    setAreaError('');
                                    return;
                                  }
                                  if (/[^0-9.]/.test(raw)) {
                                    setAreaError('숫자만 입력 가능합니다');
                                    return;
                                  }
                                  setAreaError('');
                                  const pyeong = raw;
                                  if (pyeong === '0') {
                                    setForm(f => ({ ...f, area: '' }));
                                  } else {
                                    const py = parseFloat(pyeong);
                                    const sqm = Math.round(py * 3.3058);
                                    setForm(f => ({ ...f, area: `${sqm}m² (${Math.round(py)}평)` }));
                                  }
                                }}
                                placeholder="평수 입력"
                                className={`w-24 ${areaError ? 'border-red-500' : ''}`}
                              />
                              <span className="text-sm text-muted-foreground">평</span>
                              {form.area && !areaError && <span className="text-sm text-ink font-medium">→ {form.area}</span>}
                            </div>
                            {areaError && <p className="text-xs text-red-500 mt-1">{areaError}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label>위치</Label>
                            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="예: 서울 강남구" />
                          </div>
                          <div className="space-y-2">
                            <Label>공사 기간</Label>
                            <Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="예: 8주" />
                          </div>
                          <div className="space-y-2">
                            <Label>태그 (쉼표 구분)</Label>
                            <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="모던, 미니멀, 오픈플랜" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>설명</Label>
                          <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="프로젝트 설명" />
                        </div>
                        {/* 이미지 갤러리 */}
                        <div className="space-y-2">
                          <Label>이미지 ({draft.images?.length || 0}장)</Label>
                          <div className="flex flex-wrap gap-3">
                            {(draft.images || []).map((img: any) => (
                              <div key={img.id} className="relative w-24 h-24 rounded-md overflow-hidden border border-border group">
                                <img
                                  src={img.processedUrl || img.originalUrl}
                                  alt={img.caption || '포트폴리오 이미지'}
                                  className="w-full h-full object-cover"
                                />
                                {img.isCover === 'yes' && (
                                  <div className="absolute top-1 left-1 bg-gold text-ink text-[10px] px-1 rounded">
                                    <Star className="w-3 h-3 inline" />
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => { if (confirm("이 이미지를 삭제하시겠습니까?")) deleteImage.mutate({ id: img.id }); }}
                                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => { setImageUploadDraftId(draft.id); fileInputRef.current?.click(); }}
                              className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-gold hover:text-gold transition-colors"
                            >
                              <Upload className="w-5 h-5 mb-1" />
                              <span className="text-xs">사진 추가</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>취소</Button>
                          <Button onClick={handleUpdate} disabled={updateDraft.isPending || !form.title.trim()}>
                            {updateDraft.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            저장
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* ===== View Mode ===== */
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Thumbnail */}
                        <div className="w-full lg:w-48 h-32 bg-muted rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {draft.coverImageUrl ? (
                            <img src={draft.coverImageUrl} alt={draft.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground truncate">{draft.title}</h3>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {draft.category && <span>{draft.category}</span>}
                                {draft.client && <span>{draft.client}</span>}
                                {draft.area && <span>{draft.area}</span>}
                                {draft.location && <span>{draft.location}</span>}
                              </div>
                              {draft.description && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{draft.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground/60 mt-2">
                                생성: {formatDate(draft.createdAt)} · 수정: {formatDate(draft.updatedAt)}
                                {draft.publishedAt && ` · 게시: ${formatDate(draft.publishedAt)}`}
                              </p>
                            </div>
                          </div>

                          {/* Tags */}
                          {draft.tags && (draft.tags as string[]).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(draft.tags as string[]).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button variant="outline" size="sm" onClick={() => startEdit(draft)}>
                              <Pencil className="w-3.5 h-3.5 mr-1.5" />
                              수정
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setImageUploadDraftId(draft.id); fileInputRef.current?.click(); }}>
                              <Upload className="w-3.5 h-3.5 mr-1.5" />
                              이미지
                              {uploadImage.isPending && imageUploadDraftId === draft.id && (
                                <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                              )}
                            </Button>
                            <Link href={`/admin/portfolio/${draft.id}`}>
                              <Button variant="outline" size="sm" asChild>
                                <span>
                                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                                  상세
                                </span>
                              </Button>
                            </Link>
                            <Button
                              variant="outline" size="sm"
                              onClick={() => generateDesc.mutate({
                                id: draft.id,
                                title: draft.title,
                                category: draft.category || undefined,
                                client: draft.client || undefined,
                                area: draft.area || undefined,
                                location: draft.location || undefined,
                              })}
                              disabled={generateDesc.isPending}
                            >
                              <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                              AI 설명
                              {generateDesc.isPending && <Loader2 className="w-3 h-3 ml-1 animate-spin" />}
                            </Button>
                            {draft.status === "draft" && (
                              <Button variant="outline" size="sm" onClick={() => publishDraft.mutate({ id: draft.id })}>
                                <Send className="w-3.5 h-3.5 mr-1.5" />
                                게시
                              </Button>
                            )}
                            {draft.status === "published" && (
                              <Button variant="outline" size="sm" onClick={() => archiveDraft.mutate({ id: draft.id })}>
                                <Archive className="w-3.5 h-3.5 mr-1.5" />
                                보관
                              </Button>
                            )}
                            <Button
                              variant="ghost" size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirmId(draft.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                        )}
                      </CardContent>
                    </SortablePortfolioCard>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>새 포트폴리오 생성</DialogTitle>
            <DialogDescription>프로젝트 정보를 입력하세요. 이미지는 생성 후 추가할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>프로젝트 제목 *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="프로젝트 제목" />
            </div>
            <div className="space-y-2">
              <Label>프로젝트명</Label>
              <Input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} placeholder="프로젝트명" />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>고객사</Label>
              <Input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="고객사명" />
            </div>
            <div className="space-y-2">
              <Label>면적</Label>
              <Input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="예: 330㎡" />
            </div>
            <div className="space-y-2">
              <Label>위치</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="예: 서울 강남구" />
            </div>
            <div className="space-y-2">
              <Label>공사 기간</Label>
              <Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="예: 8주" />
            </div>
            <div className="space-y-2">
              <Label>태그 (쉼표 구분)</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="모던, 미니멀, 오픈플랜" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>설명</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="프로젝트 설명" />
          </div>
          {/* 이미지 업로드 & 미리보기 */}
          <div className="space-y-2">
            <Label>이미지</Label>
            <div className="flex flex-wrap gap-3">
              {createPreviewImages.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-md overflow-hidden border border-border group">
                  <img src={img.url} alt={img.file.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeCreatePreview(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => createFileInputRef.current?.click()}
                className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-gold hover:text-gold transition-colors"
              >
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-xs">사진 추가</span>
              </button>
            </div>
            <input
              ref={createFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleCreatePreviewUpload}
            />
          </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); createPreviewImages.forEach(img => URL.revokeObjectURL(img.url)); setCreatePreviewImages([]); }}>취소</Button>
            <Button onClick={handleCreate} disabled={createDraft.isPending || !form.title.trim()}>
              {createDraft.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>포트폴리오 삭제</DialogTitle>
            <DialogDescription>
              이 포트폴리오를 삭제하시겠습니까? 연결된 이미지도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>취소</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteDraft.mutate({ id: deleteConfirmId })}
              disabled={deleteDraft.isPending}
            >
              {deleteDraft.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
