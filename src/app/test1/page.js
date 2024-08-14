"use client";

import React, { useState, useEffect } from 'react';

const LoanPaymentTable = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monthlyBudget, setMonthlyBudget] = useState(0);

    const getNextMonth = (date) => {
        let [year, month] = date.split('-').map(Number);
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
        return `${year}-${month.toString().padStart(2, '0')}-01`;
    };

    const applyPayments = (loans, monthlyBudget, startDate, months) => {
        let paymentHistory = [];
        let currentDate = startDate;

        for (let i = 0; i < months; i++) {
            let monthRecord = { Month: currentDate };
            let remainingBudget = monthlyBudget;

            loans.forEach(loan => {
                if (loan.loanAmount > 0) {
                    loan.loanAmount -= loan.minimumPay;
                    remainingBudget -= loan.minimumPay;
                    monthRecord[loan.loanName] = `Paid ₹${loan.minimumPay}, Remaining: ₹${loan.loanAmount}`;
                }
            });

            if (remainingBudget > 0) {
                loans.sort((a, b) => b.annualInterestRate - a.annualInterestRate);

                for (let loan of loans) {
                    if (loan.loanAmount > 0) {
                        let payment = Math.min(loan.loanAmount, remainingBudget);
                        loan.loanAmount -= payment;
                        monthRecord[loan.loanName] = `Paid ₹${loan.minimumPay + payment}, Remaining: ₹${loan.loanAmount}`;
                        remainingBudget -= payment;
                        break;
                    }
                }
            }

            paymentHistory.push(monthRecord);
            currentDate = getNextMonth(currentDate);
        }

        return paymentHistory;
    };

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
                    throw new Error(`Error fetching loans: ${response.statusText}`);
                }
                const result = await response.json();
                const loans = result.data;  // Access the data array from the response

                if (!loans || loans.length === 0) {
                    console.error('No loan data received');
                    return;
                }

                const paymentData = applyPayments(loans, monthlyBudget, "2024-01-01", 12);
                setPayments(paymentData);
            } catch (error) {
                console.error('Error fetching loan data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (monthlyBudget !== 0) {
            fetchLoans();
        }
    }, [monthlyBudget]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Loan Payment Schedule</h1>
            <table border="1" cellPadding="10">
                <thead>
                    <tr>
                        <th>Month</th>
                        {payments.length > 0 && Object.keys(payments[0]).filter(key => key !== 'Month').map((loanName, index) => (
                            <th key={index}>{loanName}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {payments.map((payment, index) => (
                        <tr key={index}>
                            <td>{payment.Month}</td>
                            {Object.keys(payment).filter(key => key !== 'Month').map((loanName, i) => (
                                <td key={i}>{payment[loanName]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LoanPaymentTable;
