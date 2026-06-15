import fs from 'fs';

function testHash(user_id) {
    const allCats = ['cat-01', 'cat-02', 'cat-03', 'cat-04', 'cat-05', 'cat-06', 'cat-07'];
    let hash = 0;
    for (let i = 0; i < user_id.length; i++) hash += user_id.charCodeAt(i);
    
    let specialties = [
        allCats[hash % 7],
        allCats[(hash + 3) % 7],
        allCats[(hash + 5) % 7]
    ];
    if (hash % 2 === 0) specialties.push('cat-01');
    specialties = Array.from(new Set(specialties));
    console.log(user_id, "=>", specialties);
}

testHash('7ee698de-1377-44ac-bee7-fcc5e0a04ef1');
