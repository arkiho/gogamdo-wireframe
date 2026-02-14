import { useState, useCallback } from "react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";
import SEOHead from "@/components/SEOHead";
import {
  MessageSquare, Sparkles, Building2, Calculator,
  Palette, Clock, ArrowRight, X, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";

const SUGGESTED_PROMPTS = [
  "30평 사무실 인테리어 비용이 얼마나 드나요?",
  "오픈 오피스와 개별 사무실, 어떤 게 좋을까요?",
  "인테리어 공사 기간은 보통 얼마나 걸리나요?",
  "사무실 이전 시 인테리어 체크리스트가 궁금해요",
];

function generateSessionId() {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default function AIChat() {
  const [sessionId] = useState(generateSessionId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const [contactForm, setContactForm] = useState({ email: "", name: "", phone: "" });

  const chatMutation = trpc.aiChat.send.useMutation({
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        role: "assistant" as const,
        content: response.content,
      }]);
      // Show contact form after 3 exchanges
      if (messages.filter(m => m.role === "user").length >= 2 && !contactSaved) {
        setTimeout(() => setShowContactForm(true), 1500);
      }
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: "assistant" as const,
        content: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      }]);
    },
  });

  const contactMutation = trpc.aiChat.saveContact.useMutation({
    onSuccess: () => {
      setContactSaved(true);
      setShowContactForm(false);
      toast.success("연락처가 저장되었습니다. 전문 컨설턴트가 연락드리겠습니다.");
      trackEvent("ai_chat_contact_saved", { sessionId });
    },
    onError: () => {
      toast.error("저장에 실패했습니다. 다시 시도해 주세요.");
    },
  });

  const handleSend = useCallback((content: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    trackEvent("ai_chat_message_sent", { sessionId, messageCount: newMessages.length });
    chatMutation.mutate({
      sessionId,
      messages: newMessages,
    });
  }, [messages, sessionId, chatMutation]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email) return;
    contactMutation.mutate({
      sessionId,
      email: contactForm.email,
      name: contactForm.name || undefined,
      phone: contactForm.phone || undefined,
    });
  };

  return (
    <>
      <SEOHead
        title="AI 인테리어 상담 | 고감도"
        description="AI 인테리어 상담 챗봇으로 사무실 인테리어에 대한 궁금증을 해결하세요. 비용, 공사 기간, 디자인 트렌드까지 24시간 상담 가능합니다."
      />

      {/* Hero Section */}
      <section className="pt-32 pb-12 lg:pt-40 lg:pb-16 bg-[#1A1A1A] text-white relative overflow-hidden">
        <div className="absolute top-8 right-8 lg:right-16 opacity-[0.04] select-none pointer-events-none">
          <span className="font-heading text-[10rem] lg:text-[16rem] font-extrabold leading-none">
            AI
          </span>
        </div>
        <div className="container relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center bg-gold text-ink">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium tracking-widest uppercase text-gold">
              AI Interior Consultant
            </span>
          </div>
          <h1 className="font-heading text-3xl lg:text-5xl font-bold mb-4 leading-tight">
            AI 인테리어 상담
          </h1>
          <p className="text-white/60 max-w-xl leading-relaxed">
            사무실 인테리어에 대한 모든 궁금증을 AI 상담사에게 물어보세요.
            비용, 디자인, 공사 기간까지 실시간으로 답변해 드립니다.
          </p>
        </div>
      </section>

      {/* Chat Section */}
      <section className="py-12 lg:py-20">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
            {/* Chat Box */}
            <div className="relative">
              <AIChatBox
                messages={messages}
                onSendMessage={handleSend}
                isLoading={chatMutation.isPending}
                placeholder="인테리어에 대해 궁금한 점을 물어보세요..."
                height="600px"
                emptyStateMessage="고감도 AI 인테리어 상담사입니다. 무엇이든 물어보세요!"
                suggestedPrompts={SUGGESTED_PROMPTS}
              />

              {/* Contact Form Overlay */}
              {showContactForm && !contactSaved && (
                <div className="absolute bottom-20 left-4 right-4 bg-card border border-gold/30 rounded-lg p-5 shadow-xl z-10 animate-in slide-in-from-bottom-4 duration-500">
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <h3 className="font-heading font-semibold text-sm">
                      더 자세한 상담을 원하시나요?
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    연락처를 남겨주시면 전문 컨설턴트가 맞춤 상담을 도와드립니다.
                  </p>
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <div>
                      <Label htmlFor="chat-email" className="text-xs">이메일 *</Label>
                      <Input
                        id="chat-email"
                        type="email"
                        required
                        placeholder="email@company.com"
                        value={contactForm.email}
                        onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="chat-name" className="text-xs">이름</Label>
                        <Input
                          id="chat-name"
                          placeholder="홍길동"
                          value={contactForm.name}
                          onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="chat-phone" className="text-xs">연락처</Label>
                        <Input
                          id="chat-phone"
                          placeholder="010-0000-0000"
                          value={contactForm.phone}
                          onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-9 bg-gold text-ink hover:bg-gold/90 text-sm"
                      disabled={contactMutation.isPending}
                    >
                      {contactMutation.isPending ? "저장 중..." : "상담 신청하기"}
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Features */}
              <div className="bg-card border rounded-lg p-5">
                <h3 className="font-heading font-semibold mb-4 text-sm">AI 상담사가 도와드리는 것</h3>
                <div className="space-y-3">
                  {[
                    { icon: <Calculator className="w-4 h-4" />, text: "인테리어 비용 안내" },
                    { icon: <Palette className="w-4 h-4" />, text: "디자인 스타일 추천" },
                    { icon: <Clock className="w-4 h-4" />, text: "공사 기간 & 프로세스" },
                    { icon: <Building2 className="w-4 h-4" />, text: "공간 활용 조언" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-8 h-8 flex items-center justify-center bg-gold/10 text-gold rounded">
                        {item.icon}
                      </div>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Saved Badge */}
              {contactSaved && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">상담 신청 완료</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    전문 컨설턴트가 곧 연락드리겠습니다.
                  </p>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-card border rounded-lg p-5">
                <h3 className="font-heading font-semibold mb-4 text-sm">더 알아보기</h3>
                <div className="space-y-2">
                  <Link href="/estimator">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                      <span className="text-sm">AI 예상 견적 받기</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                    </div>
                  </Link>
                  <Link href="/ai-style">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                      <span className="text-sm">AI 스타일 추천</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                    </div>
                  </Link>
                  <Link href="/portfolio">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                      <span className="text-sm">프로젝트 사례 보기</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                    </div>
                  </Link>
                  <Link href="/contact">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                      <span className="text-sm">무료 상담 신청</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                    </div>
                  </Link>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-4">
                <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                  AI 상담사는 일반적인 인테리어 정보를 제공합니다. 정확한 견적과 맞춤 설계는 전문 컨설턴트 상담을 통해 확인하실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
