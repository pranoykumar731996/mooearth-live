// Node.js has native fetch in v18+

const API_URL = 'http://localhost:3000/api/quiz/next';

async function testCountry(country, category) {
  console.log(`\nTesting: country="${country}", category="${category}"`);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country,
        category,
        username: 'test_user_audit',
        answeredIds: []
      })
    });

    if (!res.ok) {
      console.error(`Error response: ${res.status}`);
      return;
    }

    const data = await res.json();
    if (data.question) {
      console.log(`-> Canonical resolved country: "${data.question.country}"`);
      console.log(`-> Question category: "${data.question.category}"`);
      console.log(`-> Question text: "${data.question.question}"`);
      console.log(`-> Choices length: ${data.question.choices.length} (${JSON.stringify(data.question.choices)})`);
      console.log(`-> Source: "${data.source}"`);
      
      if (data.question.choices.length !== 4) {
        console.error(`❌ FAILED: Choices length is ${data.question.choices.length}, expected 4!`);
      } else {
        console.log(`✅ SUCCESS: Choices length is exactly 4`);
      }
    } else {
      console.log(`-> No question returned. Error:`, data);
    }
  } catch (err) {
    console.error(`Fetch error:`, err.message);
  }
}

async function runAll() {
  // Test case 1: Accent Normalization (Côte d'Ivoire)
  await testCountry("Côte d'Ivoire", "geography");

  // Test case 2: Dem. Rep. Congo mapping
  await testCountry("Dem. Rep. Congo", "geography");

  // Test case 3: Bosnia and Herz. mapping
  await testCountry("Bosnia and Herz.", "geography");

  // Test case 4: Empty category fallback (Libya -> sports)
  // Libya is in COUNTRY_METADATA but has no sports category. It should fall back to Mixed or Universal.
  await testCountry("Libya", "sports");

  // Test case 5: Option length bug check when canonical is one of the fallback wrong options
  // e.g. Brazil -> sports
  await testCountry("Brazil", "sports");

  // Test case 6: Current Affairs category check
  await testCountry("India", "current-affairs");
  await testCountry("Japan", "current-affairs");
}

runAll();
