import React, { useState, useEffect } from 'react';

const Amortization = ({ loan, currentMonth }) => {
    const [amortizationSchedule, setAmortizationSchedule] = useState([]);

    useEffect(() => {
        if (loan) {
            calculation();
        }
    }, [loan]);

    const calculation = () => {
        const schedule = [];
        let remainingBalance = parseFloat(loan.loanAmount);
        const monthlyInterestRate = parseFloat(loan.annualInterestRate) / 12 / 100;
        const emiAmount = parseFloat(loan.emiAmount);
        let currentDate = new Date(loan.loanStartDate);
        let installmentNumber = 1;

        while (remainingBalance > emiAmount) {
            const interest = remainingBalance * monthlyInterestRate;
            const principal = emiAmount - interest;
            remainingBalance -= principal;

            schedule.push({
                installment: installmentNumber,
                date: currentDate.toISOString().split('T')[0],
                principalAmount: principal.toFixed(2),
                interest: interest.toFixed(2),
                emiToPay: emiAmount.toFixed(2),
                balance: remainingBalance.toFixed(2),
            });

            currentDate.setMonth(currentDate.getMonth() + 1);
            installmentNumber++;
        }

        // Add the final payment where the balance becomes less than EMI
        if (remainingBalance > 0) {
            const interest = remainingBalance * monthlyInterestRate;
            const principal = remainingBalance;
            remainingBalance = 0;

            schedule.push({
                installment: installmentNumber,
                date: currentDate.toISOString().split('T')[0],
                // principalAmount: (principal + interest).toFixed(2),
                principalAmount: (principal).toFixed(2),
                interest: interest.toFixed(2),
                emiToPay: (principal + interest).toFixed(2),
                balance: remainingBalance.toFixed(2),
            });
        }

        setAmortizationSchedule(schedule);
    };

    const isCurrentMonth = (date) => {
        const targetDate = new Date(date);
        const targetMonth = targetDate.toLocaleString('default', { month: 'long' });
        const targetYear = targetDate.getFullYear();

        const [currentMonthName, currentYear] = currentMonth.split(' ');
        return targetMonth === currentMonthName && targetYear === parseInt(currentYear);
    };

    if (!loan) {
        return <div>Loading...</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
                <thead>
                    <tr>
                        <th className="px-4 py-2 border-b w-10">Installment No</th>
                        <th className="px-4 py-2 border-b">Date</th>
                        <th className="px-4 py-2 border-b">Principal Amount</th>
                        <th className="px-4 py-2 border-b">Interest</th>
                        <th className="px-4 py-2 border-b">EMI to Pay</th>
                        <th className="px-4 py-2 border-b">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {amortizationSchedule.map((payment, index) => (
                        <tr key={index} className={isCurrentMonth(payment.date) ? 'bg-yellow-100' : ''}>
                            <td className="px-4 py-2 border-b">{payment.installment}</td>
                            <td className="px-4 py-2 border-b">{payment.date}</td>
                            <td className="px-4 py-2 border-b">{payment.principalAmount}</td>
                            <td className="px-4 py-2 border-b">{payment.interest}</td>
                            <td className="px-4 py-2 border-b">{payment.emiToPay}</td>
                            <td className="px-4 py-2 border-b">{payment.balance}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Amortization;
