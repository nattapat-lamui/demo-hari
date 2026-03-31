export interface Holiday {
    id: string;
    date: string;
    name: string;
    isRecurring: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateHolidayDTO {
    date: string;
    name: string;
    isRecurring?: boolean;
}

export interface UpdateHolidayDTO {
    date?: string;
    name?: string;
    isRecurring?: boolean;
}
