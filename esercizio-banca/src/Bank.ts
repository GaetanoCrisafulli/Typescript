import {Account} from './Account'
import {Transaction} from './Transaction'
export class Bank {
    constructor(public bankId: number, public bankName: string, public commissionFee: number, public bankBudget: number = 0 , public bankClients:Account [] = [], public transactionList:Transaction[] = []){}
}