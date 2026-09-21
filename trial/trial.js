// Trang tu phuc vu (khong dang nhap) - goi cross-origin sang backend cua tool cap license.
// Xem asoft-license repo, ASoft.LicenseTool.Api/Program.cs, endpoint POST /api/keygen/trial.
const TRIAL_API_URL = "https://license.ividlab.com/api/keygen/trial";

const form = document.getElementById("trial-form");
const productKeyEl = document.getElementById("product-key");
const emailEl = document.getElementById("email");
const productOverrideEl = document.getElementById("product-override");
const submitBtn = document.getElementById("submit-btn");
const errEl = document.getElementById("form-err");
const resultBox = document.getElementById("result");
const resultProductEl = document.getElementById("result-product");
const resultKeyEl = document.getElementById("result-key");
const copyBtn = document.getElementById("copy-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errEl.textContent = "";
  resultBox.style.display = "none";
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang xử lý...";

  try {
    const res = await fetch(TRIAL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productKeyRaw: productKeyEl.value.trim(),
        email: emailEl.value.trim(),
        productOverride: productOverrideEl.value || null,
      }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(body?.error || `${res.status} ${res.statusText}`);
    }

    resultProductEl.textContent = body.product;
    resultKeyEl.value = body.activeKeyText;
    resultBox.style.display = "block";
    form.style.display = "none";
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Nhận key dùng thử";
  }
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(resultKeyEl.value);
  copyBtn.textContent = "Đã copy!";
  setTimeout(() => { copyBtn.textContent = "Copy Active Key"; }, 1500);
});
