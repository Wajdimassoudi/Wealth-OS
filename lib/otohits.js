export async function boostTraffic() {
  const visits = 1000;
  
  try {
    await fetch('https://www.otohits.net/api/points/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OTOHITS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        link_id: process.env.OTOHITS_LINK_ID,
        points: visits
      })
    });
  } catch(e) {}
}
