const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB
const db = new sqlite3.Database('./auction.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) console.error(err);
  else console.log('DB connected.');
});

// POST /ad-request
app.post('/ad-request', (req, res) => {
  const { publisher_id, ad_slot_id, geo, device, time } = req.body;

  const insertRequest = `INSERT INTO ad_requests (publisher_id, ad_slot_id, geo, device, request_time, status)
    VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(insertRequest, [publisher_id, ad_slot_id, geo, device, time, 'pending'], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    const requestId = this.lastID;

    db.all(`SELECT * FROM dsps`, (err, dsps) => {
      if (err) return res.status(500).json({ error: err.message });

      const bids = [];

      dsps.forEach(dsp => {
        const rules = JSON.parse(dsp.targeting_rules);
        const matchesGeo = rules.geo === geo;
        const matchesDevice = rules.device === device;

        if (matchesGeo && matchesDevice) {
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
          });
        }
      });

      if (bids.length === 0) {
        db.run(`UPDATE ad_requests SET status='no_winner' WHERE id = ?`, [requestId]);
        return res.status(204).send(); // No Content
      }

      const winner = bids.reduce((max, cur) => (cur.bid_price > max.bid_price ? cur : max));

      db.run(`UPDATE ad_requests SET winner_dsp_id = ?, winning_bid_price = ?, status = 'completed' WHERE id = ?`, 
        [winner.dsp_id, winner.bid_price, requestId]);

      res.status(200).json({
        winner_dsp: winner.dsp_id,
        bid_price: winner.bid_price,
        creative: winner.creative,
      });
    });
  });
});

// Start server
app.listen(3001, () => {
  console.log('Server running on port 3001');
});
