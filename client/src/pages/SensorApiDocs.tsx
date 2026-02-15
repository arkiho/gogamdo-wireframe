import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Wifi, Shield, Zap, Server, Activity, Heart, Database, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

function CodeBlock({ title, language, code }: { title?: string; language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("코드가 복사되었습니다");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg overflow-hidden border border-border/50 my-4">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] h-5">{language}</Badge>
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
      <pre className="bg-ink text-white p-4 overflow-x-auto text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors">
        {icon}
        <span className="font-semibold text-sm flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border/50">{children}</div>}
    </div>
  );
}

function EndpointCard({ method, path, description, requestBody, responseBody, notes }: {
  method: string; path: string; description: string;
  requestBody?: string; responseBody?: string; notes?: string;
}) {
  const methodColor = method === "POST" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700";
  return (
    <div className="border border-border/50 rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Badge className={`${methodColor} font-mono text-xs`}>{method}</Badge>
        <code className="text-sm font-mono font-semibold">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {requestBody && (
        <CodeBlock title="Request Body" language="JSON" code={requestBody} />
      )}
      {responseBody && (
        <CodeBlock title="Response" language="JSON" code={responseBody} />
      )}
      {notes && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
          {notes}
        </div>
      )}
    </div>
  );
}

export default function SensorApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-ink text-white">
        <div className="container max-w-5xl py-12">
          <Link href="/">
            <span className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-6 cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> 홈으로 돌아가기
            </span>
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">고감도 센서 연동 API</h1>
              <p className="text-white/60 text-sm">Developer Documentation v1.0</p>
            </div>
          </div>
          <p className="text-white/70 max-w-2xl mt-4 leading-relaxed">
            고감도 DDIA(Data-Driven Interior Analytics) 시스템과 연동하기 위한 센서 하드웨어 통합 API 문서입니다.
            재실 센서, 환경 센서 등 다양한 IoT 디바이스에서 실시간 데이터를 전송할 수 있습니다.
          </p>
          <div className="flex gap-3 mt-6">
            <Badge variant="outline" className="border-gold/30 text-gold">REST API</Badge>
            <Badge variant="outline" className="border-white/30 text-white/70">JSON</Badge>
            <Badge variant="outline" className="border-white/30 text-white/70">Bearer Auth</Badge>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl py-10 space-y-8">
        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-gold" /> 빠른 시작 가이드
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center mb-2">
                  <span className="text-gold font-bold text-sm">1</span>
                </div>
                <h4 className="font-semibold text-sm mb-1">API 키 발급</h4>
                <p className="text-xs text-muted-foreground">관리자 대시보드에서 프로젝트별 API 키를 생성합니다.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center mb-2">
                  <span className="text-gold font-bold text-sm">2</span>
                </div>
                <h4 className="font-semibold text-sm mb-1">센서 설정</h4>
                <p className="text-xs text-muted-foreground">센서 디바이스에 API 키와 엔드포인트 URL을 설정합니다.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center mb-2">
                  <span className="text-gold font-bold text-sm">3</span>
                </div>
                <h4 className="font-semibold text-sm mb-1">데이터 전송</h4>
                <p className="text-xs text-muted-foreground">센서에서 이벤트/데이터를 REST API로 전송합니다.</p>
              </div>
            </div>

            <CodeBlock
              title="빠른 테스트 (cURL)"
              language="bash"
              code={`curl -X POST \\
  https://your-domain.com/api/sensor/event \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sensorId": "sensor-001",
    "eventType": "enter",
    "count": 1
  }'`}
            />
          </CardContent>
        </Card>

        {/* Authentication */}
        <CollapsibleSection
          title="인증 (Authentication)"
          icon={<Shield className="w-5 h-5 text-gold" />}
          defaultOpen={true}
        >
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              모든 API 요청에는 <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization</code> 헤더에 
              Bearer 토큰 형식으로 API 키를 포함해야 합니다. API 키는 관리자 대시보드의 DDIA 섹션에서 프로젝트별로 생성할 수 있습니다.
            </p>

            <CodeBlock
              title="인증 헤더 형식"
              language="HTTP"
              code={`Authorization: Bearer sk_live_abc123def456...`}
            />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-800 mb-1">보안 주의사항</h4>
              <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
                <li>API 키는 생성 시 한 번만 표시됩니다. 안전한 곳에 보관하세요.</li>
                <li>API 키를 소스 코드에 하드코딩하지 마세요. 환경 변수를 사용하세요.</li>
                <li>키가 노출된 경우 즉시 관리자 대시보드에서 폐기하고 새 키를 발급받으세요.</li>
                <li>각 API 키는 특정 프로젝트에 바인딩됩니다.</li>
              </ul>
            </div>

            <h4 className="font-semibold text-sm mt-4">API 키 상태 확인</h4>
            <EndpointCard
              method="GET"
              path="/api/sensor/status"
              description="현재 API 키의 상태와 사용량을 확인합니다."
              responseBody={`{
  "success": true,
  "projectId": 1,
  "keyName": "3층 센서 허브",
  "requestCount": 15420,
  "active": true,
  "serverTime": "2026-02-16T09:00:00.000Z"
}`}
            />
          </div>
        </CollapsibleSection>

        {/* Occupancy Events */}
        <CollapsibleSection
          title="재실 이벤트 API (Occupancy Events)"
          icon={<Activity className="w-5 h-5 text-blue-500" />}
          defaultOpen={true}
        >
          <div className="space-y-6 mt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              재실 센서에서 사람의 출입 이벤트를 전송합니다. 이 데이터는 공간 활용 히트맵, 동선 분석, 체류 시간 분석에 활용됩니다.
            </p>

            {/* Single Event */}
            <EndpointCard
              method="POST"
              path="/api/sensor/event"
              description="단건 재실 이벤트를 전송합니다."
              requestBody={`{
  "sensorId": "sensor-001",      // (필수) 센서 고유 ID
  "eventType": "enter",          // (필수) "enter" | "exit" | "count_change"
  "zoneId": 5,                   // (선택) 구역 ID (미지정 시 자동 매핑)
  "count": 1,                    // (선택) 인원 수 변화량
  "eventAt": 1708000000000,      // (선택) 이벤트 발생 시각 (Unix ms, 미지정 시 서버 시각)
  "deviceId": "hub-3f"           // (선택) 게이트웨이/허브 ID
}`}
              responseBody={`{
  "success": true,
  "message": "Event recorded"
}`}
              notes="eventType 필드는 enter(입장), exit(퇴장), count_change(인원 변동) 중 하나여야 합니다. count를 지정하지 않으면 enter=+1, exit=-1, count_change=0으로 자동 설정됩니다."
            />

            {/* Batch Events */}
            <EndpointCard
              method="POST"
              path="/api/sensor/events/batch"
              description="여러 재실 이벤트를 한 번에 전송합니다. 최대 1,000건까지 지원합니다."
              requestBody={`{
  "events": [
    {
      "sensorId": "sensor-001",
      "eventType": "enter",
      "count": 1,
      "eventAt": 1708000000000
    },
    {
      "sensorId": "sensor-002",
      "eventType": "exit",
      "count": -1,
      "eventAt": 1708000001000
    }
  ]
}`}
              responseBody={`{
  "success": true,
  "message": "2 events recorded",
  "count": 2
}`}
              notes="배치 전송은 네트워크 효율성을 높이기 위해 권장됩니다. 한 번에 최대 1,000건까지 전송할 수 있습니다."
            />
          </div>
        </CollapsibleSection>

        {/* Sensor Data */}
        <CollapsibleSection
          title="범용 센서 데이터 API (Sensor Data)"
          icon={<Database className="w-5 h-5 text-purple-500" />}
        >
          <div className="space-y-6 mt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              온도, 습도, CO2, 조도 등 범용 센서 데이터를 전송합니다.
            </p>

            <EndpointCard
              method="POST"
              path="/api/sensor/data"
              description="단건 센서 데이터를 전송합니다."
              requestBody={`{
  "sensorId": "temp-sensor-01",    // (필수) 센서 고유 ID
  "value": 23.5,                   // (필수) 측정값
  "recordedAt": 1708000000000      // (선택) 측정 시각 (Unix ms)
}`}
              responseBody={`{
  "success": true,
  "message": "Data recorded"
}`}
            />

            <EndpointCard
              method="POST"
              path="/api/sensor/data/batch"
              description="여러 센서 데이터를 한 번에 전송합니다. 최대 1,000건까지 지원합니다."
              requestBody={`{
  "data": [
    { "sensorId": "temp-01", "value": 23.5, "recordedAt": 1708000000000 },
    { "sensorId": "hum-01", "value": 55.2, "recordedAt": 1708000000000 },
    { "sensorId": "co2-01", "value": 420, "recordedAt": 1708000000000 }
  ]
}`}
              responseBody={`{
  "success": true,
  "message": "3 data points recorded",
  "count": 3
}`}
            />
          </div>
        </CollapsibleSection>

        {/* Heartbeat */}
        <CollapsibleSection
          title="하트비트 API (Heartbeat)"
          icon={<Heart className="w-5 h-5 text-red-500" />}
        >
          <div className="space-y-6 mt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              센서 디바이스의 상태를 주기적으로 보고합니다. 배터리 잔량, 펌웨어 버전, 신호 강도 등의 메타데이터를 전송할 수 있습니다.
            </p>

            <EndpointCard
              method="POST"
              path="/api/sensor/heartbeat"
              description="센서 하트비트 및 상태 정보를 전송합니다."
              requestBody={`{
  "sensorId": "sensor-001",     // (필수) 센서 고유 ID
  "status": "online",           // (선택) "online" | "low_battery" | "error"
  "firmware": "v2.1.3",         // (선택) 펌웨어 버전
  "battery": 85,                // (선택) 배터리 잔량 (%)
  "rssi": -65                   // (선택) 신호 강도 (dBm)
}`}
              responseBody={`{
  "success": true,
  "message": "Heartbeat received",
  "serverTime": "2026-02-16T09:00:00.000Z"
}`}
              notes="하트비트는 5~15분 간격으로 전송하는 것을 권장합니다. 30분 이상 하트비트가 없으면 센서가 오프라인으로 표시될 수 있습니다."
            />
          </div>
        </CollapsibleSection>

        {/* Error Handling */}
        <CollapsibleSection
          title="에러 처리 (Error Handling)"
          icon={<Server className="w-5 h-5 text-orange-500" />}
        >
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              API는 표준 HTTP 상태 코드를 사용합니다. 에러 발생 시 JSON 형식으로 상세 정보를 반환합니다.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">상태 코드</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">의미</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">설명</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-2 pr-4"><Badge className="bg-green-100 text-green-700">200</Badge></td>
                    <td className="py-2 pr-4 font-medium">성공</td>
                    <td className="py-2 text-muted-foreground">요청이 성공적으로 처리됨</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4"><Badge className="bg-red-100 text-red-700">400</Badge></td>
                    <td className="py-2 pr-4 font-medium">잘못된 요청</td>
                    <td className="py-2 text-muted-foreground">필수 필드 누락 또는 잘못된 형식</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4"><Badge className="bg-red-100 text-red-700">401</Badge></td>
                    <td className="py-2 pr-4 font-medium">인증 실패</td>
                    <td className="py-2 text-muted-foreground">API 키가 없거나 유효하지 않음</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4"><Badge className="bg-red-100 text-red-700">403</Badge></td>
                    <td className="py-2 pr-4 font-medium">권한 없음</td>
                    <td className="py-2 text-muted-foreground">API 키가 폐기됨</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><Badge className="bg-red-100 text-red-700">500</Badge></td>
                    <td className="py-2 pr-4 font-medium">서버 오류</td>
                    <td className="py-2 text-muted-foreground">서버 내부 오류 (재시도 권장)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CodeBlock
              title="에러 응답 예시"
              language="JSON"
              code={`{
  "error": "sensorId and eventType are required"
}`}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-1">재시도 전략</h4>
              <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                <li>5xx 에러: 지수 백오프(exponential backoff)로 최대 3회 재시도</li>
                <li>4xx 에러: 요청 내용을 수정한 후 재시도</li>
                <li>네트워크 오류: 로컬 버퍼에 저장 후 연결 복구 시 배치 전송</li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        {/* SDK Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-gold" /> 연동 코드 예제
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock
              title="Python 예제"
              language="Python"
              code={`import requests
import time

API_KEY = "sk_live_your_api_key_here"
BASE_URL = "https://your-domain.com/api/sensor"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# 단건 이벤트 전송
def send_event(sensor_id, event_type, count=None):
    payload = {
        "sensorId": sensor_id,
        "eventType": event_type,
        "eventAt": int(time.time() * 1000)
    }
    if count is not None:
        payload["count"] = count
    
    response = requests.post(
        f"{BASE_URL}/event",
        json=payload,
        headers=HEADERS
    )
    return response.json()

# 배치 이벤트 전송
def send_batch_events(events):
    response = requests.post(
        f"{BASE_URL}/events/batch",
        json={"events": events},
        headers=HEADERS
    )
    return response.json()

# 하트비트 전송
def send_heartbeat(sensor_id, battery=None):
    payload = {"sensorId": sensor_id, "status": "online"}
    if battery is not None:
        payload["battery"] = battery
    
    response = requests.post(
        f"{BASE_URL}/heartbeat",
        json=payload,
        headers=HEADERS
    )
    return response.json()

# 사용 예시
result = send_event("sensor-001", "enter", count=1)
print(result)  # {"success": true, "message": "Event recorded"}`}
            />

            <CodeBlock
              title="Arduino / ESP32 예제"
              language="C++"
              code={`#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* API_KEY = "sk_live_your_api_key_here";
const char* BASE_URL = "https://your-domain.com/api/sensor";
const char* SENSOR_ID = "sensor-esp32-001";

void sendOccupancyEvent(const char* eventType, int count) {
  HTTPClient http;
  String url = String(BASE_URL) + "/event";
  
  http.begin(url);
  http.addHeader("Authorization", String("Bearer ") + API_KEY);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<256> doc;
  doc["sensorId"] = SENSOR_ID;
  doc["eventType"] = eventType;
  doc["count"] = count;
  doc["eventAt"] = millis();  // 실제로는 NTP 시각 사용 권장
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    Serial.println("Event sent successfully");
  } else {
    Serial.printf("Error: %d\\n", httpCode);
  }
  http.end();
}

void sendHeartbeat(int battery, int rssi) {
  HTTPClient http;
  String url = String(BASE_URL) + "/heartbeat";
  
  http.begin(url);
  http.addHeader("Authorization", String("Bearer ") + API_KEY);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<256> doc;
  doc["sensorId"] = SENSOR_ID;
  doc["status"] = "online";
  doc["battery"] = battery;
  doc["rssi"] = rssi;
  doc["firmware"] = "v1.0.0";
  
  String payload;
  serializeJson(doc, payload);
  http.POST(payload);
  http.end();
}

void setup() {
  Serial.begin(115200);
  // WiFi 연결 코드...
}

void loop() {
  // PIR 센서 감지 시 이벤트 전송
  if (digitalRead(PIR_PIN) == HIGH) {
    sendOccupancyEvent("enter", 1);
    delay(5000);  // 디바운스
  }
  
  // 10분마다 하트비트 전송
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 600000) {
    sendHeartbeat(analogRead(BATTERY_PIN), WiFi.RSSI());
    lastHeartbeat = millis();
  }
}`}
            />

            <CodeBlock
              title="Node.js 예제"
              language="JavaScript"
              code={`const API_KEY = process.env.SENSOR_API_KEY;
const BASE_URL = "https://your-domain.com/api/sensor";

async function sendEvent(sensorId, eventType, count) {
  const response = await fetch(\`\${BASE_URL}/event\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sensorId,
      eventType,
      count,
      eventAt: Date.now()
    })
  });
  return response.json();
}

async function sendBatchEvents(events) {
  const response = await fetch(\`\${BASE_URL}/events/batch\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ events })
  });
  return response.json();
}

// 사용 예시
const result = await sendEvent("sensor-001", "enter", 1);
console.log(result);`}
            />
          </CardContent>
        </Card>

        {/* Rate Limits & Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">제한 사항 및 모범 사례</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm mb-3">전송 제한</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-gold mt-1">•</span>
                    <span>배치 전송: 요청당 최대 <strong className="text-foreground">1,000건</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold mt-1">•</span>
                    <span>요청 본문 크기: 최대 <strong className="text-foreground">1MB</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold mt-1">•</span>
                    <span>타임스탬프: Unix 밀리초 형식 (UTC 기준)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-3">모범 사례</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-gold mt-1">•</span>
                    <span>가능하면 <strong className="text-foreground">배치 전송</strong>을 사용하여 네트워크 효율성을 높이세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold mt-1">•</span>
                    <span>네트워크 장애 시 <strong className="text-foreground">로컬 버퍼링</strong> 후 복구 시 배치 전송</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold mt-1">•</span>
                    <span>하트비트를 <strong className="text-foreground">5~15분</strong> 간격으로 전송하여 센서 상태 모니터링</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold mt-1">•</span>
                    <span>센서 ID는 프로젝트 내에서 <strong className="text-foreground">고유</strong>하게 유지하세요</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="border-gold/20 bg-gold/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wifi className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">기술 지원이 필요하신가요?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  센서 연동 관련 기술 문의는 고감도 담당자에게 연락해주세요.
                </p>
                <div className="flex gap-3">
                  <Link href="/contact">
                    <Button size="sm" className="bg-gold hover:bg-gold-light text-ink">
                      문의하기
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText("tech@gogamdo.com");
                    toast.success("이메일이 복사되었습니다");
                  }}>
                    tech@gogamdo.com 복사
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
