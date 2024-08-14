const calculateAmortization = (loans, budget) => {
    if (!loans.length) {
        return [];
    }

    console.log('Initial Loans:', loans);

    const schedule = [];
    let remainingBudget = budget;

    // Sort loans by start date
    loans.sort((a, b) => new Date(a.loanStartDate) - new Date(b.loanStartDate));

    // Function to calculate monthly interest for a loan
    const calculateMonthlyInterest = (loan) => {
        const monthlyInterestRate = parseFloat(loan.annualInterestRate) / 12 / 100;
        return loan.loanAmount * monthlyInterestRate;
    };

    const loanTransactionDates = loans.map(loan => new Date(loan.loanStartDate));
    const getMonthYearKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}`;

    // Start from the earliest loan date
    let currentMonth = new Date(Math.min(...loanTransactionDates.map(date => date.getTime())));

    // Track loans that have started
    const loansStarted = new Set();

    while (remainingBudget > 0) {
        let totalMonthlyPayment = 0;

        // Filter loans that have started by the current month
        const loansInMonth = loans.map((loan, index) => {
            const loanDate = loanTransactionDates[index];

            // When the loan starts, add an entry, but defer the payment to the next month
            if (
                loanDate.getFullYear() === currentMonth.getFullYear() &&
                loanDate.getMonth() === currentMonth.getMonth() &&
                !loansStarted.has(loan.id)
            ) {
                // Add loan start entry
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

                // Defer first payment to next month
                loanTransactionDates[index].setMonth(loanTransactionDates[index].getMonth() + 1);
                return null;  // Skip payment for this month
            } else if (loanDate <= currentMonth && loan.loanAmount > 0) {
                return { loan, index };  // Loans already started but not fully paid off
            }
            return null;
        }).filter(item => item !== null);

        console.log(`Loans for Month ${getMonthYearKey(currentMonth)}:`, loansInMonth);

        if (loansInMonth.length > 0) {
            let totalMinimumPay = 0;

            // Calculate total minimum payment and apply payments
            loansInMonth.forEach(({ loan }) => {
                if (loan.loanAmount > 0) {
                    const interest = calculateMonthlyInterest(loan);
                    const minimumPay = parseFloat(loan.minimumPay);
                    const principal = Math.min(minimumPay - interest, loan.loanAmount);

                    totalMinimumPay += (principal + interest);
                }
            });

            // Deduct payments from the remaining budget if there's enough budget
            if (remainingBudget >= totalMinimumPay) {
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
                break;  // Stop if remaining budget is insufficient to cover total payments
            }

            // Apply extra payments if there’s remaining budget
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

                        break;  // Apply extra payment to one loan and move to the next month
                    }
                }
            }

            // Increment the month for each loan's next payment date
            loansInMonth.forEach(({ index }) => {
                loanTransactionDates[index].setMonth(loanTransactionDates[index].getMonth() + 1);
            });
        }

        // Move to the next month
        currentMonth.setMonth(currentMonth.getMonth() + 1);

        // Check if there are any outstanding loans
        const hasOutstandingLoan = loans.some(loan => loan.loanAmount > 0);
        if (!hasOutstandingLoan) {
            break;  // Stop if all loans are paid off
        }

        // Reset the remaining budget for the next month
        remainingBudget = budget;
    }

    schedule.sort((a, b) => new Date(a.date) - new Date(b.date));  // Sort schedule by date

    console.log('Final Schedule:', schedule);

    return schedule;
};

export default calculateAmortization;
