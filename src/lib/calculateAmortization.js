
const calculateAmortization = (loan) => {
    const Schedule = [];
    const monthlyInterestRate = parseFloat(loan.annualInterestRate) / 12 / 100;
    let remainingBalance = parseFloat(loan.loanAmount);
    const emiAmount = parseFloat(loan.emiAmount);
    let transactionDate = new Date(loan.loanStartDate);

    let installmentNumber = 1;
    transactionDate.setMonth(transactionDate.getMonth() + 1);

    while (remainingBalance > emiAmount) {
        const interest = remainingBalance * monthlyInterestRate;
        const principal = emiAmount - interest;
        remainingBalance -= principal;

        Schedule.push({
            installment: installmentNumber,
            date: transactionDate.toISOString().split('T')[0],
            principalPart: principal.toFixed(2),
            interestPart: interest.toFixed(2),
            emiToPay: (principal + interest).toFixed(2),
            balance: remainingBalance.toFixed(2),
            loanName: loan.loanName
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
            loanName: loan.loanName
        });
    }

    return Schedule;
};

export default calculateAmortization;