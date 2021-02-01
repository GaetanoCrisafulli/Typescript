import express, {Request, Response} from 'express';
const app = express();
//import banks  from './banks.json';
import {Bank} from './Bank';
import {Account} from './Account';
import bodyparser from 'body-parser';
import fs from 'fs';

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
const port = 3001;
const path = process.cwd() + '\\resources\\banks.json';


let banksList: Bank[];
readFile();


var addBank = ({body}: Request, res: Response) => {
    if(!banksList.find(item => item.bankName === body.bankName)){
        banksList.push(new Bank(banksList.length+1, body.bankName, body.commissionFee, body?.bankBudget, body?.bankClients));
        updateFile();
        res.status(200).json({message: "Bank Added."});
    }else{
        res.status(400).json({message: "A bank with this name already exists."});
    }
    
}


var addBankUser = ({params, body}: Request, res: Response) => {
    if(banksList.find(item => item.bankId == Number(params.bankId))){
        banksList.find(item => item.bankId == Number(params.bankId))?.bankClients.push(new Account(Number(params.bankId), body.userId, body.name, body.surname, body.balance))
        updateFile();
        res.status(200).json({message: "User added."});
    }else{
        res.status(400).json({message: "Bank not found."});
    }
}


var Transfer = ({body}: Request, res: Response) => {
    var senderBank = banksList.find(item => item.bankId === Number(body.senderBankId));
    var recipientBank = banksList.find(item => item.bankId === Number(body.recipientBankId));
    if(senderBank && recipientBank){
        var senderInfo = senderBank.bankClients.find(item => item.userId === Number(body.senderId));
        var recipientInfo = recipientBank.bankClients.find(item => item.userId === Number(body.recipientId));
        if(senderInfo && recipientInfo){
            if(senderBank.bankId === recipientBank.bankId){
                if(senderInfo.balance >= Number(body.sendedMoney)){
                    senderInfo.balance -= Number(body.sendedMoney);
                    recipientInfo.balance += Number(body.sendedMoney);
                    senderBank.transactionList.push({transactionId: senderBank.transactionList.length, userId: senderInfo.userId, transactionType: "sent", howMuch: body.sendedMoney});
                    recipientBank.transactionList.push({transactionId: recipientBank.transactionList.length, userId: recipientInfo.userId, transactionType: "received", howMuch: body.sendedMoney});
                    updateFile();
                    res.status(200).json({message: "Succesfull transfer.", sendedMoney: body.sendedMoney});
                }else{
                    res.status(400).json({message: "Not enough money."});
                }
            }else{
                if(senderInfo.balance >= (Number(body.sendedMoney) + senderBank.commissionFee)){
                    senderInfo.balance -= Number(body.sendedMoney) + senderBank.commissionFee;
                    recipientInfo.balance += Number(body.sendedMoney);
                    senderBank.bankBudget += senderBank.commissionFee;
                    senderBank.transactionList.push({transactionId: senderBank.transactionList.length, userId: senderInfo.userId, transactionType: "sent", howMuch: body.sendedMoney});
                    recipientBank.transactionList.push({transactionId: recipientBank.transactionList.length, userId: recipientInfo.userId, transactionType: "received", howMuch: body.sendedMoney});
                    updateFile();
                    res.json({message: "Succesfull transfer.", sendedMoney: body.sendedMoney + senderBank.commissionFee});
                }else{
                    res.status(400).json({message: "Not enough money."});
                }
            }
        }else{
            res.status(404).json({message: "Users not found."});
        }
    }else{
        res.status(404).json({message: "Banks not found."});
    }
}

var getUserTransactions = ({query}: Request, res: Response) =>{
    let userBank = banksList.find(item => item.bankId === Number(query.userBank));
    if(userBank){
        let userInfo = userBank.bankClients.find(item => item.userId === Number(query.userId));
        if(userInfo){
            let userTransactions = userBank.transactionList.filter(item => item.userId === Number(query.userId));
            if(userTransactions){
                res.status(200).json({userInfo, userTransactions});
            }else{
                res.status(400).json({message: "This user has no transaction."});
            }
        }else{
            res.status(404).json({message: "User not found."});
        }
    }else{
        res.status(404).json({message: "Bank not found."});
    }
}

function readFile () {
    let rawdata = fs.readFileSync(path);
    let banks = JSON.parse(rawdata.toString());
    banksList = banks.map(((value: any) => value));
}

function updateFile(): void {
    let data = JSON.stringify(banksList, null, 2);
    fs.writeFileSync(path, data);
}




app.get('/banks', (_, res) => res.status(200).json(banksList));
app.get('/banks/users/transactions', getUserTransactions)

app.post('/banks', addBank);
app.post('/banks/:bankId', addBankUser);

app.put('/banks/transfers', Transfer);

app.listen(port, () => console.log('Server is running.'));

