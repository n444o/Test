function showTab(tab) {
  document.getElementById('simpleForm').style.display = tab === 'simple' ? 'block' : 'none';
  document.getElementById('accurateForm').style.display = tab === 'accurate' ? 'block' : 'none';
  document.getElementById('tabSimple').classList.toggle('active', tab === 'simple');
  document.getElementById('tabAccurate').classList.toggle('active', tab === 'accurate');
}

// 扶養者追加
function addFuyo() {
  const container = document.getElementById("a_fuyoContainer");
  const inputs = container.querySelectorAll("input");
  if (inputs.length >= 5) return;
  const input = document.createElement("input");
  input.type = "number";
  input.className = "a_fuyoAge";
  input.placeholder = "例：22";
  input.min = "0";
  container.appendChild(input);
}

// 簡易版計算
function calcSimple() {
  const monthly = parseInt(document.getElementById("s_monthly").value) || 0;
  const bonus = parseInt(document.getElementById("s_bonus").value) || 0;
  const age = parseInt(document.getElementById("s_age").value) || 0;
  if (monthly === 0 || age === 0) {
    document.getElementById("s_result").textContent = "全項目を入力してください。";
    return;
  }
  const annualIncome = monthly * 12 + bonus;
  // 控除：給与所得控除＋基礎控除（簡易）＋社会保険料（簡易）
  const salaryDeduction = annualIncome * 0.2 + 440000;
  const baseDeduction = 480000;
  const taxable = Math.max(annualIncome - salaryDeduction - baseDeduction, 0);

  // 所得税（簡易）
  let incomeTax = taxable * 0.1;
  incomeTax *= 1.021;

  // 住民税（簡易）
  const juminzei = taxable * 0.1 + 5000;

  // 社会保険料
  const health = annualIncome * FIXED_HEALTH_RATE;
  const pension = annualIncome * PENSION_RATE;
  const emp = annualIncome * EMPLOYMENT_RATE;
  const care = (age >= 40 && age < 65) ? annualIncome * CARE_INSURANCE_RATE : 0;
  const social = health + pension + emp + care;

  const totalTax = incomeTax + juminzei + social;
  const netIncome = Math.floor(annualIncome - totalTax);

  document.getElementById("s_result").innerHTML =
    `<p>手取り年収：<strong>${netIncome.toLocaleString()}円</strong></p>`;
}

// 扶養控除ロジック（正確版）
function getFuyoDeduction(fuyoAges) {
  let total = 0;
  for (const age of fuyoAges) {
    if (age < 16) continue;
    else if (age <= 18) total += 380000;
    else if (age <= 22) total += 630000;
    else if (age <= 69) total += 380000;
    else total += 530000; // 70歳以上中央値
  }
  return total;
}

// 正確版計算
function calcAccurate() {
  const monthly = parseInt(document.getElementById("a_monthly").value) || 0;
  const bonus = parseInt(document.getElementById("a_bonus").value) || 0;
  const ageInput = document.getElementById("a_age").value;
  const age = ageInput === "" ? null : parseInt(ageInput);
  const pref = document.getElementById("a_pref").value;

  const fuyoInputs = document.querySelectorAll(".a_fuyoAge");
  const fuyoAges = Array.from(fuyoInputs)
    .map(el => parseInt(el.value))
    .filter(v => !isNaN(v) && v >= 1);

  if (monthly === 0 || age === null || pref === "default") {
    document.getElementById("a_result").textContent = "全項目を入力してください。";
    return;
  }
  const annualIncome = monthly * 12 + bonus;

  // 給与所得控除（国税庁式簡易）
  let salaryDeduction = 0;
  if (annualIncome <= 1800000) salaryDeduction = annualIncome * 0.4 - 100000;
  else if (annualIncome <= 3600000) salaryDeduction = annualIncome * 0.3 + 80000;
  else if (annualIncome <= 6600000) salaryDeduction = annualIncome * 0.2 + 440000;
  else if (annualIncome <= 8500000) salaryDeduction = annualIncome * 0.1 + 1100000;
  else salaryDeduction = 1950000;

  const baseDeduction = 480000;
  const fuyoDeduction = getFuyoDeduction(fuyoAges);
  const taxable = Math.max(annualIncome - salaryDeduction - baseDeduction - fuyoDeduction, 0);

  // 所得税
  let incomeTax = 0;
  if (taxable <= 1949000) incomeTax = taxable * 0.05;
  else if (taxable <= 3299000) incomeTax = taxable * 0.1 - 97500;
  else if (taxable <= 6949000) incomeTax = taxable * 0.2 - 427500;
  else if (taxable <= 8999000) incomeTax = taxable * 0.23 - 636000;
  else if (taxable <= 17999000) incomeTax = taxable * 0.33 - 1536000;
  else if (taxable <= 39999000) incomeTax = taxable * 0.4 - 2796000;
  else incomeTax = taxable * 0.45 - 4796000;
  incomeTax *= 1.021;

  // 住民税
  const juminzei = taxable * 0.1 + 5000;

  // 社会保険料（中央値ベース）
  const health = annualIncome * FIXED_HEALTH_RATE;
  const pension = annualIncome * PENSION_RATE;
  const emp = annualIncome * EMPLOYMENT_RATE;
  const care = (age !== null && age >= 40 && age < 65) ? annualIncome * CARE_INSURANCE_RATE : 0;
  const social = health + pension + emp + care;

  const totalTax = incomeTax + juminzei + social;
  const netIncome = Math.floor(annualIncome - totalTax);

  document.getElementById("a_result").innerHTML =
    `<p>年収（支給総額）：<strong>${annualIncome.toLocaleString()}円</strong></p>
     <p>所得税（復興税込）：${Math.round(incomeTax).toLocaleString()}円</p>
     <p>住民税：${Math.round(juminzei).toLocaleString()}円</p>
     <p>社会保険料：${Math.round(social).toLocaleString()}円</p>
     <p>→ <strong>手取り年収：${netIncome.toLocaleString()}円</strong></p>
     <p>（月平均手取り：約${Math.floor(netIncome/12).toLocaleString()}円）</p>`;
}