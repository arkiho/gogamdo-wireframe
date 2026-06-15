import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Upload, Wand2, Trash2, Star, Loader2,
  Image as ImageIcon, Eye, Send, Archive, Save,
  Sparkles, GripVertical, AlertCircle, SplitSquareHorizontal,
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import Logo from "@/components/Logo";

function formatDate(d: Date | string | null) {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const CATEGORY_OPTIONS = [
  "오피스", "산업시설", "병원", "관급공사", "리테일",
];

const DRAFT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "초안", color: "bg-gray-100 text-gray-700" },
  review: { label: "검토중", color: "bg-blue-100 text-blue-700" },
  published: { label: "게시됨", color: "bg-green-100 text-green-700" },
  archived: { label: "보관", color: "bg-red-100 text-red-700" },
};

export default function AdminPortfolioDetail() {
  const { user, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const draftId = parseInt(params.id || "0");

  const draft = trpc.portfolio.get.useQuery({ id: draftId }, { enabled: !!user && (user.role === "admin" || user.role === "master") && draftId > 0 });
  const updateDraft = trpc.portfolio.update.useMutation({ onSuccess: () => draft.refetch() });
  const publishDraft = trpc.portfolio.publish.useMutation({ onSuccess: () => draft.refetch() });
  const archiveDraft = trpc.portfolio.archive.useMutation({ onSuccess: () => draft.refetch() });
  const generateDesc = trpc.portfolio.generateDescription.useMutation({ onSuccess: () => draft.refetch() });
  const addImage = trpc.portfolio.addImage.useMutation({ onSuccess: () => draft.refetch() });
  const deleteImage = trpc.portfolio.deleteImage.useMutation({ onSuccess: () => draft.refetch() });
  const setCover = trpc.portfolio.setCover.useMutation({ onSuccess: () => draft.refetch() });
  const processImage = trpc.portfolio.processImage.useMutation({ onSuccess: () => draft.refetch() });

  const updateImage = trpc.portfolio.updateImage.useMutation({ onSuccess: () => draft.refetch() });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [uploadingBeforeId, setUploadingBeforeId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const [beforeUploadTargetId, setBeforeUploadTargetId] = useState<number | null>(null);

  const startEditing = useCallback(() => {
    if (!draft.data) return;
    setEditData({
      title: draft.data.title,
      category: draft.data.category || "사무실 인테리어",
      client: draft.data.client || "",
      area: draft.data.area || "",
      location: draft.data.location || "",
      duration: draft.data.duration || "",
      description: draft.data.description || "",
    });
    setIsEditing(true);
  }, [draft.data]);

  const saveEdits = () => {
    updateDraft.mutate({ id: draftId, ...editData });
    setIsEditing(false);
  };

  const handleBeforeUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !beforeUploadTargetId) return;
    setUploadingBeforeId(beforeUploadTargetId);
    try {
      const file = files[0];
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: base64,
          filename: `before-${file.name}`,
          mimeType: file.type,
        }),
      });

      if (!response.ok) throw new Error("Upload failed");
      const { url } = await response.json();

      await updateImage.mutateAsync({
        id: beforeUploadTargetId,
        beforeUrl: url,
      });
    } catch (err) {
      console.error("Before image upload error:", err);
      alert("Before 이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingBeforeId(null);
      setBeforeUploadTargetId(null);
      if (beforeFileInputRef.current) beforeFileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(file);
        });

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: base64,
            filename: file.name,
            mimeType: file.type,
          }),
        });

        if (!response.ok) throw new Error("Upload failed");
        const { url } = await response.json();

        await addImage.mutateAsync({
          draftId,
          originalUrl: url,
          filename: file.name,
          sortOrder: (draft.data?.images?.length || 0) + i,
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "master")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-ink">접근 권한 없음</h1>
          <Button onClick={() => { window.location.href = getLoginUrl(); }}>로그인</Button>
        </div>
      </div>
    );
  }

  if (draft.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!draft.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="font-heading text-xl font-bold text-ink">포트폴리오를 찾을 수 없습니다</h1>
          <Link href="/admin"><Button variant="outline">대시보드로 돌아가기</Button></Link>
        </div>
      </div>
    );
  }

  const d = draft.data;
  const images = d.images || [];
  const statusInfo = DRAFT_STATUS_MAP[d.status] || DRAFT_STATUS_MAP.draft;

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-ink transition-colors">
                <ArrowLeft className="w-4 h-4" />
                대시보드
              </span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <Logo className="w-24 h-6" color="#111" />
            <span className="text-xs font-medium tracking-widest uppercase text-gold">Portfolio</span>
          </div>
          <div className="flex items-center gap-2">
            {d.status === "draft" && (
              <Button
                variant="outline" size="sm"
                onClick={() => updateDraft.mutate({ id: draftId, status: "review" })}
              >
                <Eye className="w-4 h-4 mr-1" /> 검토 요청
              </Button>
            )}
            {(d.status === "draft" || d.status === "review") && (
              <Button
                size="sm" className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => { if (confirm("이 포트폴리오를 게시하시겠습니까?")) publishDraft.mutate({ id: draftId }); }}
              >
                <Send className="w-4 h-4 mr-1" /> 게시
              </Button>
            )}
            {d.status === "published" && (
              <Button
                variant="outline" size="sm"
                onClick={() => archiveDraft.mutate({ id: draftId })}
              >
                <Archive className="w-4 h-4 mr-1" /> 보관
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">프로젝트 정보</CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={startEditing}>편집</Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={saveEdits} disabled={updateDraft.isPending} className="bg-gold text-ink hover:bg-gold-light">
                        <Save className="w-3 h-3 mr-1" /> 저장
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>취소</Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">제목</label>
                      <input type="text" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">카테고리</label>
                      <select value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white">
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">고객사</label>
                      <input type="text" value={editData.client} onChange={e => setEditData({ ...editData, client: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">면적</label>
                      <input type="text" value={editData.area} onChange={e => setEditData({ ...editData, area: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">위치</label>
                      <input type="text" value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">공사 기간</label>
                      <input type="text" value={editData.duration} onChange={e => setEditData({ ...editData, duration: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">설명</label>
                      <textarea value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })}
                        rows={4} className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none" />
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="font-heading text-xl font-bold text-ink">{d.title}</h2>
                    <div className="space-y-2 text-sm">
                      {d.category && <div className="flex justify-between"><span className="text-muted-foreground">카테고리</span><span className="text-ink font-medium">{d.category}</span></div>}
                      {d.client && <div className="flex justify-between"><span className="text-muted-foreground">고객사</span><span className="text-ink font-medium">{d.client}</span></div>}
                      {d.area && <div className="flex justify-between"><span className="text-muted-foreground">면적</span><span className="text-ink font-medium">{d.area}</span></div>}
                      {d.location && <div className="flex justify-between"><span className="text-muted-foreground">위치</span><span className="text-ink font-medium">{d.location}</span></div>}
                      {d.duration && <div className="flex justify-between"><span className="text-muted-foreground">공사 기간</span><span className="text-ink font-medium">{d.duration}</span></div>}
                    </div>
                    {d.description && <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>}
                  </>
                )}
                <div className="pt-3 border-t border-border/30 text-xs text-muted-foreground space-y-1">
                  <div>생성: {formatDate(d.createdAt)}</div>
                  <div>수정: {formatDate(d.updatedAt)}</div>
                  {d.publishedAt && <div className="text-green-600">게시: {formatDate(d.publishedAt)}</div>}
                </div>
              </CardContent>
            </Card>

            {/* AI Description */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-gold" /> AI 설명
                </CardTitle>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => generateDesc.mutate({
                    id: draftId, title: d.title,
                    category: d.category || undefined, client: d.client || undefined,
                    area: d.area || undefined, location: d.location || undefined,
                    imageCount: images.length,
                  })}
                  disabled={generateDesc.isPending}
                >
                  {generateDesc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span className="ml-1">{d.aiDescription ? "재생성" : "생성"}</span>
                </Button>
              </CardHeader>
              <CardContent>
                {d.aiDescription ? (
                  <p className="text-sm text-ink/80 leading-relaxed">{d.aiDescription}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    AI 설명이 아직 생성되지 않았습니다. 위 버튼을 클릭하여 자동 생성하세요.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Images */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> 이미지 ({images.length})
                </CardTitle>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => handleFileUpload(e.target.files)}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-gold text-ink hover:bg-gold-light"
                    size="sm"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                    이미지 업로드
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {images.length === 0 ? (
                  <div
                    className="border-2 border-dashed border-border/50 rounded-lg p-12 text-center cursor-pointer hover:border-gold/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">이미지를 드래그하거나 클릭하여 업로드</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP 지원 (최대 10MB)</p>
                  </div>
                ) : (
                  <>
                    {/* Hidden Before file input */}
                    <input
                      ref={beforeFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleBeforeUpload(e.target.files)}
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((img: any) => (
                      <div key={img.id} className="group relative">
                        <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border/50">
                          <img
                            src={img.processedUrl || img.originalUrl}
                            alt={img.filename || "포트폴리오 이미지"}
                            className="w-full h-full object-cover"
                          />
                          {img.processingStatus === "processing" && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                              <Loader2 className="w-6 h-6 animate-spin text-white" />
                            </div>
                          )}
                          {img.isCover === "yes" && (
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-0.5 text-xs font-medium bg-gold text-ink rounded-full">커버</span>
                            </div>
                          )}
                          {img.aiProcessed === "yes" && (
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-0.5 text-xs font-medium bg-purple-500 text-white rounded-full">AI</span>
                            </div>
                          )}
                        </div>
                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost" size="sm"
                            className="bg-white/90 hover:bg-white text-ink h-8 w-8 p-0"
                            onClick={() => setCover.mutate({ draftId, imageId: img.id })}
                            title="커버로 설정"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="bg-white/90 hover:bg-white text-gold h-8 w-8 p-0"
                            onClick={() => processImage.mutate({ imageId: img.id, originalUrl: img.originalUrl, action: "enhance" })}
                            disabled={processImage.isPending}
                            title="AI 보정"
                          >
                            <Wand2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="bg-white/90 hover:bg-white text-purple-600 h-8 w-8 p-0"
                            onClick={() => processImage.mutate({ imageId: img.id, originalUrl: img.originalUrl, action: "addPeople" })}
                            disabled={processImage.isPending}
                            title="사람 추가"
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="bg-white/90 hover:bg-white text-destructive h-8 w-8 p-0"
                            onClick={() => { if (confirm("이 이미지를 삭제하시겠습니까?")) deleteImage.mutate({ id: img.id }); }}
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {/* Before image indicator & upload */}
                        <div className="mt-1.5 flex items-center gap-1">
                          {img.beforeUrl ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded">
                              <SplitSquareHorizontal className="w-3 h-3" />
                              B/A 비교 가능
                            </span>
                          ) : (
                            <button
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                              onClick={() => {
                                setBeforeUploadTargetId(img.id);
                                setTimeout(() => beforeFileInputRef.current?.click(), 0);
                              }}
                              disabled={uploadingBeforeId === img.id}
                            >
                              {uploadingBeforeId === img.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              Before 추가
                            </button>
                          )}
                          {img.beforeUrl && (
                            <button
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-500 border border-red-200 rounded hover:bg-red-100 transition-colors"
                              onClick={() => {
                                if (confirm("Before 이미지를 제거하시겠습니까?"))
                                  updateImage.mutate({ id: img.id, beforeUrl: null });
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {/* Filename */}
                        <p className="text-xs text-muted-foreground mt-1 truncate">{img.filename || `이미지 ${img.id}`}</p>
                      </div>
                    ))}
                    {/* Add more button */}
                    <div
                      className="aspect-[4/3] border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center cursor-pointer hover:border-gold/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground">추가</span>
                      </div>
                    </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
