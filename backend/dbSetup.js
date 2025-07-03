const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function initializeDatabase() {
  const db = await open({
    filename: './auction.db',
    driver: sqlite3.Database,
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS dsps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      targeting_rules TEXT NOT NULL,
      base_bid_price REAL NOT NULL DEFAULT 0.0,
      ad_creative_image_url TEXT NOT NULL,
      ad_creative_click_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ad_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      publisher_id TEXT NOT NULL,
      ad_slot_id TEXT NOT NULL,
      geo TEXT NOT NULL,
      device TEXT NOT NULL,
      request_time TEXT NOT NULL,
      winner_dsp_id TEXT,
      winning_bid_price REAL,
      status TEXT NOT NULL,
      FOREIGN KEY (winner_dsp_id) REFERENCES dsps(id)
    );
  `);

  const { count } = await db.get(`SELECT COUNT(*) as count FROM dsps`);
  if (count === 0) {
    await db.run(`
      INSERT INTO dsps (
        id, name, targeting_rules, base_bid_price, ad_creative_image_url, ad_creative_click_url
      ) VALUES
        ('DSP_A', 'Alpha DSP', '{"geo": "US", "device": "mobile"}', 3.5,
         'https://via.placeholder.com/300x100?text=Alpha+DSP',
         'https://example.com/alpha'),

        ('DSP_B', 'Beta DSP', '{"geo": "US", "device": "desktop"}', 2.5,
         'https://via.placeholder.com/300x100?text=Beta+DSP',
         'https://example.com/beta'),

        ('DSP_C', 'Gamma DSP', '{"geo": "IN", "device": "mobile"}', 3.2,
         'https://via.placeholder.com/300x100?text=Gamma+DSP',
         'https://example.com/gamma');
    `);

    console.log("DSPs seeded successfully.");
  }

  await db.close();
  console.log("DB initialized and closed.");
}

initializeDatabase().catch(console.error);
