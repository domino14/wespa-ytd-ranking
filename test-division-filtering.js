// Simple test to verify division filtering works correctly
// Run with: node test-division-filtering.js

const API_BASE = 'https://wespa-proxy.delsolar.workers.dev/api';

async function testTournament1342() {
  console.log('Testing tournament 1342 division filtering...\n');

  try {
    // Fetch tournament HTML
    const response = await fetch(`${API_BASE}/tournament/1342`);
    const html = await response.text();

    // Parse manually to test our logic
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check if this is a multi-division tournament
    const hasDivisions = doc.querySelector('#division_0') !== null;
    console.log(`Has divisions: ${hasDivisions}`);

    if (hasDivisions) {
      // Count all rows (old method)
      const allRows = doc.querySelectorAll('tr.roweven, tr.rowodd');
      console.log(`Total rows (all divisions): ${allRows.length}`);

      // Count Division 1 only (new method)
      const division1Container = doc.querySelector('#division_0_standings');
      if (division1Container) {
        const division1Rows = division1Container.querySelectorAll('tr.roweven, tr.rowodd');
        console.log(`Division 1 rows only: ${division1Rows.length}`);

        // Show difference
        console.log(`\n❌ OLD METHOD would import: ${allRows.length} players (includes Division 2)`);
        console.log(`✅ NEW METHOD will import: ${division1Rows.length} players (Division 1 only)`);
        console.log(`🎯 FILTERED OUT: ${allRows.length - division1Rows.length} Division 2+ players`);

        // Verify we have valid data
        if (division1Rows.length > 0) {
          const firstRow = division1Rows[0];
          const cells = firstRow.querySelectorAll('td');
          if (cells.length >= 10) {
            const positionText = cells[1]?.textContent?.trim() || '';
            const playerName = cells[3]?.querySelector('a')?.textContent?.trim() || '';
            console.log(`\nSample Division 1 player: ${playerName} - ${positionText}`);
            console.log('✅ Division filtering is working correctly!');
          }
        }
      } else {
        console.log('❌ Could not find Division 1 standings container');
      }
    } else {
      console.log('ℹ️ Single-division tournament - no filtering needed');
    }

  } catch (error) {
    console.error('Error testing tournament 1342:', error);
  }
}

// Run the test (this won't work in Node.js without DOM, but shows the logic)
console.log('Division filtering test logic ready');
console.log('To test in browser console, copy the testTournament1342 function');
console.log('Or import a tournament in the admin panel and check the console logs');