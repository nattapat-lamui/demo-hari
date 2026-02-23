export interface EmployeeLeaveQuota {
    id: string;
    employeeId: string;
    leaveType: string;
    total: number;
    createdAt: string;
    updatedAt: string;
}

export interface EffectiveLeaveQuota {
    type: string;
    total: number;
    isOverride: boolean;
    defaultTotal: number;
}

export interface UpsertLeaveQuotaDTO {
    leaveType: string;
    total: number;
}
