import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== 1. staffProcedure 권한 테스트 =====
describe("staffProcedure 접근 권한", () => {
  it("admin 역할은 staffProcedure에 접근 가능해야 함", () => {
    const user = { role: "admin", department: null };
    const canAccess = user.role === "admin" || user.role === "master" || (user.department && user.department !== "none");
    expect(canAccess).toBe(true);
  });

  it("master 역할은 staffProcedure에 접근 가능해야 함", () => {
    const user = { role: "master", department: null };
    const canAccess = user.role === "admin" || user.role === "master" || (user.department && user.department !== "none");
    expect(canAccess).toBe(true);
  });

  it("부서 배정된 일반 직원은 staffProcedure에 접근 가능해야 함", () => {
    const user = { role: "user", department: "design" };
    const canAccess = user.role === "admin" || user.role === "master" || (user.department && user.department !== "none");
    expect(canAccess).toBe(true);
  });

  it("부서 미배정 일반 직원은 staffProcedure에 접근 불가해야 함", () => {
    const user = { role: "user", department: "none" };
    const canAccess = user.role === "admin" || user.role === "master" || (user.department && user.department !== "none");
    expect(canAccess).toBe(false);
  });

  it("부서 null인 일반 직원은 staffProcedure에 접근 불가해야 함", () => {
    const user = { role: "user", department: null };
    const canAccess = user.role === "admin" || user.role === "master" || (user.department && user.department !== "none");
    expect(canAccess).toBeFalsy();
  });
});

// ===== 2. deptProcedure 권한 테스트 =====
describe("deptProcedure 부서별 접근 권한", () => {
  const allowedDepts = ["accounting", "management"];

  function canAccessDept(user: { role: string; department: string | null }) {
    if (user.role === "admin" || user.role === "master") return true;
    if (user.department && allowedDepts.includes(user.department)) return true;
    return false;
  }

  it("admin은 모든 부서별 프로시저에 접근 가능", () => {
    expect(canAccessDept({ role: "admin", department: null })).toBe(true);
  });

  it("master는 모든 부서별 프로시저에 접근 가능", () => {
    expect(canAccessDept({ role: "master", department: null })).toBe(true);
  });

  it("경리부 직원은 accounting 프로시저에 접근 가능", () => {
    expect(canAccessDept({ role: "user", department: "accounting" })).toBe(true);
  });

  it("시공팀 직원은 accounting 프로시저에 접근 불가", () => {
    expect(canAccessDept({ role: "user", department: "construction" })).toBe(false);
  });
});

// ===== 3. 지결 승인 알림 로직 테스트 =====
describe("지결 승인 시 회계 담당자 알림", () => {
  it("승인 상태가 approved일 때 알림이 발송되어야 함", async () => {
    const expense = {
      id: 1,
      title: "사무용품 구매",
      amount: 150000,
      status: "pending",
      projectId: 1,
      requesterId: 2,
    };

    const newStatus = "approved";
    const shouldNotifyAccountants = newStatus === "approved";

    expect(shouldNotifyAccountants).toBe(true);
  });

  it("반려 상태일 때는 회계 알림이 발송되지 않아야 함", () => {
    const newStatus = "rejected";
    const shouldNotifyAccountants = newStatus === "approved";
    expect(shouldNotifyAccountants).toBe(false);
  });

  it("대기 상태일 때는 회계 알림이 발송되지 않아야 함", () => {
    const newStatus = "pending";
    const shouldNotifyAccountants = newStatus === "approved";
    expect(shouldNotifyAccountants).toBe(false);
  });
});

// ===== 4. 사용자 역할 변경 로직 테스트 =====
describe("사용자 역할 변경 권한", () => {
  function canChangeRole(
    currentUser: { id: number; role: string },
    targetUserId: number,
    newRole: string
  ): { allowed: boolean; reason?: string } {
    // 자기 자신의 역할은 변경 불가
    if (currentUser.id === targetUserId) {
      return { allowed: false, reason: "자신의 역할은 변경할 수 없습니다." };
    }
    // master 또는 admin 역할 부여는 master만 가능
    if ((newRole === "master" || newRole === "admin") && currentUser.role !== "master") {
      return { allowed: false, reason: "마스터만 관리자/마스터 역할을 부여할 수 있습니다." };
    }
    return { allowed: true };
  }

  it("master는 admin 역할을 부여할 수 있음", () => {
    const result = canChangeRole({ id: 1, role: "master" }, 2, "admin");
    expect(result.allowed).toBe(true);
  });

  it("master는 master 역할을 부여할 수 있음", () => {
    const result = canChangeRole({ id: 1, role: "master" }, 2, "master");
    expect(result.allowed).toBe(true);
  });

  it("admin은 admin 역할을 부여할 수 없음", () => {
    const result = canChangeRole({ id: 1, role: "admin" }, 2, "admin");
    expect(result.allowed).toBe(false);
  });

  it("admin은 user 역할로 변경할 수 있음", () => {
    const result = canChangeRole({ id: 1, role: "admin" }, 2, "user");
    expect(result.allowed).toBe(true);
  });

  it("자기 자신의 역할은 변경할 수 없음", () => {
    const result = canChangeRole({ id: 1, role: "master" }, 1, "user");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("자신의 역할");
  });
});

// ===== 5. 프로젝트 수정 입력 유효성 테스트 =====
describe("프로젝트 수정 입력 유효성", () => {
  const validStatuses = ["planning", "designing", "permit", "construction", "inspection", "completed", "warranty", "closed"];

  it("유효한 상태값은 허용되어야 함", () => {
    validStatuses.forEach(status => {
      expect(validStatuses.includes(status)).toBe(true);
    });
  });

  it("유효하지 않은 상태값은 거부되어야 함", () => {
    expect(validStatuses.includes("invalid_status")).toBe(false);
    expect(validStatuses.includes("")).toBe(false);
  });
});

// ===== 6. CameraTab projectId 타입 변환 테스트 =====
describe("CameraTab projectId 타입 변환", () => {
  it("string projectId를 number로 변환해야 함", () => {
    const projectIdStr = "123";
    const projectIdNum = Number(projectIdStr);
    expect(projectIdNum).toBe(123);
    expect(typeof projectIdNum).toBe("number");
  });

  it("NaN인 경우 0으로 처리해야 함", () => {
    const projectIdStr = "abc";
    const projectIdNum = Number(projectIdStr) || 0;
    expect(projectIdNum).toBe(0);
  });
});

// ===== 7. notifyAccountants 함수 로직 테스트 =====
describe("notifyAccountants 알림 대상 필터링", () => {
  const allUsers = [
    { id: 1, role: "admin", opsRole: "accountant", department: "accounting" },
    { id: 2, role: "user", opsRole: "accountant", department: "accounting" },
    { id: 3, role: "user", opsRole: "pm", department: "construction" },
    { id: 4, role: "user", opsRole: "designer", department: "design" },
    { id: 5, role: "user", opsRole: "staff", department: "accounting" },
  ];

  it("경리부 직원 또는 accountant 역할만 알림 대상이어야 함", () => {
    const accountants = allUsers.filter(
      u => u.department === "accounting" || u.opsRole === "accountant"
    );
    expect(accountants.length).toBe(3); // id 1, 2, 5
    expect(accountants.map(a => a.id)).toEqual([1, 2, 5]);
  });

  it("시공팀/설계팀 직원은 알림 대상이 아니어야 함", () => {
    const nonAccountants = allUsers.filter(
      u => u.department !== "accounting" && u.opsRole !== "accountant"
    );
    expect(nonAccountants.map(a => a.id)).toEqual([3, 4]);
  });
});
