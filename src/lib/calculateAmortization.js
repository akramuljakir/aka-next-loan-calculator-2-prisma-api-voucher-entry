const calculateAmortization = (loans, budget) => {
    if (!loans.length) {
        return [];
    }

    console.log('Initial Loans:', loans);

    const schedule = [];
    let remainingBudget = budget;

    loans.sort((a, b) => new Date(a.loanStartDate) - new Date(b.loanStartDate)); // Sort loans by start date

    const calculateMonthlyInterest = (loan) => {
        const monthlyInterestRate = parseFloat(loan.annualInterestRate) / 12 / 100;
        return loan.loanAmount * monthlyInterestRate;
    };

    const loanTransactionDates = loans.map(loan => new Date(loan.loanStartDate));

    const getMonthYearKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}`;

    let currentMonth = new Date(Math.min(...loanTransactionDates.map(date => date.getTime()))); // Start from the earliest loan date

    // Track which loans have already started to prevent adding multiple "New Loan Start" entries
    const loansStarted = new Set();

    while (remainingBudget > 0) {
        let totalMonthlyPayment = 0;

        // Filter loans that have started by the current month
        const loansInMonth = loans.map((loan, index) => {
            const loanDate = loanTransactionDates[index];
            if (
                loanDate.getFullYear() === currentMonth.getFullYear() &&
                loanDate.getMonth() === currentMonth.getMonth() &&
                !loansStarted.has(loan.id)
            ) {
                // Add initial loan entry to the schedule
                schedule.push({
                    date: loan.loanStartDate.split('T')[0],
                    loanName: `New Loan: ${loan.loanName} Start`,
                    minimumPay: '',
                    interestPart: '',
                    principalPart: 0 - loan.loanAmount.toFixed(2),
                    balance: loan.loanAmount.toFixed(2),
                    totalMonthlyPayment: '',
                    remainingBudget: remainingBudget.toFixed(2),
                });

                loansStarted.add(loan.id); // Mark this loan as started

                return { loan, index };
            } else if (loanDate <= currentMonth && loan.loanAmount > 0) {
                // } else if (loanDate <= currentMonth) {

                // console.log(`Loan ${loan.loanName} started on ${loan.loanStartDate} and is in progress ${loan.loanAmount}`);

                return { loan, index }; // Include loans already started but not fully paid off
            }
            return null;
        }).filter(item => item !== null);

        console.log(`Loans for Month ${getMonthYearKey(currentMonth)}:`, loansInMonth);

        if (loansInMonth.length > 0) {
            let totalMinimumPay = 0;
            loansInMonth.forEach(({ loan, index }) => {
                if (loan.loanAmount > 0) {
                    const interest = calculateMonthlyInterest(loan);
                    const minimumPay = parseFloat(loan.minimumPay);
                    const principal = Math.min(minimumPay - interest, loan.loanAmount);

                    totalMinimumPay += (principal + interest);
                }
            });

            // console.log(` Month: ${getMonthYearKey(currentMonth)}, Total Minimum Pay: ${totalMinimumPay}`);

            if (remainingBudget >= totalMinimumPay) {
                // if (remainingBudget > 0) {

                loansInMonth.forEach(({ loan, index }) => {
                    if (loan.loanAmount > 0) {
                        const interest = calculateMonthlyInterest(loan);
                        const minimumPay = parseFloat(loan.minimumPay);
                        const principal = Math.min(minimumPay - interest, loan.loanAmount);

                        loan.loanAmount -= principal;
                        remainingBudget -= (principal + interest);
                        totalMonthlyPayment += (principal + interest);

                        schedule.push({
                            date: loanTransactionDates[index].toISOString().split('T')[0],
                            loanName: loan.loanName,
                            principalPart: principal.toFixed(2),
                            interestPart: interest.toFixed(2),
                            minimumPay: (principal + interest).toFixed(2),
                            balance: loan.loanAmount.toFixed(2),
                            totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
                            remainingBudget: remainingBudget.toFixed(2),
                        });
                    }
                });
            } else {
                break;
            }

            if (remainingBudget > 0) {
                loansInMonth.sort((a, b) => parseFloat(b.loan.annualInterestRate) - parseFloat(a.loan.annualInterestRate));
                for (const { loan, index } of loansInMonth) {
                    if (loan.loanAmount > 0 && remainingBudget > 0) {
                        const extraPayment = Math.min(remainingBudget, loan.loanAmount);

                        loan.loanAmount -= extraPayment;
                        remainingBudget -= extraPayment;
                        totalMonthlyPayment += extraPayment;

                        schedule.push({
                            date: loanTransactionDates[index].toISOString().split('T')[0],
                            loanName: loan.loanName,
                            principalPart: extraPayment.toFixed(2),
                            interestPart: '',
                            minimumPay: '',
                            snowBall: extraPayment.toFixed(2),
                            balance: loan.loanAmount.toFixed(2),
                            totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
                            remainingBudget: remainingBudget.toFixed(2),
                        });

                        break;
                    }
                }
            }

            loansInMonth.forEach(({ index }) => {
                loanTransactionDates[index].setMonth(loanTransactionDates[index].getMonth() + 1);
            });
        }

        currentMonth.setMonth(currentMonth.getMonth() + 1); // Move to the next month

        // Check if any loan has a balance greater than 0
        const hasOutstandingLoan = loans.some(loan => loan.loanAmount > 0);
        if (!hasOutstandingLoan) {
            break;
        }


        // Reset remaining budget for the next month
        remainingBudget = budget;
    }

    schedule.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log('Final Schedule:', schedule);

    return schedule;
};

export default calculateAmortization;