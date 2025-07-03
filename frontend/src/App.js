import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {
    adRequests: [],
    geo: 'US',
    device: 'mobile',
    customBid: '',
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleAdRequest = async () => {
    const { geo, device, customBid } = this.state;
    const requestData = {
      publisher_id: '123',
      ad_slot_id: 'banner_top',
      geo,
      device,
      time: new Date().toISOString(),
      custom_bid: parseFloat(customBid) || 0,
    };

    try {
      const response = await fetch('http://localhost:3001/ad-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (response.status === 200) {
        const result = await response.json();
        const newRequest = {
          id: this.state.adRequests.length + 1,
          geo,
          device,
          time: requestData.time,
          winner_dsp: result.winner_dsp,
          bid_price: result.bid_price,
          image_url: result.creative.image_url,
          click_url: result.creative.click_url,
        };
        this.setState((prevState) => ({
          adRequests: [newRequest, ...prevState.adRequests],
        }));
      } else {
        alert('No eligible bids found');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong!');
    }
  };

  render() {
    const { geo, device, customBid, adRequests } = this.state;

    return (
      <div className="app-container">
        <h2>🧠 SSP Ad Auction Simulator</h2>

        <div className="form-container">
          <label>Geo:</label>
          <select name="geo" value={geo} onChange={this.handleChange}>
            <option value="US">US</option>
            <option value="IN">IN</option>
            <option value="UK">UK</option>
          </select>

          <label>Device:</label>
          <select name="device" value={device} onChange={this.handleChange}>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
          </select>

          <label>Bid Price ($):</label>
          <input type="text" name="customBid" value={customBid} onChange={this.handleChange} placeholder="Optional" />

          <button onClick={this.handleAdRequest}>Send Ad Request</button>
        </div>

        <table className="result-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Geo</th>
              <th>Device</th>
              <th>Time</th>
              <th>Winner DSP</th>
              <th>Bid ($)</th>
              <th>Creative</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {adRequests.map((req, index) => (
              <tr key={index}>
                <td>{req.id}</td>
                <td>{req.geo}</td>
                <td>{req.device}</td>
                <td>{new Date(req.time).toLocaleString()}</td>
                <td>{req.winner_dsp}</td>
                <td>{req.bid_price}</td>
                <td>
                  <img src={req.image_url} alt="ad" />
                </td>
                <td>
                  <a href={req.click_url} target="_blank" rel="noopener noreferrer">Visit</a>
                </td>
              </tr>
            ))}
            {adRequests.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-row">No requests made yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
}

export default App;
