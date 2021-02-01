export interface Transaction{
    transactionId: number;
    userId: number;
    transactionType: "sent" | "received";
    howMuch: number;
}