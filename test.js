import fetch from 'node-fetch';

async function testInsights() {
  try {
    const res = await fetch('http://localhost:3000/api/generate-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Infrastructure',
        severity: 'HIGH',
        location: '123 Main St',
        stats: {
          categoryCount: 5,
          highSeverityCount: 2,
          hotspotZone: 'Downtown',
          averageResolutionDays: 3.5
        }
      })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testInsights();
