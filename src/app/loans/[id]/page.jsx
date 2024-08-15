'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';  // Import useParams from next/navigation
import calculateAmortization from '@/lib/calculateAmortization';

const Page = () => {
    const { id } = useParams();  // Get the loanId from the URL
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [loans, setLoans] = useState([]);
    const [finalData, setFinalData] = useState([]);
    const [selectedLoan, setSelectedLoan] = useState('');  // State for filtering by loan name

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
            setLoans(result.data);
        };

        if (monthlyBudget !== 0) {
            fetchLoans();
        }
    }, [monthlyBudget]);

    useEffect(() => {
        const schedule = calculateAmortization(loans, monthlyBudget);
        let remainingBalance = 0;

        const finalData = schedule.map(item => {
            let principal = parseFloat(item.principalPart);
            remainingBalance = remainingBalance - principal;
            console.log(`Remaining Balance: ${remainingBalance}`);

            return {
                ...item,
                remainingBalance: remainingBalance.toFixed(2)
            };
        });

        setFinalData(finalData);
        console.table(finalData);
    }, [monthlyBudget, loans]);

    // Preselect a loan based on the id from useParams
    useEffect(() => {
        if (id && loans.length > 0) {
            const loan = loans.find((loanItem) => loanItem.id === parseInt(id));
            if (loan) {
                setSelectedLoan(loan.loanName);  // Pre-select the loan
            }
        }
    }, [loans, id]);

    // Filter finalData based on selected loan
    const filteredData = selectedLoan
        ? finalData.filter(item => item.loanName === selectedLoan)  // Filter based on selected loan
        : finalData;  // If no loan is selected, show all data

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

    // Utility function to format date to '12-Aug-24' format
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });
        const year = date.getFullYear().toString().slice(-2);  // Get last two digits of the year
        return `${day}-${month}-${year}`;
    };

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4">
                <label htmlFor="loanFilter" className="block text-sm font-medium text-gray-700">Filter by Loan Name:</label>
                <select
                    id="loanFilter"
                    className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={selectedLoan}
                    onChange={(e) => setSelectedLoan(e.target.value)}  // Update selected loan
                >
                    <option value="">All Loans</option>
                    {loans.map((loanItem, index) => (
                        <option key={index} value={loanItem.loanName}>
                            {loanItem.loanName}
                        </option>
                    ))}
                </select>
            </div>

            <h1 className="text-2xl font-bold mb-4">All Loans Amortization Schedule</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border-b">Sl No</th>
                            <th className="px-4 py-2 border-b">Date</th>
                            <th className="px-4 py-2 border-b">Loan Name</th>
                            <th className="px-4 py-2 border-b">Minimum Pay</th>
                            <th className="px-4 py-2 border-b">Interest</th>
                            <th className="px-4 py-2 border-b">Snow Ball</th>
                            <th className="px-4 py-2 border-b">Principal</th>
                            <th className="px-4 py-2 border-b">Loan Balance</th>
                            <th className="px-4 py-2 border-b">Remaining Loans</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((payment, index) => (
                            <tr key={index} className={`${getMonthClass(payment.date)}`}>
                                <td className="px-4 py-2 border-b">{index + 1}</td>
                                <td className="px-4 py-2 border-b">{formatDate(payment.date)}</td>
                                <td className="px-4 py-2 border-b">{payment.loanName}</td>
                                <td className="px-4 py-2 border-b">{payment.minimumPay}</td>
                                <td className="px-4 py-2 border-b">{payment.interestPart}</td>
                                <td className="px-4 py-2 border-b">{payment.snowBall}</td>
                                <td className="px-4 py-2 border-b">{payment.principalPart}</td>
                                <td className="px-4 py-2 border-b">{payment.balance}</td>
                                <td className="px-4 py-2 border-b">{(Number(payment.remainingBalance) < 0 ? 0 : payment.remainingBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Page;
