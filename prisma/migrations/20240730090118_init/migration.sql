-- CreateTable
CREATE TABLE "Loan" (
    "id" SERIAL NOT NULL,
    "loanName" TEXT NOT NULL,
    "loanAmount" DOUBLE PRECISION NOT NULL,
    "annualInterestRate" DOUBLE PRECISION NOT NULL,
    "emiAmount" DOUBLE PRECISION,
    "loanStartDate" TIMESTAMP(3),

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);
