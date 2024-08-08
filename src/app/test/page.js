// src/app/combined/page.jsx

'use client';

import { useState, useEffect } from 'react';

const calculateAmortization = (loan) => {
    const Schedule = [];
    const monthlyInterestRate = parseFloat(loan.annualInterestRate) / 12 / 100;
    let remainingBalance = parseFloat(loan.loanAmount);
    const minimumPay = parseFloat(loan.minimumPay);
    const emiAmount = parseFloat(loan.emiAmount);
    let transactionDate = new Date(loan.loanStartDate);

    let installmentNumber = 1;
    transactionDate.setMonth(transactionDate.getMonth() + 1);

    while (remainingBalance > minimumPay) {
        const interest = remainingBalance * monthlyInterestRate;
        const principal = +minimumPay - interest;
        remainingBalance -= principal;

        Schedule.push({
            installment: installmentNumber,
            date: transactionDate.toISOString().split('T')[0],
            principalPart: principal.toFixed(2),
            interestPart: interest.toFixed(2),
            emiToPay: emiAmount.toFixed(2),
            balance: remainingBalance.toFixed(2),
            loanName: loan.loanName,
            minimumPay: loan.minimumPay || 0,
            annualInterestRate: loan.annualInterestRate
        });

        transactionDate.setMonth(transactionDate.getMonth() + 1);
        installmentNumber++;
    }

    if (remainingBalance > 0) {
        const interest = remainingBalance * monthlyInterestRate;
        const principal = remainingBalance;
        remainingBalance = 0;

        Schedule.push({
            installment: installmentNumber,
            date: transactionDate.toISOString().split('T')[0],
            principalPart: principal.toFixed(2),
            interestPart: interest.toFixed(2),
            emiToPay: (principal + interest).toFixed(2),
            balance: remainingBalance.toFixed(2),
            loanName: loan.loanName,
            minimumPay: (principal + interest).toFixed(2) || 0,
            annualInterestRate: loan.annualInterestRate
        });
    }

    return Schedule;
};

const sortByDate = (entries) => {
    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
};

const groupByMonth = (entries) => {
    return entries.reduce((groups, entry) => {
        const monthYear = new Date(entry.date).toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[monthYear]) {
            groups[monthYear] = [];
        }
        groups[monthYear].push(entry);
        return groups;
    }, {});
};

const findHighestInterestLoans = (groupedEntries) => {
    const highestLoans = {};

    Object.keys(groupedEntries).forEach(monthYear => {
        const entries = groupedEntries[monthYear];
        const highestLoan = entries.reduce(
            (max, entry) => {
                if (entry.snowball) return max;
                const interestRate = parseFloat(entry.annualInterestRate || 0);
                return interestRate > parseFloat(max.annualInterestRate || 0) ? entry : max;
            },
            entries[0]
        );
        highestLoans[monthYear] = highestLoan;
    });

    return highestLoans;
};

const CombinedAmortizationPage = () => {
    const [loans, setLoans] = useState([]);
    const [finalData, setFinalData] = useState([]);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [budgetComparison, setBudgetComparison] = useState({});

    useEffect(() => {
        const savedBudget = localStorage.getItem('monthlyBudget');
        if (savedBudget) {
            setMonthlyBudget(parseFloat(savedBudget));
        }
    }, []);

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const response = await fetch('/api/loans');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const result = await response.json();
                setLoans(result.data);

                let preData = [];

                result.data.forEach(loan => {
                    const creditAmount = parseFloat(loan.loanAmount);
                    const principalPart = 0 - creditAmount;

                    preData.push({
                        date: loan.loanStartDate.split('T')[0],
                        description: `New Loan: ${loan.loanName} Start`,
                        principalpaid: principalPart,
                        emiToPay: 0,
                        interest: 0,
                        balance: creditAmount,
                        minimumPay: 0,
                        annualInterestRate: loan.annualInterestRate
                    });

                    const amortizationSchedule = calculateAmortization(loan);
                    amortizationSchedule.forEach(transaction => {
                        preData.push({
                            date: transaction.date,
                            description: `${loan.loanName} EMI`,
                            principalpaid: parseFloat(transaction.principalPart),
                            emiToPay: parseFloat(transaction.emiToPay),
                            interest: parseFloat(transaction.interestPart),
                            balance: parseFloat(transaction.balance),
                            minimumPay: parseFloat(transaction.minimumPay),
                            annualInterestRate: loan.annualInterestRate
                        });
                    });
                });

                const groupedEntries = groupByMonth(preData);
                const highestLoans = findHighestInterestLoans(groupedEntries);

                preData = preData.map(entry => {
                    const monthYear = new Date(entry.date).toLocaleString('default', { month: 'long', year: 'numeric' });
                    return {
                        ...entry,
                        snowball: highestLoans[monthYear] && entry.description.includes(highestLoans[monthYear].description) ? 'I am High' : ''
                    };
                });

                preData = sortByDate(preData);

                let totalLoans = 0;
                const data = preData.map(transaction => {
                    totalLoans -= transaction.principalpaid;
                    return {
                        ...transaction,
                        totalLoans: totalLoans.toFixed(2)
                    };
                });

                const openingDate = data.length > 0 ? data[0].date : '';
                const opening = [
                    { date: openingDate, description: 'Opening Balance', principalpaid: 0, interest: 0, emiToPay: 0, balance: 0, totalLoans: '0.00', minimumPay: 0 }
                ];

                setFinalData([...opening, ...data]);

                const monthlyTotals = {};
                preData.forEach(entry => {
                    const month = new Date(entry.date).toLocaleString('default', { month: 'long', year: 'numeric' });
                    if (!monthlyTotals[month]) {
                        monthlyTotals[month] = 0;
                    }
                    monthlyTotals[month] += entry.minimumPay;
                });

                console.log('Monthly Totals:', monthlyTotals);

                const budgetComp = {};
                Object.keys(monthlyTotals).forEach(month => {
                    budgetComp[month] = {
                        monthlyTotal: monthlyTotals[month],
                        difference: monthlyBudget - monthlyTotals[month]
                    };
                });

                setBudgetComparison(budgetComp);

                console.log('monthlyBudget:', monthlyBudget);

            } catch (error) {
                console.error('Failed to fetch loans:', error);
            }
        };

        if (monthlyBudget !== 0) {
            fetchLoans();
        }

    }, [monthlyBudget]);

    const getMonthClass = (date) => {
        const currentDate = new Date();
        const entryDate = new Date(date);
        const month = entryDate.getMonth();
        const year = entryDate.getFullYear();

        const colors = [
            'bg-red-200', 'bg-cyan-200',
            'bg-orange-200', 'bg-blue-200',
            'bg-yellow-200', 'bg-purple-200',
            'bg-green-200', 'bg-pink-200',
            'bg-sky-200', 'bg-rose-200',
            'bg-indigo-200', 'bg-lime-200'
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
            <h1 className="text-2xl font-bold mb-4">Monthly Budget: {monthlyBudget}</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border-b">Sl No</th>
                            <th className="px-4 py-2 border-b">Date</th>
                            <th className="px-4 py-2 border-b">Loan Name</th>
                            <th className="px-4 py-2 border-b">Principal Paid</th>
                            <th className="px-4 py-2 border-b">Interest</th>
                            <th className="px-4 py-2 border-b">EMI to Pay</th>
                            <th className="px-4 py-2 border-b">Minimum Pay</th>
                            <th className="px-4 py-2 border-b">Snowball</th> {/* New Column */}
                            <th className="px-4 py-2 border-b">Balance</th>
                            <th className="px-4 py-2 border-b">Total Loans</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finalData.map((transaction, index) => (
                            <tr key={index} className={getMonthClass(transaction.date)}>
                                <td className="px-4 py-2 border-b text-center">{index + 1}</td>
                                <td className="px-4 py-2 border-b">{transaction.date}</td>
                                <td className="px-4 py-2 border-b">{transaction.description}</td>
                                <td className="px-4 py-2 border-b text-right">{transaction.principalpaid.toFixed(2)}</td>
                                <td className="px-4 py-2 border-b text-right">{transaction.interest.toFixed(2)}</td>
                                <td className="px-4 py-2 border-b text-right">{transaction.emiToPay.toFixed(2)}</td>
                                <td className="px-4 py-2 border-b text-right">{transaction.minimumPay.toFixed(2)}</td>
                                <td className="px-4 py-2 border-b text-center">{transaction.snowball}</td> {/* New Column */}
                                <td className="px-4 py-2 border-b text-right">{transaction.balance.toFixed(2)}</td>
                                <td className="px-4 py-2 border-b text-right">{transaction.totalLoans}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4">
                <h2 className="text-xl font-bold">Budget Comparison</h2>
                <ul>
                    {Object.keys(budgetComparison).map(month => (
                        <li key={month}>
                            {month}: Total Pay {budgetComparison[month].monthlyTotal.toFixed(2)}, Difference: {budgetComparison[month].difference.toFixed(2)}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CombinedAmortizationPage;
