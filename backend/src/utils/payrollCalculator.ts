interface PayrollInput {
  basicSalary: number;
  hra: number;
  travelAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;
  bonus: number;
  otherDeductions: number;
  pfEmployeePercent: number;
  pfEmployerPercent: number;
  esiEmployeePercent: number;
  esiEmployerPercent: number;
  tdsPercent: number;
  workingDays: number;
  presentDays: number;
}

interface PayrollResult {
  grossSalary: number;
  lossOfPay: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  tds: number;
  totalDeductions: number;
  netSalary: number;
}

const roundToTwo = (num: number): number => {
  return Math.round(num * 100) / 100;
};

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const dailyRate = input.basicSalary / input.workingDays;

  const lossOfPay =
    input.presentDays < input.workingDays
      ? roundToTwo(dailyRate * (input.workingDays - input.presentDays))
      : 0;

  const grossSalary = roundToTwo(
    input.basicSalary +
      input.hra +
      input.travelAllowance +
      input.medicalAllowance +
      input.otherAllowances +
      input.bonus -
      lossOfPay
  );

  const pfEmployee = roundToTwo(input.basicSalary * (input.pfEmployeePercent / 100));
  const pfEmployer = roundToTwo(input.basicSalary * (input.pfEmployerPercent / 100));

  const esiEmployee =
    grossSalary <= 21000
      ? roundToTwo(grossSalary * (input.esiEmployeePercent / 100))
      : 0;
  const esiEmployer =
    grossSalary <= 21000
      ? roundToTwo(grossSalary * (input.esiEmployerPercent / 100))
      : 0;

  const tds = roundToTwo(grossSalary * (input.tdsPercent / 100));

  const totalDeductions = roundToTwo(
    pfEmployee + esiEmployee + tds + input.otherDeductions
  );

  const netSalary = roundToTwo(grossSalary - totalDeductions);

  return {
    grossSalary,
    lossOfPay,
    pfEmployee,
    pfEmployer,
    esiEmployee,
    esiEmployer,
    tds,
    totalDeductions,
    netSalary,
  };
}
