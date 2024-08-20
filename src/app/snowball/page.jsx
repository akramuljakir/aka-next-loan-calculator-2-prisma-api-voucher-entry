'use client';

import { useState, useEffect } from 'react';
import calculateAmortization from '@/lib/calculateAmortization';

const Page = () => {
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [loan, setLoan] = useState([]);
    const [finalData, setFinalData] = useState([]);
    const [selectedLoan, setSelectedLoan] = useState(''); // State for filtering by loan name

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
        };

        if (monthlyBudget !== 0) {
            fetchLoans();
        }
    }, [monthlyBudget]);

    useEffect(() => {
        if (loan.length === 0 || monthlyBudget === 0) return;

        const schedule = calculateAmortization(loan, monthlyBudget);

        let remainingBalance = 0;

        const finalData = schedule.map((item) => {
            let principal = parseFloat(item.principalPart);
            remainingBalance = remainingBalance - principal;
            return {
                ...item,
                remainingBalance: remainingBalance.toFixed(2),
            };
        });

        setFinalData(finalData);
    }, [monthlyBudget, loan]);

    // Function to reorganize loans by month with the newest remainingBalance value for each month
    function reorganizeLoansByMonth(loans) {
        const result = [];
        const allLoanNames = new Set(); // Track all unique loan names
        const balanceByMonth = {}; // To store the latest remainingBalance for each month

        loans.forEach((loan) => {
            const [year, month] = loan.date.split('-');
            const monthKey = `${year}-${month}`;
            const baseLoanName = loan.loanName.split(' ').slice(0, 2).join(' '); // E.g., "Home Loan"

            allLoanNames.add(baseLoanName); // Add loan name to the set

            // Track the newest remainingBalance for each month
            balanceByMonth[monthKey] = loan.remainingBalance;

            let existing = result.find((item) => item.yearMonth === monthKey);

            if (existing) {
                if (existing[baseLoanName]) {
                    existing[baseLoanName] += loan.principalPart;
                } else {
                    existing[baseLoanName] = loan.principalPart;
                }
            } else {
                const newEntry = {
                    yearMonth: monthKey,
                    [baseLoanName]: loan.principalPart,
                };
                result.push(newEntry);
            }
        });

        // Ensure all months have all loan names, defaulting to 0 if missing
        result.forEach((row) => {
            allLoanNames.forEach((loanName) => {
                if (!row[loanName]) {
                    row[loanName] = 0; // Default value if no data for this loan in the month
                }
                row[loanName] = parseFloat(row[loanName]).toFixed(2); // Format loan values to 2 decimal places
            });
            // Add the remainingBalance for the month (the latest one for the month) as a number
            const remainingBalance = parseFloat(balanceByMonth[row.yearMonth] || 0);
            row.remainingBalance = remainingBalance.toFixed(2);
        });

        return { result, allLoanNames };
    }

    const { result: Snowball, allLoanNames } = reorganizeLoansByMonth(finalData);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });
        const year = date.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
    };

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4">
                <label htmlFor="loanFilter" className="block text-sm font-medium text-gray-700">Filter by Loan Name:</label>
                <select
                    id="loanFilter"
                    className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none"
                    value={selectedLoan}
                    onChange={(e) => setSelectedLoan(e.target.value)}
                >
                    <option value="">All Loans</option>
                    {loan.map((loanItem, index) => (
                        <option key={index} value={loanItem.id}>
                            {loanItem.loanName}
                        </option>
                    ))}
                </select>
            </div>

            <h1 className="text-2xl font-bold mb-4">All Loans Amortization Schedule</h1>
            <div className="overflow-x-auto">
                {/* Amortization schedule table would go here */}
            </div>

            <h2 className="text-2xl font-bold mt-6">Reorganized Loan Data (Snowball)</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border-b">Year-Month</th>
                            {[...allLoanNames].map((loanName, index) => (
                                <th key={index} className="px-4 py-2 border-b">{loanName}</th>
                            ))}
                            <th className="px-4 py-2 border-b">Remaining Loans</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Snowball.map((row, index) => (
                            <tr key={index}>
                                <td className="px-4 py-2 border-b">{row.yearMonth}</td>
                                {[...allLoanNames].map((loanName, idx) => (
                                    <td key={idx} className="px-4 py-2 border-b">{parseFloat(row[loanName]).toFixed(2)}</td>
                                ))}
                                <td className="px-4 py-2 border-b">{parseFloat(row.remainingBalance).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Page;
