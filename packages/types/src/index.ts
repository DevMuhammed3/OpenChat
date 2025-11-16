export type User = {
    id: number;
    email: string;
    name?: string | null;
    username?: string | null;
    createdAt?: string;
};
export type AuthResponse = {
    user: User;
    token: string;
};
export type Message = {
    id?: string;
    text: string;
    senderId?: number;
    createdAt?: string;
};
export type AuthPayload = {
    userId: number;
};
//# sourceMappingURL=index.d.ts.map