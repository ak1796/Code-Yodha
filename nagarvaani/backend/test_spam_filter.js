const { filterSpam } = require('./src/services/spamFilter');

async function testSpam() {
  const tests = [
    { text: "hhhhhhh", label: "Repeated chars" },
    { text: "hello", label: "Short text / few words" },
    { text: "scam alert", label: "Promo keyword" },
    { text: "The water pipe is broken on MG Road. Please fix it immediately.", label: "Valid complaint" }
  ];

  console.log("=== Spam Filter Verification ===\n");
  for (const t of tests) {
    const result = await filterSpam(t.text);
    console.log(`[${t.label}] Input: "${t.text}"`);
    console.log(`Result: ${result.status} (Reason: ${result.reason || 'N/A'})\n`);
  }
}

testSpam();
