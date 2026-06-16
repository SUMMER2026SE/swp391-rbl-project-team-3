const fs = require('fs');

const path = 'src/components/PatientPortal/BookAppointmentForm.jsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Remove import
content = content.replace(/import \{ useVoucherController \} from '\.\.\/\.\.\/controllers\/useVoucherController';\r?\n/, "");

// 2. Remove VoucherBanner
content = content.replace(/\/\/ ─── Voucher Banner ──[\s\S]*?\/\/ ─── Price Summary ──/, '// ─── Price Summary ──');

// 3. Rewrite PriceSummary
const priceSummaryReplacement = `function PriceSummary({ originalAmount }) {
  if (!originalAmount) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Giá dịch vụ</span>
          <span className="italic text-slate-500 text-[11px]">(Được xác định theo bác sĩ)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
      <div className="flex justify-between text-xs font-semibold text-slate-600">
        <span>Giá dịch vụ</span>
        <span>{formatVND(originalAmount)}</span>
      </div>
    </div>
  );
}`;
content = content.replace(/function PriceSummary\([\s\S]*?\n\}/, priceSummaryReplacement);

// 4. Remove useVoucherController hook
content = content.replace(/const \{ getAutoApplicable, incrementUsage \} = useVoucherController\(\);\r?\n\s*/, "");

// 5. Remove Auto-apply voucher logic
const autoApplyRegex = /\/\/ ── Auto-apply voucher ──[\s\S]*?const finalFee[\s\S]*?;/;
content = content.replace(autoApplyRegex, `// ── Service Fee ──\n  const originalAmount = finalDoctorData ? parsePriceToNumber(finalDoctorData.consultationFee) : 0;\n  const finalFee = finalDoctorData?.consultationFee || '300,000 VNĐ';`);

// 6. Remove voucher properties from bookingPayload
content = content.replace(/\s*voucherId:.*?,/, "");
content = content.replace(/\s*voucherCode:.*?,/, "");
content = content.replace(/\s*discount:.*?,/, "");
content = content.replace(/Khách hàng đặt lịch khám qua cổng Portal\.\$\{.*?\}/, "Khách hàng đặt lịch khám qua cổng Portal.");
content = content.replace(/Khách vãng lai đăng ký qua website\.\$\{.*?\}/, "Khách vãng lai đăng ký qua website.");

// 7. Remove incrementUsage
content = content.replace(/\s*if \(bestVoucher\) \{\r?\n\s*incrementUsage\(bestVoucher\.voucher\.id\);\r?\n\s*\}/, "");

// 8. Remove VoucherBanner from JSX
content = content.replace(/\{\/\* ── Auto-apply Voucher Banner ── \*\/\}[\s\S]*?\{\/\* ── No voucher info ── \*\/\}[\s\S]*?(\{\/\* ── Price Summary ── \*\/})/, "$1");

// 9. Update PriceSummary props
content = content.replace(/<PriceSummary[\s\S]*?\/>/, "<PriceSummary originalAmount={originalAmount} />");

// 10. Remove voucher details from Success summary
content = content.replace(/\{bestVoucher && originalAmount > 0 \? \([\s\S]*?\) : \(/, "{(");

fs.writeFileSync(path, content);
console.log("Updated!");
