const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = './auction.db';
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log('🚀 Server running at http://localhost:3001/');
    });
  } catch (e) {
    console.log(`❌ DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post('/ad-request', async (req, res) => {
  try {
    const { publisher_id, ad_slot_id, geo, device, time, custom_bid } = req.body;

    const insertRequest = `
      INSERT INTO ad_requests (publisher_id, ad_slot_id, geo, device, request_time, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await db.run(insertRequest, [publisher_id, ad_slot_id, geo, device, time, 'pending']);
    const requestId = result.lastID;

    const dsps = await db.all(`SELECT * FROM dsps`);
    const bids = [];

    dsps.forEach(dsp => {
      const rules = JSON.parse(dsp.targeting_rules);
      if (rules.geo === geo && rules.device === device) {
        let bidPrice = 1.0;
        if (geo === 'US' && device === 'mobile') bidPrice = 3.5;
        else if (geo === 'US' && device === 'desktop') bidPrice = 2.5;
        else if (geo === 'IN' && device === 'mobile') bidPrice = 3.2;

        bids.push({
          dsp_id: dsp.id,
          bid_price: bidPrice,
          creative: {
            image_url: dsp.ad_creative_image_url,
            click_url: dsp.ad_creative_click_url,
          },
          is_temp: false
        });
      }
    });

    if (custom_bid) {
      const userBid = parseFloat(custom_bid);
      const maxDSPBid = bids.length > 0 ? Math.max(...bids.map(b => b.bid_price)) : 0;

      if (userBid > maxDSPBid) {
        bids.push({
          dsp_id: `Temp_${Math.floor(Math.random() * 1000)}`,
          bid_price: userBid,
          creative: {
            image_url: 'https://example.com/custom_ad.png',
            click_url: 'https://example.com/custom_click',
          },
          is_temp: true
        });
      }
    }

    if (bids.length === 0) {
      await db.run(`UPDATE ad_requests SET status='no_winner' WHERE id = ?`, requestId);
      return res.status(204).send();
    }

    const winner = bids.reduce((max, cur) => (cur.bid_price > max.bid_price ? cur : max));
    const status = winner.is_temp ? 'custom_winner' : 'completed';
    const winnerId = winner.is_temp ? null : winner.dsp_id;

    await db.run(
      `UPDATE ad_requests SET winner_dsp_id = ?, winning_bid_price = ?, status = ? WHERE id = ?`,
      [winnerId, winner.bid_price, status, requestId]
    );

    res.status(200).json({
      winner_dsp: winner.dsp_id,
      bid_price: winner.bid_price,
      creative: winner.creative,
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
