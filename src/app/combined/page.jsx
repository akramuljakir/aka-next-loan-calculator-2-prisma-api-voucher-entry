//src/app/combined/page.jsx

'use client';

import { useState, useEffect } from 'react';
import calculateAmortization from '@/lib/calculateAmortization';



const Page = () => {

    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [loan, setLoan] = useState([]);
    const [finalData, setFinalData] = useState([]);

    useEffect(() => {
        const savedBudget = localStorage.getItem('monthlyBudget');
        if (savedBudget) {
            setMonthlyBudget(parseFloat(savedBudget));
        }
    }, []);

    useEffect(() => {
        const fetchLoans = async () => {
            const response = await fetch('/api/loans');
            const result = await response.json();
            setLoan(result.data);
        }

        if (monthlyBudget !== 0) {
            fetchLoans();
        }

    }, [monthlyBudget]);

    useEffect(() => {
        const schedule = calculateAmortization(loan, monthlyBudget);

        let remainingBalance = 0;

        const finalData = schedule.map(item => {

            let principal = parseFloat(item.principalPart);


            remainingBalance = remainingBalance - principal;
            console.log(`Remaining Balance: ${remainingBalance}`);

            return {
                ...item,
                remainingBalance: remainingBalance.toFixed(2)
            }
        });

        setFinalData(finalData);
        console.table(finalData);

    }, [monthlyBudget, loan]);


    const getMonthClass = (date) => {
        const currentDate = new Date();
        const entryDate = new Date(date);
        const month = entryDate.getMonth();
        const year = entryDate.getFullYear();

        const colors = [
            'bg-red-200', 'bg-cyan-200',   // January & February
            'bg-orange-200', 'bg-blue-200', // March & April
            'bg-yellow-200', 'bg-purple-200', // May & June
            'bg-green-200', 'bg-pink-200',   // July & August
            'bg-sky-200', 'bg-rose-200',    // September & October
            'bg-indigo-200', 'bg-lime-200'   // November & December

        ];
        let classNames = colors[month % colors.length];

        if (month === currentDate.getMonth() && year === currentDate.getFullYear()) {
            classNames += ' font-black';
        }

        return classNames;
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">All Loans Amortization Schedule</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border-b">Sl No</th>
                            <th className="px-4 py-2 border-b">Date</th>
                            <th className="px-4 py-2 border-b">Loan Name</th>
                            <th className="px-4 py-2 border-b">Principal Part</th>
                            <th className="px-4 py-2 border-b">Interest Part</th>
                            <th className="px-4 py-2 border-b">Payments </th>
                            <th className="px-4 py-2 border-b">Loan Balance</th>
                            <th className="px-4 py-2 border-b">Total Loans</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finalData.map((payment, index) => (
                            <tr key={index} className={`${getMonthClass(payment.date)}`} >
                                <td className="px-4 py-2 border-b">{index + 1}</td>
                                <td className="px-4 py-2 border-b">{payment.date}</td>
                                <td className="px-4 py-2 border-b">{payment.loanName}</td>
                                <td className="px-4 py-2 border-b">{payment.principalPart}</td>
                                <td className="px-4 py-2 border-b">{payment.interestPart}</td>
                                <td className="px-4 py-2 border-b">{payment.minimumPay}</td>
                                <td className="px-4 py-2 border-b">{payment.balance}</td>
                                <td className="px-4 py-2 border-b">{(Number(payment.remainingBalance) < 0 ? 0 : payment.remainingBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default Page;