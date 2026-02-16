export interface User {
    userId: string;
    employeeId: string;
    email: string;
    name: string;
    role: 'HR_ADMIN' | 'EMPLOYEE';
    avatar?: string;
    jobTitle?: string;
    department?: string;
    bio?: string;
    phone?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface AuthResponse {
    token: string;           // backward compat alias = accessToken
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}
