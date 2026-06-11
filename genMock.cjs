const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'mockData.js');
const content = fs.readFileSync(filePath, 'utf-8');

const services = [
    { name: "Khám Da Liễu Tổng Quát", price: "300,000 VNĐ" },
    { name: "Soi Da AI Chuyên Sâu", price: "500,000 VNĐ" },
    { name: "Trị Liệu Laser Fractional CO2", price: "2,500,000 VNĐ" },
    { name: "Điều Trị Nám Chuyên Sâu", price: "1,800,000 VNĐ" },
    { name: "Peel Da Sinh Học", price: "800,000 VNĐ" },
    { name: "Tiêm Filler & Botox", price: "3,000,000 VNĐ" },
    { name: "Trị Mụn Chuyên Sâu", price: "600,000 VNĐ" }
];

const patients = [
    { id: "pat-01", name: "Lê Minh Khôi" },
    { id: "pat-02", name: "Trần Thị Hồng Nhung" },
    { id: "pat-03", name: "Phạm Đức Anh" },
    { id: "pat-04", name: "Nguyễn Hoàng Mai" },
    { id: "pat-05", name: "Võ Thanh Tùng" }
];

const doctors = [
    { id: "doc-01", name: "BS. CKII. Trần Văn A" },
    { id: "doc-02", name: "ThS. BS. Nguyễn Thị B" }
];

const apts = [];

let aptId = 1;

for(let m = 0; m <= 5; m++) {
    const numApts = Math.floor(Math.random() * 8) + 12; // 12 to 19 apts per month => total ~ 90 apts
    for(let i=0; i<numApts; i++) {
        const d = new Date(2026, m, Math.floor(Math.random()*28)+1);
        const p = patients[Math.floor(Math.random()*patients.length)];
        const doc = doctors[Math.floor(Math.random()*doctors.length)];
        
        let s;
        const rand = Math.random();
        if (rand < 0.25) s = services[0];
        else if (rand < 0.45) s = services[3];
        else if (rand < 0.65) s = services[1];
        else if (rand < 0.80) s = services[6];
        else if (rand < 0.90) s = services[2];
        else s = services[Math.floor(Math.random()*services.length)];
        
        const isCancelled = Math.random() < 0.15;
        const isFuture = d > new Date(2026, 5, 9); // today is jun 9 roughly in mock space
        
        let status = 'Đã khám';
        if (isCancelled) status = 'Đã hủy';
        else if (isFuture) status = 'Đang chờ';
        
        const h = Math.floor(Math.random()*8) + 8;
        const time = `${String(h).padStart(2, '0')}:00`;

        apts.push({
            id: `apt-${String(aptId++).padStart(3, '0')}`,
            patientId: p.id,
            patientName: p.name,
            doctorId: doc.id,
            doctorName: doc.name,
            date: d.toISOString().split('T')[0],
            time: time,
            status: status,
            service: s.name,
            paymentStatus: isFuture || isCancelled ? "Chưa thanh toán" : "Đã thanh toán",
            fee: s.price,
            notes: ""
        });
    }
}

const newAppointmentsStr = `export const mockAppointments = [\n` + 
  apts.map(a => `    ${JSON.stringify(a, null, 2).replace(/\n/g, '\n    ')}`).join(',\n') +
`\n];`;

const regex = /export const mockAppointments = \[[\s\S]*?\];/;
if(regex.test(content)) {
    const newContent = content.replace(regex, newAppointmentsStr);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log("Replaced successfully! Generated " + apts.length + " appointments.");
} else {
    console.log("Could not find mockAppointments array.");
}
