// src/app/combined/page.jsx

'use client';

import { useState, useEffect } from 'react';

const calculateAmortization = (loan) => {
    const Schedule = [];
    const monthlyInterestRate = parseFloat(loan.annualInterestRate) / 12 / 100;
    let remainingBalance = parseFloat(loan.loanAmount);
    const minimumPay = parseFloat(loan.minimumPay); //
    const emiAmount = parseFloat(loan.emiAmount);
    let transactionDate = new Date(loan.loanStartDate);
    console.log('minimumPay', minimumPay);

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
            minimumPay: loan.minimumPay || 0 // Ensure minimumPay is handled
        });

        transactionDate.setMonth(transactionDate.getMonth() + 1);
        installmentNumber++;
    }

    // Add the final payment where the balance becomes less than EMI
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
            minimumPay: (principal + interest).toFixed(2) || 0 // Ensure minimumPay is handled
        });
    }

    return Schedule;
};


// Utility function to sort ledger entries by date
const sortByDate = (entries) => {
    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
};

const CombinedAmortizationPage = () => {
    const [loans, setLoans] = useState([]);
    const [finalData, setFinalData] = useState([]);
    const [monthlyBudget, setMonthlyBudget] = useState(0);

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const response = await fetch('/api/loans'); // Adjust the endpoint as needed
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const result = await response.json();
                setLoans(result.data);

                let preData = [];

                // Combine amortization schedules of all loans
                result.data.forEach(loan => {
                    const creditAmount = parseFloat(loan.loanAmount);
                    const principalPart = 0 - creditAmount;

                    // Add initial loan entry
                    preData.push({
                        date: loan.loanStartDate.split('T')[0],
                        description: `New Loan: ${loan.loanName} Start`,
                        principalpaid: principalPart,
                        emiToPay: 0,
                        interest: 0,
                        balance: creditAmount,
                        minimumPay: 0 // Ensure minimumPay is handled
                        // minimumPay: loan.minimumPay || 0 // Ensure minimumPay is handled
                    });

                    // Add amortization schedule entries
                    const amortizationSchedule = calculateAmortization(loan);
                    amortizationSchedule.forEach(transaction => {
                        preData.push({
                            date: transaction.date,
                            description: `${loan.loanName} EMI`,
                            principalpaid: parseFloat(transaction.principalPart),
                            emiToPay: parseFloat(transaction.emiToPay),
                            interest: parseFloat(transaction.interestPart),
                            balance: parseFloat(transaction.balance),
                            minimumPay: parseFloat(transaction.minimumPay), // Ensure minimumPay is handled
                        });
                    });
                });

                // Sort by date
                preData = sortByDate(preData);

                // Calculate combined balance and total loans
                let totalLoans = 0;
                const data = preData.map(transaction => {
                    totalLoans -= transaction.principalpaid;
                    return {
                        ...transaction,
                        totalLoans: totalLoans.toFixed(2)
                    };
                });

                // Find the oldest date in the data array
                const openingDate = data.length > 0 ? data[0].date : '';

                // Add opening balance entry
                const opening = [
                    { date: openingDate, description: 'Opening Balance', principalpaid: 0, interest: 0, emiToPay: 0, balance: 0, totalLoans: '0.00', minimumPay: 0 }
                ];

                // Add opening balance to the beginning of the data array
                setFinalData([...opening, ...data]);

            } catch (error) {
                console.error('Failed to fetch loans:', error);
            }
        };

        fetchLoans();
        const savedBudget = localStorage.getItem('monthlyBudget');
        if (savedBudget) {
            setMonthlyBudget(parseFloat(savedBudget));
        }

    }, []);

    console.log('MonthlyBudget', monthlyBudget);

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
            <h1 className="text-2xl font-bold mb-4">{monthlyBudget}</h1>
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
                            <th className="px-4 py-2 border-b">Minimum Pay</th> {/* New header */}
                            <th className="px-4 py-2 border-b">Loan Balance</th>
                            <th className="px-4 py-2 border-b">Total Loans</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finalData.map((payment, index) => (
                            <tr key={index} className={`${getMonthClass(payment.date)}`} >
                                <td className="px-4 py-2 border-b">{index + 1}</td>
                                <td className="px-4 py-2 border-b">{payment.date}</td>
                                <td className="px-4 py-2 border-b">{payment.description}</td>
                                <td className="px-4 py-2 border-b">{payment.principalpaid.toFixed(2)}</td>
                                <td className="px-4 py-2 border-b">{payment.interest.toFixed(2)}</td>
                                <td className="px-4 py-2 border-b">{payment.emiToPay.toFixed(2)}</td>
                                <td className="px-4 py-2 border-b">{payment.minimumPay.toFixed(2)}</td> {/* New data cell */}
                                <td className="px-4 py-2 border-b">{payment.balance.toFixed(2)}</td>
                                <td className="px-4 py-2 border-b">{payment.totalLoans}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CombinedAmortizationPage;
